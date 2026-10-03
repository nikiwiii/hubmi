import time
import logging
from typing import List, Dict, Any, Optional, Tuple, Set
from config import GROQ_API_KEY, GROQ_MODEL, SIMILARITY_THRESHOLD, CLOSE_MATCH_DELTA
from supabase_client import DatabaseRepository
from matching.embeddings import compute_embedding, cosine_similarity, compute_lexical_overlap
from matching.schemas import (
    MatchRequest,
    MatchResponse,
    InnovationMatchItem,
    ExplainabilityInfo,
    TraceStep,
    ChatMessage
)

logger = logging.getLogger("hubmi.matching")

class MatchingService:
    @staticmethod
    def _is_obviously_off_topic(query: str) -> bool:
        """Wykrywa zapytania ewidentnie niezwiązane z innowacjami społecznymi, projektami czy problemami."""
        off_topic_patterns = [
            "przepis na", "ugotuj", "upiecz", "ciasto", "pogoda w",
            "stolica ", "ile to jest", "kto wygrał", "żart", "dowcip",
            "opowiedz bajkę", "napisz wiersz o miłości", "zagrajmy w",
            "jak zrobić pizzę", "rozwiąż równanie"
        ]
        q_lower = query.lower()
        return any(pattern in q_lower for pattern in off_topic_patterns)

    @classmethod
    def match_and_chat(cls, request: MatchRequest) -> MatchResponse:
        overall_start = time.perf_counter()
        trace: List[TraceStep] = []
        step_idx = 1

        query = request.message.strip()

        # ---------------------------------------------------------
        # KROK 1: Analiza zapytania (Query Analysis)
        # ---------------------------------------------------------
        t0 = time.perf_counter()
        keywords = [w for w in query.lower().split() if len(w) > 3]
        trace.append(TraceStep(
            step_number=step_idx,
            name="1. QUERY_ANALYSIS",
            status="OK",
            duration_ms=round((time.perf_counter() - t0) * 1000, 2),
            details={
                "raw_query": query,
                "query_length": len(query),
                "keywords_extracted": keywords[:8],
                "history_length": len(request.conversation_history or [])
            }
        ))
        step_idx += 1

        # ---------------------------------------------------------
        # KROK 2: Generowanie wektora embeddingu (Embedding)
        # ---------------------------------------------------------
        t0 = time.perf_counter()
        query_vector = compute_embedding(query)
        trace.append(TraceStep(
            step_number=step_idx,
            name="2. EMBEDDING_GENERATION",
            status="OK",
            duration_ms=round((time.perf_counter() - t0) * 1000, 2),
            details={
                "model": "all-MiniLM-L6-v2",
                "dimensions": len(query_vector),
                "sample_values": [round(x, 4) for x in query_vector[:5]]
            }
        ))
        step_idx += 1

        # ---------------------------------------------------------
        # KROK 3: Vector Similarity Search po tabeli innovations (Hybrid RAG)
        # ---------------------------------------------------------
        t0 = time.perf_counter()
        all_innovations = DatabaseRepository.get_all_innovations()
        scored_innovations: List[Tuple[float, float, float, Set[str], Dict[str, Any]]] = []

        for item in all_innovations:
            emb = item.get("embedding")
            if not emb:
                text = f"{item.get('title', '')}. Problem: {item.get('addressed_problems', '')}. Opis: {item.get('description', '')}"
                emb = compute_embedding(text)
                item["embedding"] = emb
            
            vec_sim = cosine_similarity(query_vector, emb)
            doc_text = f"{item.get('title', '')} {item.get('addressed_problems', '')} {item.get('description', '')} {item.get('funding_info', '')} {item.get('target_group', '')}"
            lex_score, matched_tokens = compute_lexical_overlap(query, doc_text)

            # Połączenie semantyki i dopasowania leksykalnego (Hybrid Search)
            if lex_score > 0:
                final_sim = 0.5 * vec_sim + 0.5 * lex_score
            else:
                # Jeśli brak jakichkolwiek wspólnych słów kluczowych, obniżamy score
                final_sim = vec_sim * 0.4

            scored_innovations.append((final_sim, vec_sim, lex_score, matched_tokens, item))

        # Sortuj od największego podobieństwa
        scored_innovations.sort(key=lambda x: x[0], reverse=True)

        top_similarity = scored_innovations[0][0] if scored_innovations else 0.0
        top_item = scored_innovations[0][4] if scored_innovations else None
        top_matched_tokens = scored_innovations[0][3] if scored_innovations else set()

        trace.append(TraceStep(
            step_number=step_idx,
            name="3. VECTOR_SIMILARITY_SEARCH",
            status="OK",
            duration_ms=round((time.perf_counter() - t0) * 1000, 2),
            details={
                "total_innovations_scanned": len(all_innovations),
                "top_similarity_score": round(top_similarity, 4),
                "top_candidates": [
                    {
                        "title": item.get("title"),
                        "hybrid_sim": round(sim, 4),
                        "vec_sim": round(v_sim, 4),
                        "lex_score": round(l_sim, 4),
                        "matched_tokens": list(toks)
                    }
                    for sim, v_sim, l_sim, toks, item in scored_innovations[:3]
                ]
            }
        ))
        step_idx += 1

        # ---------------------------------------------------------
        # KROK 4: Railway / Guardrails (Sprawdzenie powiązania z bazą)
        # ---------------------------------------------------------
        t0 = time.perf_counter()
        is_off_topic = cls._is_obviously_off_topic(query)
        # Projekt nie istnieje w bazie, jeśli similarity < próg lub brak słów kluczowych
        is_not_found = (top_similarity < SIMILARITY_THRESHOLD) or (len(top_matched_tokens) == 0) or not scored_innovations

        if is_off_topic or is_not_found:
            guardrail_type = "BLOCKED_OFF_TOPIC" if is_off_topic else "BLOCKED_NOT_FOUND"
            rejection_message = (
                "Niestety nie mogę odpowiedzieć na to pytanie. Jako asystent Hubmi odpowiadam wyłącznie na pytania powiązane z innowacjami i projektami społecznymi dostępnymi w naszej bazie danych."
                if is_off_topic else
                "Niestety nie znaleziono w bazie innowacji projektu powiązanego z Twoim zapytaniem. W naszej bazie nie ma obecnie rozwiązania dla tego problemu. Spróbuj opisać wyzwanie innymi słowami lub zapytać o inny obszar (np. wsparcie seniorów, domy opieki, OZE, edukacja)."
            )

            trace.append(TraceStep(
                step_number=step_idx,
                name="4. GUARDRAILS_EVALUATION",
                status="BLOCKED",
                duration_ms=round((time.perf_counter() - t0) * 1000, 2),
                details={
                    "guardrail_status": guardrail_type,
                    "top_similarity": round(top_similarity, 4),
                    "threshold_required": SIMILARITY_THRESHOLD,
                    "matched_tokens_count": len(top_matched_tokens),
                    "is_off_topic": is_off_topic,
                    "decision": "Odpowiedź zablokowana zgodnie z regułami Railway / Guardrails"
                }
            ))

            total_ms = round((time.perf_counter() - overall_start) * 1000, 2)
            return MatchResponse(
                answer=rejection_message,
                guardrail_status=guardrail_type,
                guardrail_message=rejection_message,
                top_solution=None,
                close_solutions=[],
                explainability=None,
                trace=trace,
                total_duration_ms=total_ms
            )

        trace.append(TraceStep(
            step_number=step_idx,
            name="4. GUARDRAILS_EVALUATION",
            status="OK",
            duration_ms=round((time.perf_counter() - t0) * 1000, 2),
            details={
                "guardrail_status": "PASSED",
                "top_similarity": round(top_similarity, 4),
                "threshold_required": SIMILARITY_THRESHOLD,
                "relevance_verdict": "Zapytanie powiązane z bazą projektów innowacji"
            }
        ))
        step_idx += 1

        # ---------------------------------------------------------
        # KROK 5: Wybór najlepszego rozwiązania i do 2 innych (do 5% różnicy)
        # ---------------------------------------------------------
        t0 = time.perf_counter()
        best_sim, _, _, best_tokens, best_item = scored_innovations[0]

        top_solution = InnovationMatchItem(
            id=str(best_item.get("id")),
            title=best_item.get("title", ""),
            problem_statement=best_item.get("addressed_problems", best_item.get("problem_statement", "")),
            solution=best_item.get("description", best_item.get("solution", "")),
            funding_info=best_item.get("funding_info"),
            target_group=best_item.get("target_group"),
            url=best_item.get("url"),
            file_source=best_item.get("file_source"),
            similarity=round(best_sim, 4),
            similarity_percentage=f"{round(best_sim * 100, 1)}%",
            is_top_match=True,
            is_close_match=False
        )

        # Szukamy do 2 innych rozwiązań z podobieństwem w granicy 5% (>= best_sim - CLOSE_MATCH_DELTA)
        close_solutions: List[InnovationMatchItem] = []
        cutoff = best_sim - CLOSE_MATCH_DELTA

        for sim, _, _, _, item in scored_innovations[1:]:
            if sim >= cutoff and len(close_solutions) < 2:
                close_solutions.append(InnovationMatchItem(
                    id=str(item.get("id")),
                    title=item.get("title", ""),
                    problem_statement=item.get("addressed_problems", item.get("problem_statement", "")),
                    solution=item.get("description", item.get("solution", "")),
                    funding_info=item.get("funding_info"),
                    target_group=item.get("target_group"),
                    url=item.get("url"),
                    file_source=item.get("file_source"),
                    similarity=round(sim, 4),
                    similarity_percentage=f"{round(sim * 100, 1)}%",
                    is_top_match=False,
                    is_close_match=True
                ))

        trace.append(TraceStep(
            step_number=step_idx,
            name="5. CANDIDATE_FILTERING_5_PERCENT",
            status="OK",
            duration_ms=round((time.perf_counter() - t0) * 1000, 2),
            details={
                "top_solution_id": top_solution.id,
                "top_solution_title": top_solution.title,
                "top_similarity": top_solution.similarity,
                "cutoff_threshold_5_percent": round(cutoff, 4),
                "close_solutions_count": len(close_solutions),
                "close_solutions": [
                    {"title": c.title, "similarity": c.similarity, "percentage": c.similarity_percentage}
                    for c in close_solutions
                ]
            }
        ))
        step_idx += 1

        # ---------------------------------------------------------
        # KROK 6: Wyjaśnialność (Explainability) & Identyfikacja pliku
        # ---------------------------------------------------------
        t0 = time.perf_counter()
        matched_aspects_list = [
            f"Dopasowane zagadnienia i słowa kluczowe: {', '.join(sorted(best_tokens)) if best_tokens else 'Semantyczne'}",
            f"Grupa docelowa: {top_solution.target_group or 'Wszyscy beneficjenci'}",
            f"Dofinansowanie / Źródła środków: {top_solution.funding_info or 'Dostępne dotacje celowe'}"
        ]

        explainability = ExplainabilityInfo(
            summary=(
                f"Rozwiązanie '{top_solution.title}' zostało wybrane, ponieważ bezpośrednio odpowiada na zidentyfikowany problem "
                f"w obszarze: {top_solution.target_group or 'społeczności'}. Oferuje ono sprawdzony model działania oraz możliwość "
                f"sfinansowania: {top_solution.funding_info or 'dostępne dotacje regionalne'}."
            ),
            matched_aspects=matched_aspects_list,
            source_file=top_solution.file_source or "Nieokreślony plik źródłowy",
            source_url=top_solution.url or "https://hubmi.org/innowacje"
        )

        trace.append(TraceStep(
            step_number=step_idx,
            name="6. EXPLAINABILITY_EXTRACTION",
            status="OK",
            duration_ms=round((time.perf_counter() - t0) * 1000, 2),
            details={
                "source_file": explainability.source_file,
                "source_url": explainability.source_url,
                "matched_aspects_count": len(explainability.matched_aspects)
            }
        ))
        step_idx += 1

        # ---------------------------------------------------------
        # KROK 7: Generowanie odpowiedzi przez Groq API (RAG Chatbot)
        # ---------------------------------------------------------
        t0 = time.perf_counter()
        chat_answer = cls._generate_groq_answer(
            user_query=query,
            history=request.conversation_history or [],
            top_solution=top_solution,
            close_solutions=close_solutions,
            explainability=explainability
        )

        trace.append(TraceStep(
            step_number=step_idx,
            name="7. GROQ_RAG_SYNTHESIS",
            status="OK",
            duration_ms=round((time.perf_counter() - t0) * 1000, 2),
            details={
                "llm_provider": "Groq API" if GROQ_API_KEY else "Local Template Fallback",
                "model": GROQ_MODEL,
                "answer_length": len(chat_answer),
                "used_top_solution": top_solution.title
            }
        ))

        total_ms = round((time.perf_counter() - overall_start) * 1000, 2)
        return MatchResponse(
            answer=chat_answer,
            guardrail_status="PASSED",
            guardrail_message=None,
            top_solution=top_solution,
            close_solutions=close_solutions,
            explainability=explainability,
            trace=trace,
            total_duration_ms=total_ms
        )

    @staticmethod
    def _generate_groq_answer(
        user_query: str,
        history: List[ChatMessage],
        top_solution: InnovationMatchItem,
        close_solutions: List[InnovationMatchItem],
        explainability: ExplainabilityInfo
    ) -> str:
        """Wywołuje Groq API z ustrukturyzowanym promptem RAG lub zwraca dopasowaną odpowiedź fallback."""
        
        if GROQ_API_KEY:
            try:
                from groq import Groq
                client = Groq(api_key=GROQ_API_KEY)

                context_blocks = [
                    f"NAJLEPSZE DOPASOWANIE (Podobieństwo: {top_solution.similarity_percentage}):\n"
                    f"Tytuł: {top_solution.title}\n"
                    f"Problem: {top_solution.problem_statement}\n"
                    f"Rozwiązanie: {top_solution.solution}\n"
                    f"Dofinansowanie: {top_solution.funding_info or 'Brak danych'}\n"
                    f"Grupa docelowa: {top_solution.target_group or 'Brak danych'}\n"
                    f"Plik źródłowy: {top_solution.file_source or 'dokument'}\n"
                    f"URL projektu: {top_solution.url or 'brak'}"
                ]

                if close_solutions:
                    context_blocks.append("\nINNE ZBLIŻONE ROZWIĄZANIA (w granicy 5% podobieństwa):")
                    for idx, c in enumerate(close_solutions, 1):
                        context_blocks.append(
                            f"{idx}. {c.title} (Podobieństwo: {c.similarity_percentage})\n"
                            f"   Rozwiązanie: {c.solution[:140]}...\n"
                            f"   Dofinansowanie: {c.funding_info or 'Standardowe'}\n"
                            f"   URL: {c.url}"
                        )

                system_prompt = (
                    "Jesteś inteligentnym doradcą i chatbotem platformy Hubmi ds. Innowacji Społecznych i Dofinansowań.\n"
                    "Odpowiadasz użytkownikowi w języku polskim, w sposób uprzejmy, konkretny i profesjonalny.\n"
                    "ZASADY:\n"
                    "1. Opieraj się WYŁĄCZNIE na dostarczonych innowacjach z kontekstu bazy danych.\n"
                    "2. Przedstaw użytkownikowi najbliższe rozwiązanie jego problemu, wyjaśnij dlaczego pasuje (Explainability), "
                    "oraz koniecznie wskaż dostępne opcje dofinansowania i link źródłowy (URL) do projektu.\n"
                    "3. Jeśli w kontekście są wymienione zbliżone rozwiązania (z podobieństwem do 5%), krótko o nich wspomnij jako alternatywach.\n"
                    "4. Zadbaj o przejrzystość wypowiedzi (używaj punktorów i pogrubień).\n\n"
                    f"KONTEKST BAZY DANYCH:\n{''.join(context_blocks)}"
                )

                messages = [{"role": "system", "content": system_prompt}]
                for h in history[-4:]:
                    messages.append({"role": h.role, "content": h.content})
                messages.append({"role": "user", "content": user_query})

                chat_completion = client.chat.completions.create(
                    messages=messages,
                    model=GROQ_MODEL,
                    temperature=0.3,
                    max_tokens=800
                )
                return chat_completion.choices[0].message.content
            except Exception as e:
                logger.error(f"Błąd podczas wywołania Groq API: {e}. Zastosowano fallback odpowiedzi.")

        # Fallback generowania odpowiedzi
        alternatives_text = ""
        if close_solutions:
            alternatives_text = "\n\n🔍 **Inne zbliżone rozwiązania (różnica podobieństwa do 5%):**\n"
            for c in close_solutions:
                alternatives_text += (
                    f"- **{c.title}** (Podobieństwo: {c.similarity_percentage})\n"
                    f"  {c.solution[:150]}...\n"
                    f"  🔗 [Zobacz szczegóły]({c.url})\n"
                )

        funding_text = f"**Dofinansowanie:** {top_solution.funding_info}" if top_solution.funding_info else "**Dofinansowanie:** Dostępne ze środków funduszy regionalnych."

        return (
            f"Znalazłem w naszej bazie projekt, który najlepiej odpowiada na Twój problem!\n\n"
            f"### 🏆 Najbliższe rozwiązanie: **{top_solution.title}**\n"
            f"- **Podobieństwo semantyczne:** {top_solution.similarity_percentage}\n"
            f"- **Opis rozwiązania:** {top_solution.solution}\n"
            f"- 💰 {funding_text}\n"
            f"- 👥 **Grupa docelowa:** {top_solution.target_group or 'Osoby wymagające wsparcia'}\n"
            f"- 📄 **Dokument źródłowy:** `{explainability.source_file}`\n"
            f"- 🔗 **Link do projektu:** [{top_solution.url}]({top_solution.url})\n\n"
            f"💡 **Dlaczego to rozwiązanie (Explainability)?**\n"
            f"{explainability.summary}"
            f"{alternatives_text}\n\n"
            f"Czy chciałbyś dowiedzieć się więcej o procedurze aplikowania o to dofinansowanie?"
        )
