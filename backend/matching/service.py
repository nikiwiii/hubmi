import time
import logging
import re
import urllib.parse
from typing import List, Dict, Any, Optional, Tuple, Set

from config import GROQ_API_KEY, GROQ_MODEL, SIMILARITY_THRESHOLD, CLOSE_MATCH_DELTA
from supabase_client import DatabaseRepository
from matching.embeddings import compute_embedding, cosine_similarity, compute_lexical_overlap, MODEL_NAME
from matching.schemas import (
    MatchRequest,
    MatchResponse,
    InnovationMatchItem,
    ExplainabilityInfo,
    TraceStep,
    ChatMessage,
    CommunityIdeaMatch,
    SimilarProblemMatch,
    MatchedExpert,
    NextActionItem,
)

logger = logging.getLogger("hubmi.matching")

# Predefiniowana baza dedykowanych ekspertów ROPS Kraków ds. dziedzin wsparcia
EXPERTS_DIRECTORY = [
    {
        "keywords": ["senior", "samotn", "starsz", "opieka", "wytchnieniow", "alzheimer", "dps", "dom opieki", "emeryt"],
        "name": "mgr Anna Kowalska",
        "title": "Starszy Doradca ds. Usług Społecznych i Senioralnych",
        "department": "Dział Rozwoju Usług Społecznych ROPS Kraków",
        "specialization": "Opieka wytchnieniowa, integracja seniorów, asystentura osobista",
    },
    {
        "keywords": ["barier", "architektur", "schod", "wózek", "niepełnosprawn", "dostepn", "mobiln", "podjazd"],
        "name": "inż. Paweł Zieliński",
        "title": "Koordynator Dostępności i Likwidacji Barier",
        "department": "Ośrodek Dostępności Przestrzennej ROPS Kraków",
        "specialization": "Likwidacja barier architektonicznych, audyty dostępności, innowacje transportowe",
    },
    {
        "keywords": ["transport", "dojazd", "lekarz", "wiejsk", "komunikacj", "wykluczen", "apteka", "leki", "pks"],
        "name": "mgr Michał Wiśniewski",
        "title": "Konsultant ds. Mobilności i Usług Wiejskich",
        "department": "Dział Innowacji Regionalnych ROPS Kraków",
        "specialization": "Transport na żądanie (door-to-door), mobilne punkty pomocy, peryferia",
    },
    {
        "keywords": ["dziec", "rodzin", "zastępcz", "piecza", "sierot", "wychowawcz", "młodzież", "rodzic"],
        "name": "mgr Magdalena Wójcik",
        "title": "Ekspert ds. Pieczy Zastępczej i Wsparcia Rodzin",
        "department": "Zespół Deinstytucjonalizacji Pieczy ROPS Kraków",
        "specialization": "Rodzicielstwo zastępcze, wsparcie kryzysowe, placówki opiekuńcze",
    },
    {
        "keywords": ["prac", "bezroboc", "ubóstw", "zasiłek", "pomoc społeczn", "pracownik socjalny", "ops", "mops"],
        "name": "mgr Tomasz Lewandowski",
        "title": "Konsultant ds. Ekonomii Społecznej i Pracy",
        "department": "Małopolskie Obserwatorium Polityki Społecznej",
        "specialization": "Centra integracji społecznej, spółdzielnie socjalne, zatrudnienie wspierane",
    },
]

DEFAULT_EXPERT = {
    "name": "dr hab. Krzysztof Maj",
    "title": "Główny Ekspert ds. Innowacji Społecznych",
    "department": "Regionalny Ośrodek Polityki Społecznej w Krakowie",
    "specialization": "Projektowanie innowacji, granty regionalne, skalowanie dobrych praktyk",
}


class MatchingService:
    @staticmethod
    def _is_obviously_off_topic(query: str) -> bool:
        """Wykrywa zapytania ewidentnie niezwiązane z polityką społeczną, wyzwaniami mieszkańców czy innowacjami."""
        off_topic_patterns = [
            "przepis na", "ugotuj", "upiecz", "ciasto", "pogoda w",
            "stolica ", "ile to jest", "kto wygrał", "żart", "dowcip",
            "opowiedz bajkę", "napisz wiersz o miłości", "zagrajmy w",
            "jak zrobić pizzę", "rozwiąż równanie", "kto jest prezydentem stanów",
            "wynik meczu", "kurs walut"
        ]
        q_lower = query.lower()
        return any(pattern in q_lower for pattern in off_topic_patterns)

    @classmethod
    def _find_matched_expert(cls, query: str, category: Optional[str] = None) -> MatchedExpert:
        """Dobiera najlepiej pasującego eksperta ROPS Kraków na podstawie zapytania i kategorii."""
        haystack = f"{query} {category or ''}".lower()
        best_expert = DEFAULT_EXPERT
        best_score = 0

        for exp in EXPERTS_DIRECTORY:
            score = sum(1 for kw in exp["keywords"] if kw in haystack)
            if score > best_score:
                best_score = score
                best_expert = exp

        topic_param = urllib.parse.quote(f"Konsultacja: {query[:60]}...")
        chat_url = f"/chat?topic={topic_param}"

        return MatchedExpert(
            name=best_expert["name"],
            title=best_expert["title"],
            department=best_expert["department"],
            specialization=best_expert["specialization"],
            chat_topic=f"Konsultacja problemu społecznego: {query[:50]}...",
            chat_url=chat_url,
        )

    @classmethod
    def _search_community_ideas(cls, query_vector: List[float], query_text: str) -> List[CommunityIdeaMatch]:
        """Wyszukuje powiązane pomysły mieszkańców z platformy Hubmi."""
        try:
            ideas = DatabaseRepository.get_all_ideas()
            if not ideas:
                return []

            matched: List[Tuple[float, Dict[str, Any]]] = []
            for item in ideas:
                doc_text = f"{item.get('title', '')} {item.get('description', '')} {item.get('category', '')}"
                lex_score, _ = compute_lexical_overlap(query_text, doc_text)
                if lex_score > 0.15:
                    matched.append((lex_score, item))

            matched.sort(key=lambda x: x[0], reverse=True)
            results: List[CommunityIdeaMatch] = []
            for score, itm in matched[:2]:
                results.append(CommunityIdeaMatch(
                    id=str(itm.get("id")),
                    title=itm.get("title", "Pomysł mieszkańca"),
                    description=(itm.get("description", "") or "")[:180] + ("..." if len(itm.get("description", "")) > 180 else ""),
                    category=itm.get("category"),
                    author_name=itm.get("author_name") or "Mieszkaniec Małopolski",
                    url=f"/discover/{itm.get('id')}",
                    similarity_percentage=f"{round(score * 100, 0):.0f}%"
                ))
            return results
        except Exception as e:
            logger.warning(f"Błąd wyszukiwania pomysłów społeczności: {e}")
            return []

    @classmethod
    def _search_similar_reported_problems(cls, query_text: str, current_powiat: Optional[str] = None) -> List[SimilarProblemMatch]:
        """Wyszukuje podobne wcześniej zgłoszone problemy z innych powiatów."""
        try:
            raw_problems = DatabaseRepository.get_reported_problems(limit=40)
            if not raw_problems:
                return []

            scored: List[Tuple[float, Dict[str, Any]]] = []
            for p in raw_problems:
                desc = p.get("problem_description", "")
                if not desc or len(desc) < 5:
                    continue
                lex_score, _ = compute_lexical_overlap(query_text, desc)
                if lex_score > 0.12:
                    scored.append((lex_score, p))

            scored.sort(key=lambda x: x[0], reverse=True)
            results: List[SimilarProblemMatch] = []
            for score, itm in scored[:2]:
                desc = itm.get("problem_description", "")
                # Parsowanie etykiet jeśli były zapisane w formacie [Kategoria: ... | Powiat: ... | Zgłaszający: ...]
                cat, pow_val, rep_val, text_clean = None, None, None, desc
                match = re.match(r"^\[Kategoria:\s*(.*?)\s*\|\s*Powiat:\s*(.*?)\s*\|\s*Zgłaszający:\s*(.*?)\]\s*(.*)$", desc)
                if match:
                    cat, pow_val, rep_val, text_clean = match.groups()

                results.append(SimilarProblemMatch(
                    id=str(itm.get("id")),
                    problem_text=text_clean[:140] + ("..." if len(text_clean) > 140 else ""),
                    powiat=pow_val or itm.get("powiat"),
                    category=cat or itm.get("category"),
                    reporter_type=rep_val or itm.get("reporter_type"),
                    status=itm.get("status", "zgłoszony"),
                    created_at=itm.get("created_at")
                ))
            return results
        except Exception as e:
            logger.warning(f"Błąd wyszukiwania podobnych problemów: {e}")
            return []

    @classmethod
    def match_and_chat(cls, request: MatchRequest) -> MatchResponse:
        overall_start = time.perf_counter()
        trace: List[TraceStep] = []
        step_idx = 1

        query = request.message.strip()
        category = request.category.strip() if request.category else None
        powiat = request.powiat.strip() if request.powiat else None
        reporter_type = request.reporter_type.strip() if request.reporter_type else "Mieszkaniec"

        # ---------------------------------------------------------
        # KROK 1: Analiza zapytania i kontekstu użytkownika
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
                "category": category,
                "powiat": powiat,
                "reporter_type": reporter_type,
                "keywords_extracted": keywords[:8],
                "history_length": len(request.conversation_history or [])
            }
        ))
        step_idx += 1

        # ---------------------------------------------------------
        # KROK 2: Generowanie wektora embeddingu wielojęzycznym modelem
        # ---------------------------------------------------------
        t0 = time.perf_counter()
        query_vector = compute_embedding(query)
        trace.append(TraceStep(
            step_number=step_idx,
            name="2. MULTILINGUAL_EMBEDDING_GENERATION",
            status="OK",
            duration_ms=round((time.perf_counter() - t0) * 1000, 2),
            details={
                "model": MODEL_NAME,
                "dimensions": len(query_vector),
                "sample_values": [round(x, 4) for x in query_vector[:5]]
            }
        ))
        step_idx += 1

        # ---------------------------------------------------------
        # KROK 3: Wyszukiwanie innowacji (Natywny pgvector RPC + Hybrydowy fallback)
        # ---------------------------------------------------------
        t0 = time.perf_counter()
        scored_innovations: List[Tuple[float, float, float, Set[str], Dict[str, Any]]] = []
        search_method = "python_hybrid_fallback"

        # Próba 1: Natywne wyszukiwanie pgvector w Supabase przez RPC match_innovations
        pgvector_matches = DatabaseRepository.match_innovations_pgvector(
            query_vector=query_vector,
            match_threshold=0.20,
            match_count=12
        )

        if pgvector_matches:
            search_method = "supabase_pgvector_rpc"
            for item in pgvector_matches:
                vec_sim = float(item.get("similarity", 0.0))
                doc_text = f"{item.get('title', '')} {item.get('addressed_problems', '')} {item.get('description', '')}"
                lex_score, matched_tokens = compute_lexical_overlap(query, doc_text)
                final_sim = 0.6 * vec_sim + 0.4 * lex_score if lex_score > 0 else vec_sim
                scored_innovations.append((final_sim, vec_sim, lex_score, matched_tokens, item))
        else:
            # Próba 2: Hybrydowy fallback w Pythonie
            all_innovations = DatabaseRepository.get_all_innovations()
            for item in all_innovations:
                emb = item.get("embedding")
                if isinstance(emb, str):
                    import json
                    try:
                        emb = json.loads(emb)
                        item["embedding"] = emb
                    except Exception:
                        emb = None
                if not emb:
                    text = f"{item.get('title', '')}. Problem: {item.get('addressed_problems', item.get('addresed_problems', ''))}. Opis: {item.get('description', '')}"
                    emb = compute_embedding(text)
                    item["embedding"] = emb

                vec_sim = cosine_similarity(query_vector, emb)
                doc_text = f"{item.get('title', '')} {item.get('addressed_problems', item.get('addresed_problems', ''))} {item.get('description', '')} {item.get('funding_info', '')} {item.get('target_group', '')}"
                lex_score, matched_tokens = compute_lexical_overlap(query, doc_text)

                if lex_score > 0:
                    final_sim = 0.5 * vec_sim + 0.5 * lex_score
                else:
                    final_sim = vec_sim * 0.55

                scored_innovations.append((final_sim, vec_sim, lex_score, matched_tokens, item))

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
                "search_engine": search_method,
                "candidates_scored": len(scored_innovations),
                "top_similarity_score": round(top_similarity, 4),
                "top_candidates": [
                    {
                        "title": item.get("title"),
                        "hybrid_sim": round(sim, 4),
                        "vec_sim": round(v_sim, 4),
                        "lex_score": round(l_sim, 4),
                    }
                    for sim, v_sim, l_sim, _, item in scored_innovations[:3]
                ]
            }
        ))
        step_idx += 1

        # ---------------------------------------------------------
        # KROK 4: Wyszukiwanie wieloźródłowe (Społeczność, Zgłoszone Problemy, Ekspert)
        # ---------------------------------------------------------
        t0 = time.perf_counter()
        community_ideas = cls._search_community_ideas(query_vector, query)
        similar_problems = cls._search_similar_reported_problems(query, current_powiat=powiat)
        matched_expert = cls._find_matched_expert(query, category)

        trace.append(TraceStep(
            step_number=step_idx,
            name="4. MULTI_SOURCE_ENRICHMENT",
            status="OK",
            duration_ms=round((time.perf_counter() - t0) * 1000, 2),
            details={
                "community_ideas_found": len(community_ideas),
                "similar_problems_found": len(similar_problems),
                "matched_expert": matched_expert.name,
            }
        ))
        step_idx += 1

        # ---------------------------------------------------------
        # KROK 5: Guardrails & Obsługa ślepej uliczki (Next Actions)
        # ---------------------------------------------------------
        t0 = time.perf_counter()
        is_off_topic = cls._is_obviously_off_topic(query)
        is_not_found = (top_similarity < SIMILARITY_THRESHOLD) or not scored_innovations

        # Zapis zgłoszenia do bazy reported_problems (Zasobnik agreguje potrzeby)
        formatted_problem_desc = f"[Kategoria: {category or 'Ogólna'} | Powiat: {powiat or 'Małopolska'} | Zgłaszający: {reporter_type}] {query}"
        saved_problem = DatabaseRepository.save_reported_problem({
            "user_id": request.user_id,
            "problem_description": formatted_problem_desc,
            "embedding": query_vector,
            "matched_innovation_id": str(top_item.get("id")) if top_item and not is_not_found else None,
            "status": "matched" if not is_not_found else "needs_solution",
        })
        saved_problem_id = str(saved_problem.get("id", "")) if saved_problem else None

        propose_query_params = urllib.parse.quote(query)
        create_idea_url = f"/propose?problem={propose_query_params}&category={urllib.parse.quote(category or '')}"

        # Definiujemy ścieżki działania (Jury path)
        action_report = NextActionItem(
            action_id="report_problem",
            title="Zgłoś wyzwanie do Bazy Potrzeb Regionu",
            description="Twoje zgłoszenie zostało automatycznie zarejestrowane. Eksperci ROPS Kraków uwzględnią je przy planowaniu kolejnych naborów grantowych.",
            button_label="Zapisano w Bazie Potrzeb",
            url="/knowledge",
            icon_name="file-text",
            badge="Zarejestrowano"
        )
        action_creator = NextActionItem(
            action_id="create_idea",
            title="Stwórz rozwiązanie w Kreatorze Pomysłów",
            description="Masz pomysł, jak pomóc sąsiadom lub seniorom? Przekształć ten problem w gotowy projekt społeczny przy wsparciu naszego generatora.",
            button_label="Otwórz Kreator Pomysłów",
            url=create_idea_url,
            icon_name="lightbulb",
            badge="Rekomendowane"
        )
        action_expert = NextActionItem(
            action_id="chat_expert",
            title=f"Skonsultuj z ekspertem ({matched_expert.name})",
            description=f"Skontaktuj się bezpośrednio z pracownikiem ROPS Kraków specjalizującym się w obszarze: {matched_expert.specialization}.",
            button_label="Napisz do eksperta",
            url=matched_expert.chat_url,
            icon_name="message-circle",
            badge="Bezpłatna konsultacja"
        )

        next_actions = [action_creator, action_expert, action_report]

        if is_off_topic:
            total_ms = round((time.perf_counter() - overall_start) * 1000, 2)
            rejection_message = (
                "Jako Asystent Społeczny Hubmi odpowiadam wyłącznie na pytania powiązane z problemami mieszkańców, "
                "usługami opiekuńczymi i innowacjami społecznymi w Małopolsce.\n\n"
                "Możesz zapytać np. o: pomoc dla osób starszych, transport door-to-door, likwidację barier schodowych lub samotność w małych miejscowościach."
            )
            return MatchResponse(
                answer=rejection_message,
                guardrail_status="BLOCKED_OFF_TOPIC",
                guardrail_message=rejection_message,
                top_solution=None,
                close_solutions=[],
                explainability=None,
                community_ideas=[],
                similar_problems=[],
                matched_expert=matched_expert,
                next_actions=[action_creator, action_expert],
                saved_problem_id=saved_problem_id,
                trace=trace,
                total_duration_ms=total_ms
            )

        if is_not_found:
            total_ms = round((time.perf_counter() - overall_start) * 1000, 2)
            friendly_not_found_message = (
                "### Nie znaleźliśmy jeszcze gotowego rozwiązania w bibliotece innowacji\n\n"
                "W bazie gotowych innowacji ROPS Kraków nie ma obecnie projektu dokładnie rozwiązującego to konkretne wyzwanie. "
                "**Nie zostawiamy Cię jednak bez pomocy!** Twoje zgłoszenie zostało automatycznie zarejestrowane w Bazie Potrzeb Regionu.\n\n"
                "Oto ścieżki, które możesz teraz wybrać:\n"
                f"1. **Stwórz własny pomysł w Kreatorze** – kliknij poniżej, a treść Twojego problemu zostanie automatycznie przeniesiona do Kreatora Pomysłów.\n"
                f"2. **Porozmawiaj z ekspertem ROPS Kraków** – skonsultuj wyzwanie z naszym doradcą: **{matched_expert.name}** ({matched_expert.specialization}).\n"
                f"3. **Przejrzyj zgłoszenia z regionu** – sprawdź, jak z podobnymi barierami radzą sobie inne gminy w Małopolsce."
            )
            return MatchResponse(
                answer=friendly_not_found_message,
                guardrail_status="BLOCKED_NOT_FOUND",
                guardrail_message=friendly_not_found_message,
                top_solution=None,
                close_solutions=[],
                explainability=None,
                community_ideas=community_ideas,
                similar_problems=similar_problems,
                matched_expert=matched_expert,
                next_actions=next_actions,
                saved_problem_id=saved_problem_id,
                trace=trace,
                total_duration_ms=total_ms
            )

        # ---------------------------------------------------------
        # KROK 6: Wybór najlepszego rozwiązania i do 2 innych (do 5% różnicy)
        # ---------------------------------------------------------
        t0 = time.perf_counter()
        best_sim, _, _, best_tokens, best_item = scored_innovations[0]

        # Rzeczywisty link do innowacji (bez zmyślonego hubmi.org/innowacje)
        raw_url = best_item.get("url")
        clean_url = raw_url if (raw_url and raw_url.startswith("http")) else None

        top_solution = InnovationMatchItem(
            id=str(best_item.get("id")),
            title=best_item.get("title", ""),
            problem_statement=best_item.get("addressed_problems", best_item.get("problem_statement", "")),
            solution=best_item.get("description", best_item.get("solution", "")),
            funding_info=best_item.get("funding_info"),
            target_group=best_item.get("target_group"),
            url=clean_url,
            file_source=best_item.get("file_source"),
            similarity=round(best_sim, 4),
            similarity_percentage=f"{round(best_sim * 100, 1)}%",
            is_top_match=True,
            is_close_match=False
        )

        close_solutions: List[InnovationMatchItem] = []
        cutoff = best_sim - CLOSE_MATCH_DELTA

        for sim, _, _, _, item in scored_innovations[1:]:
            if sim >= cutoff and len(close_solutions) < 2:
                c_url = item.get("url")
                clean_c_url = c_url if (c_url and c_url.startswith("http")) else None
                close_solutions.append(InnovationMatchItem(
                    id=str(item.get("id")),
                    title=item.get("title", ""),
                    problem_statement=item.get("addressed_problems", item.get("problem_statement", "")),
                    solution=item.get("description", item.get("solution", "")),
                    funding_info=item.get("funding_info"),
                    target_group=item.get("target_group"),
                    url=clean_c_url,
                    file_source=item.get("file_source"),
                    similarity=round(sim, 4),
                    similarity_percentage=f"{round(sim * 100, 1)}%",
                    is_top_match=False,
                    is_close_match=True
                ))

        trace.append(TraceStep(
            step_number=step_idx,
            name="5. CANDIDATE_SELECTION",
            status="OK",
            duration_ms=round((time.perf_counter() - t0) * 1000, 2),
            details={
                "top_solution_id": top_solution.id,
                "top_solution_title": top_solution.title,
                "top_similarity": top_solution.similarity,
                "close_solutions_count": len(close_solutions)
            }
        ))
        step_idx += 1

        # ---------------------------------------------------------
        # KROK 7: Wyjaśnialność (Explainability) bez zmyślonych URLi
        # ---------------------------------------------------------
        t0 = time.perf_counter()
        matched_aspects_list = [
            f"Kluczowe zbieżne aspekty: {', '.join(sorted(best_tokens)) if best_tokens else 'Dopasowanie semantyczne'}",
            f"Odbiorcy innowacji: {top_solution.target_group or 'Mieszkańcy i seniorzy'}",
            f"Opcje finansowania: {top_solution.funding_info or 'Środki regionalne i dotacje samorządowe'}"
        ]

        explainability = ExplainabilityInfo(
            summary=(
                f"Projekt '{top_solution.title}' został wybrany, ponieważ bezpośrednio odpowiada na opisane wyzwanie. "
                f"Zapewnia sprawdzoną w Małopolsce metodykę pracy z grupą: {top_solution.target_group or 'osobami potrzebującymi'} "
                f"oraz wskazuje dostępne źródła finansowania: {top_solution.funding_info or 'regionalne granty społeczne'}."
            ),
            matched_aspects=matched_aspects_list,
            source_file=top_solution.file_source or "Dokumentacja innowacji ROPS",
            source_url=clean_url
        )

        trace.append(TraceStep(
            step_number=step_idx,
            name="6. EXPLAINABILITY_SYNTHESIS",
            status="OK",
            duration_ms=round((time.perf_counter() - t0) * 1000, 2),
            details={
                "source_file": explainability.source_file,
                "source_url": explainability.source_url
            }
        ))
        step_idx += 1

        # ---------------------------------------------------------
        # KROK 8: Generowanie odpowiedzi (Groq LLM LLaMA 3.3)
        # ---------------------------------------------------------
        t0 = time.perf_counter()
        chat_answer = cls._generate_groq_answer(
            user_query=query,
            history=request.conversation_history or [],
            top_solution=top_solution,
            close_solutions=close_solutions,
            explainability=explainability,
            matched_expert=matched_expert,
            community_ideas=community_ideas,
            similar_problems=similar_problems,
            reporter_type=reporter_type,
            powiat=powiat
        )

        trace.append(TraceStep(
            step_number=step_idx,
            name="7. GROQ_SYNTHESIS",
            status="OK",
            duration_ms=round((time.perf_counter() - t0) * 1000, 2),
            details={
                "llm_provider": "Groq LLaMA 3.3" if GROQ_API_KEY else "Template Engine Fallback",
                "model": GROQ_MODEL,
                "answer_length": len(chat_answer)
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
            community_ideas=community_ideas,
            similar_problems=similar_problems,
            matched_expert=matched_expert,
            next_actions=next_actions,
            saved_problem_id=saved_problem_id,
            trace=trace,
            total_duration_ms=total_ms
        )

    @staticmethod
    def _generate_groq_answer(
        user_query: str,
        history: List[ChatMessage],
        top_solution: InnovationMatchItem,
        close_solutions: List[InnovationMatchItem],
        explainability: ExplainabilityInfo,
        matched_expert: MatchedExpert,
        community_ideas: List[CommunityIdeaMatch],
        similar_problems: List[SimilarProblemMatch],
        reporter_type: str,
        powiat: Optional[str]
    ) -> str:
        """Generuje życzliwą, zrozumiałą dla każdego (w tym seniora) odpowiedź doradczą."""
        if GROQ_API_KEY:
            try:
                from groq import Groq
                client = Groq(api_key=GROQ_API_KEY)

                context_blocks = [
                    f"REKOMENDOWANA INNOWACJA (Podobieństwo: {top_solution.similarity_percentage}):\n"
                    f"- Tytuł: {top_solution.title}\n"
                    f"- Problem: {top_solution.problem_statement}\n"
                    f"- Rozwiązanie: {top_solution.solution}\n"
                    f"- Dofinansowanie: {top_solution.funding_info or 'Dotacje regionalne / fundusze samorządowe'}\n"
                    f"- Grupa odbiorców: {top_solution.target_group or 'Wszyscy mieszkańcy'}\n"
                    f"- Plik źródłowy: {top_solution.file_source or 'Baza ROPS'}\n"
                    f"- URL: {top_solution.url or 'Dostępne w katalogu ROPS Kraków'}"
                ]

                if close_solutions:
                    context_blocks.append("\nINNE ZBLIŻONE INNOWACJE SPOŁECZNE:")
                    for idx, c in enumerate(close_solutions, 1):
                        context_blocks.append(f"{idx}. {c.title} ({c.similarity_percentage}) - {c.solution[:140]}...")

                if community_ideas:
                    context_blocks.append("\nPOWIĄZANE POMYSŁY MIESZKAŃCÓW Z PLATFORMY:")
                    for idx, ci in enumerate(community_ideas, 1):
                        context_blocks.append(f"- {ci.title} (autor: {ci.author_name}) - {ci.description[:100]}...")

                if similar_problems:
                    context_blocks.append("\nPODOBNE ZGŁOSZONE POTRZEBY W MAŁOPOLSCE:")
                    for sp in similar_problems:
                        context_blocks.append(f"- Powiat {sp.powiat or 'sąsiedni'}: {sp.problem_text[:90]}...")

                context_blocks.append(
                    f"\nDYŻURUJĄCY EKSPERT ROPS KRAKÓW:\n"
                    f"{matched_expert.name} ({matched_expert.title}, {matched_expert.department}) - specjalizacja: {matched_expert.specialization}"
                )

                system_prompt = (
                    "Jesteś empatycznym, profesjonalnym doradcą platformy Hubmi ds. Innowacji Społecznych (Regionalny Ośrodek Polityki Społecznej w Krakowie - ROPS Kraków).\n"
                    f"Rozmawiasz z użytkownikiem (rola: {reporter_type}" + (f", powiat: {powiat}" if powiat else "") + ").\n"
                    "ZASADY ODPOWIEDZI:\n"
                    "1. Pisz prostym, ciepłym, serdecznym językiem, zrozumiałym dla seniora, opiekuna i mieszkańca. Unikaj żargonu technicznego, słów o wektorach i embeddingach.\n"
                    "2. NIGDY nie używaj zmyślonych adresów URL (zakaz 'hubmi.org/innowacje').\n"
                    "3. BEZWZGLĘDNY ZAKAZ tabel Markdown oraz znaczników HTML (żadnych `<table>`, `<ul>`, `<li>`, `<div>`). Używaj przejrzystych akapitów i punktorów z myślnikami (`- `).\n"
                    "4. Przedstaw rekomendowaną innowację i prosto wytłumacz, jak konkretnie pomoże w opisanym problemie.\n"
                    "5. Wskaż opcje sfinansowania lub wdrożenia (np. dotacje z ROPS / PFRON / środki gminy).\n"
                    "6. Zaoferuj pomoc dedykowanego eksperta ROPS Kraków (" + matched_expert.name + ") oraz zachęć do rozwinięcia pomysłu w Kreatorze Pomysłów.\n\n"
                    f"DANE Z BAZY ROPS KRAKÓW:\n{''.join(context_blocks)}"
                )

                messages = [{"role": "system", "content": system_prompt}]
                for h in history[-4:]:
                    messages.append({"role": h.role, "content": h.content})
                messages.append({"role": "user", "content": user_query})

                chat_completion = client.chat.completions.create(
                    messages=messages,
                    model=GROQ_MODEL,
                    temperature=0.3,
                    max_tokens=2000
                )
                raw_answer = chat_completion.choices[0].message.content or ""

                # Czyszczenie z ewentualnych tagów HTML
                cleaned = re.sub(r'</?(?:ul|ol|div|span|p|section)>', '', raw_answer, flags=re.IGNORECASE)
                cleaned = re.sub(r'<li>\s*', '\n- ', cleaned, flags=re.IGNORECASE)
                cleaned = re.sub(r'</li>', '', cleaned, flags=re.IGNORECASE)
                cleaned = re.sub(r'<br\s*/?>', '\n', cleaned, flags=re.IGNORECASE)
                cleaned = re.sub(r'<b>(.*?)</b>', r'**\1**', cleaned, flags=re.IGNORECASE)
                cleaned = re.sub(r'<strong>(.*?)</strong>', r'**\1**', cleaned, flags=re.IGNORECASE)

                return cleaned.strip()
            except Exception as e:
                logger.error(f"Błąd Groq API: {e}. Używam formatu szablonowego.")

        # Fallback generowania odpowiedzi
        link_str = f" [Przejdź do materiałów]({top_solution.url})" if top_solution.url else ""
        return (
            f"Znalazłem w bazie innowacji ROPS Kraków sprawdzone rozwiązanie, które idealnie odpowiada na Twoje potrzeby:\n\n"
            f"### 🏆 Rekomendowane rozwiązanie: **{top_solution.title}**\n\n"
            f"**Na czym polega pomysł?**\n"
            f"{top_solution.solution}\n\n"
            f"**Dlaczego to rozwiązanie pomoże?**\n"
            f"{explainability.summary}\n\n"
            f"- 👥 **Dla kogo:** {top_solution.target_group or 'Mieszkańcy i seniorzy'}\n"
            f"- 💰 **Możliwości sfinansowania:** {top_solution.funding_info or 'Dostępne dotacje z funduszy regionalnych i samorządowych'}\n"
            f"- 📄 **Materiały źródłowe:** `{explainability.source_file}`{link_str}\n\n"
            f"Możesz również porozmawiać o wdrożeniu tego projektu z naszym doradcą: **{matched_expert.name}** ({matched_expert.title})."
        )

