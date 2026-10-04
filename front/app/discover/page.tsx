"use client";

import React, { useState, useMemo, useEffect } from "react";
import { IdeaCard } from "../components/shared/IdeaCard";
import { DeleteIdeaModal } from "../components/shared/DeleteIdeaModal";
import { CustomSelect, SelectOption } from "../components/shared/CustomSelect";
import {
  Search,
  Plus,
  X,
  TrendingUp,
  Users,
  Clock,
  Handshake,
  GraduationCap,
  CheckCircle2,
  Send,
  Building2,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { Idea, RopsExpert } from "../lib/types";
import {
  fetchExpertsDirectory,
  assignExpertToIdea,
  submitPartnershipRequest,
} from "../lib/api";

const CATEGORIES = [
  "Wszystkie",
  "Dom i Ogród",
  "Zdrowie",
  "Społeczność",
  "Podróże",
  "Rzemiosło",
  "Praca",
];

const SORT_OPTIONS: SelectOption<"popular" | "testers" | "newest">[] = [
  {
    value: "popular",
    label: "Najpopularniejsze",
    icon: <TrendingUp className="w-3.5 h-3.5" />,
  },
  {
    value: "testers",
    label: "Najwięcej testerów",
    icon: <Users className="w-3.5 h-3.5" />,
  },
  {
    value: "newest",
    label: "Najnowsze",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
];

function IdeaCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white border border-black/4 min-h-75 animate-pulse p-6 flex flex-col gap-4">
      <div className="h-3 w-20 bg-stone-200 rounded-full" />
      <div className="h-6 w-3/4 bg-stone-200 rounded-xl" />
      <div className="h-3 w-1/2 bg-stone-100 rounded-full" />
      <div className="flex-1 flex items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-stone-100" />
      </div>
      <div className="pt-2 border-t border-stone-100 flex gap-2">
        <div className="h-7 flex-1 bg-stone-100 rounded-xl" />
        <div className="h-7 flex-1 bg-stone-100 rounded-xl" />
      </div>
    </div>
  );
}

export default function DiscoverPage() {
  const {
    ideas,
    currentUser,
    selectIdea,
    vote,
    toggleTesting,
    deleteIdea,
    navigate,
    isLoadingIdeas,
    refreshIdeas,
  } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Wszystkie");
  const [onlyLookingForPartner, setOnlyLookingForPartner] = useState(false);
  const [sortBy, setSortBy] = useState<"popular" | "newest" | "testers">(
    "popular",
  );

  // Modale: Usuwanie propozycji, Partnerstwo oraz Przypisywanie mentora
  const [deleteModalIdea, setDeleteModalIdea] = useState<Idea | null>(null);
  const [deleteNotice, setDeleteNotice] = useState<string | null>(null);

  const [partnerModalIdea, setPartnerModalIdea] = useState<Idea | null>(null);
  const [partnerName, setPartnerName] = useState("");
  const [partnerType, setPartnerType] = useState(
    "Organizacja pozarządowa (NGO)",
  );
  const [partnerEmail, setPartnerEmail] = useState("");
  const [partnerMsg, setPartnerMsg] = useState("");
  const [partnerSuccessNotice, setPartnerSuccessNotice] = useState<
    string | null
  >(null);

  const [assignModalIdea, setAssignModalIdea] = useState<Idea | null>(null);
  const [expertsList, setExpertsList] = useState<RopsExpert[]>([]);
  const [assignSuccessNotice, setAssignSuccessNotice] = useState<string | null>(
    null,
  );

  const isAdminOrExpert =
    currentUser?.role === "admin" || currentUser?.role === "expert";

  useEffect(() => {
    fetchExpertsDirectory()
      .then((data) => setExpertsList(data))
      .catch((err) => console.warn(err));
  }, []);

  const filteredIdeas = useMemo(() => {
    return ideas
      .filter((idea) => {
        const matchesQuery =
          idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          idea.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
          idea.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
          idea.authorName.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory =
          selectedCategory === "Wszystkie" ||
          idea.category
            .toLowerCase()
            .includes(selectedCategory.toLowerCase().slice(0, 4));

        const matchesPartner = onlyLookingForPartner
          ? Boolean(idea.lookingForPartner)
          : true;

        return matchesQuery && matchesCategory && matchesPartner;
      })
      .sort((a, b) => {
        if (sortBy === "popular") return b.likes - a.likes;
        if (sortBy === "testers") return b.testersCount - a.testersCount;
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
  }, [ideas, searchQuery, selectedCategory, onlyLookingForPartner, sortBy]);

  const handleSubmitPartnerOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerModalIdea) return;
    try {
      await submitPartnershipRequest(partnerModalIdea.id, {
        partner_name:
          partnerName.trim() || currentUser?.name || "Zainteresowany Partner",
        partner_type: partnerType,
        contact_email:
          partnerEmail.trim() || currentUser?.email || "kontakt@partner.org",
        message:
          partnerMsg.trim() ||
          "Chcemy nawiązać współpracę przy realizacji pomysłu.",
      });
      setPartnerSuccessNotice(
        `Wysłano zgłoszenie partnerstwa do autora pomysłu "${partnerModalIdea.title}"!`,
      );
      setTimeout(() => {
        setPartnerModalIdea(null);
        setPartnerSuccessNotice(null);
        setPartnerMsg("");
      }, 2500);
    } catch (err: any) {
      alert(err?.message || "Nie udało się przesłać zgłoszenia partnerstwa.");
    }
  };

  const handleAssignMentor = async (expert: RopsExpert) => {
    if (!assignModalIdea) return;
    try {
      await assignExpertToIdea(assignModalIdea.id, {
        expert_id: expert.id,
        expert_name: expert.name,
        expert_specialization: expert.specialization,
      });
      setAssignSuccessNotice(
        `Przypisano mentora ${expert.name} do pomysłu "${assignModalIdea.title}"!`,
      );
      if (refreshIdeas) refreshIdeas();
      setTimeout(() => {
        setAssignModalIdea(null);
        setAssignSuccessNotice(null);
      }, 2000);
    } catch (err: any) {
      alert(err?.message || "Błąd przypisywania eksperta.");
    }
  };

  return (
    <div className="py-6 px-4 sm:px-6 max-w-6xl mx-auto space-y-6">
      {/* Top Hero Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2">
        <div>
          <div className="text-4xl sm:text-5xl font-bold tracking-tight leading-[0.95] select-none">
            <span className="block text-stone-900">Odkrywaj Pomysły</span>
            <span className="block text-stone-600">Inspiruj Zmiany</span>
          </div>
          <p className="text-xs sm:text-sm text-stone-600 font-medium mt-2 max-w-lg">
            Przeglądaj innowacje i oddolne projekty mieszkańców Małopolski,
            nawiązuj partnerstwa i współpracuj z ekspertami ROPS.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("propose")}
          aria-label="Zaproponuj nowy pomysł innowacji"
          className="self-start sm:self-auto min-h-[40px] flex items-center gap-1.5 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white dark:bg-white dark:hover:bg-stone-100 dark:text-stone-950 rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Zaproponuj pomysł</span>
        </button>
      </div>

      {/* Minimal Search Bar */}
      <div className="bg-white dark:bg-[#1C1E23] rounded-2xl p-2 shadow-2xs border border-black/4 dark:border-white/10">
        <div className="relative flex items-center">
          <label htmlFor="search-ideas-input" className="sr-only">
            Szukaj pomysłów, autorów lub wyzwań
          </label>
          <Search className="absolute left-3.5 w-4 h-4 text-stone-500 dark:text-stone-400" aria-hidden="true" />
          <input
            id="search-ideas-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Szukaj pomysłów, autorów lub wyzwań..."
            aria-label="Szukaj pomysłów, autorów lub wyzwań"
            className="w-full pl-10 pr-8 py-2 text-base font-medium text-stone-900 dark:text-white placeholder:text-stone-500 dark:placeholder:text-stone-400 bg-transparent rounded-xl focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Wyczyść pole wyszukiwania"
              className="min-h-[28px] min-w-[28px] flex items-center justify-center absolute right-3 p-1 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Powiadomienie o usunięciu propozycji */}
      {deleteNotice && (
        <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{deleteNotice}</span>
        </div>
      )}

      {/* Categories & Filter Bar with Partner Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Kategorie innowacji"
          className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none"
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-label={`Kategoria: ${cat}`}
                onClick={() => setSelectedCategory(cat)}
                className={`min-h-[32px] whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${isSelected
                    ? "bg-stone-900 dark:bg-white text-white dark:text-stone-950 font-bold"
                    : "bg-white dark:bg-[#1C1E23] text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-white/10 border border-stone-200/80 dark:border-white/10"
                  }`}
              >
                {cat}
              </button>
            );
          })}

          {/* Filtr: Szukają partnera */}
          <button
            type="button"
            role="checkbox"
            aria-checked={onlyLookingForPartner}
            aria-label="Filtruj tylko projekty poszukujące partnerstwa"
            onClick={() => setOnlyLookingForPartner(!onlyLookingForPartner)}
            className={`min-h-[32px] whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${onlyLookingForPartner
                ? "bg-amber-200/90 dark:bg-amber-400/20 text-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-500/30 shadow-2xs"
                : "bg-white dark:bg-[#1C1E23] text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-white/10 border border-stone-200/80 dark:border-white/10"
              }`}
          >
            <Handshake className="w-3.5 h-3.5 text-amber-800 dark:text-amber-300" aria-hidden="true" />
            <span>Szukają partnera</span>
          </button>
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
          <CustomSelect
            value={sortBy}
            onChange={setSortBy}
            options={SORT_OPTIONS}
          />
        </div>
      </div>

      {/* Grid of Idea Cards */}
      {isLoadingIdeas ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <IdeaCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredIdeas.length === 0 ? (
        <div className="bg-white dark:bg-[#1C1E23] rounded-2xl p-10 text-center border border-stone-200 dark:border-white/10">
          <p className="text-base font-semibold text-stone-800 dark:text-stone-200">Brak wyników</p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("Wszystkie");
              setOnlyLookingForPartner(false);
            }}
            className="mt-3 px-4 py-2 bg-stone-900 dark:bg-white text-white dark:text-stone-950 rounded-xl text-xs font-medium cursor-pointer"
          >
            Wyczyść filtry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredIdeas.map((idea) => {
            const isUserTester = currentUser
              ? idea.testersList.includes(currentUser.email)
              : false;

            return (
              <IdeaCard
                key={idea.id}
                idea={idea}
                isTester={isUserTester}
                isAdminOrExpert={isAdminOrExpert}
                onClick={() => selectIdea(idea)}
                onVote={(e) => {
                  e.stopPropagation();
                  vote(idea.id, "like");
                }}
                onToggleTesting={(e) => {
                  e.stopPropagation();
                  toggleTesting(idea.id);
                }}
                onPartner={(e) => {
                  e.stopPropagation();
                  setPartnerModalIdea(idea);
                }}
                onAssignExpert={(e) => {
                  e.stopPropagation();
                  setAssignModalIdea(idea);
                }}
                onChat={(e) => {
                  e.stopPropagation();
                  navigate("chat");
                }}
                onDelete={(target) => setDeleteModalIdea(target)}
              />
            );
          })}
        </div>
      )}

      {/* Modal Zgłoszenia Chęci Partnerstwa */}
      {partnerModalIdea && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-black/5 pb-3">
              <div className="flex items-center gap-2">
                <Handshake className="w-5 h-5 text-amber-700" />
                <h3 className="text-base font-bold text-stone-900">
                  Zgłoś chęć partnerstwa
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPartnerModalIdea(null)}
                aria-label="Zamknij formularz oferty partnerstwa"
                className="p-1.5 min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="p-3 bg-[#FAF9F5] rounded-xl text-xs text-stone-700 space-y-1">
              <div className="font-bold text-stone-900">
                Pomysł: {partnerModalIdea.title}
              </div>
              <div>Autor: {partnerModalIdea.authorName}</div>
              {partnerModalIdea.partnerTypes &&
                partnerModalIdea.partnerTypes.length > 0 && (
                  <div className="text-[11px] text-amber-900">
                    Poszukiwany profil:{" "}
                    <strong>{partnerModalIdea.partnerTypes.join(", ")}</strong>
                  </div>
                )}
            </div>

            {partnerSuccessNotice ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{partnerSuccessNotice}</span>
              </div>
            ) : (
              <form
                onSubmit={handleSubmitPartnerOffer}
                className="space-y-3 text-xs"
              >
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Nazwa organizacji / podmiotu
                  </label>
                  <input
                    type="text"
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                    placeholder="np. Stowarzyszenie Rozwoju Wsi / Urząd Gminy / Firma XYZ"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-stone-900 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      Typ partnera
                    </label>
                    <select
                      value={partnerType}
                      onChange={(e) => setPartnerType(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none"
                    >
                      <option value="Organizacja pozarządowa (NGO)">
                        Organizacja pozarządowa (NGO)
                      </option>
                      <option value="Jednostka samorządu (gmina / OPS)">
                        Jednostka samorządu (gmina / OPS)
                      </option>
                      <option value="Firma / Biznes odpowiedzialny społecznie">
                        Firma / Biznes odpowiedzialny społecznie
                      </option>
                      <option value="Instytucja naukowa / uczelnia">
                        Instytucja naukowa / uczelnia
                      </option>
                      <option value="Grupa nieformalna mieszkańców">
                        Grupa nieformalna mieszkańców
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      E-mail kontaktowy
                    </label>
                    <input
                      type="email"
                      value={partnerEmail}
                      onChange={(e) => setPartnerEmail(e.target.value)}
                      placeholder="kontakt@twoja-organizacja.pl"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-stone-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Wiadomość i propozycja wkładu
                  </label>
                  <textarea
                    rows={3}
                    value={partnerMsg}
                    onChange={(e) => setPartnerMsg(e.target.value)}
                    placeholder="Opisz, czym możecie wesprzeć projekt (np. udostępnienie sali, wolontariat, dofinansowanie, doświadczenie)..."
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-stone-900 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setPartnerModalIdea(null)}
                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-semibold cursor-pointer"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-semibold cursor-pointer shadow-2xs flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Wyślij propozycję partnerstwa</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal Przypisywania Mentora ROPS do Pomysłu */}
      {assignModalIdea && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4 animate-in zoom-in-95 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-black/5 pb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-700" />
                <h3 className="text-base font-bold text-stone-900">
                  Przypisz mentora ROPS Kraków
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAssignModalIdea(null)}
                aria-label="Zamknij okno przypisywania mentora"
                className="p-1.5 min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="p-3 bg-[#FAF9F5] rounded-xl text-xs text-stone-700 space-y-0.5">
              <div className="font-bold text-stone-900">
                Projekt: {assignModalIdea.title}
              </div>
              <div className="text-[11px] text-stone-500">
                Kategoria: {assignModalIdea.category}
              </div>
            </div>

            {assignSuccessNotice ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{assignSuccessNotice}</span>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                  Wybierz dedykowanego eksperta merytorycznego:
                </span>
                {expertsList.map((exp) => (
                  <div
                    key={exp.id}
                    onClick={() => handleAssignMentor(exp)}
                    className="p-3.5 rounded-xl border border-black/5 bg-stone-50/70 hover:bg-white hover:border-black/15 transition-all cursor-pointer flex items-center justify-between gap-3 text-xs shadow-2xs group"
                  >
                    <div>
                      <h4 className="font-bold text-stone-900 group-hover:text-black">
                        {exp.name}
                      </h4>
                      <p className="text-[11px] text-stone-600">{exp.title}</p>
                      <p className="text-[10px] text-stone-500 pt-0.5">
                        Specjalizacja: {exp.specialization}
                      </p>
                    </div>

                    <button
                      type="button"
                      className="px-3 py-1.5 bg-stone-900 group-hover:bg-black text-white text-[11px] font-semibold rounded-lg shrink-0 transition-colors"
                    >
                      Przypisz
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-black/5">
              <button
                type="button"
                onClick={() => setAssignModalIdea(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal potwierdzenia usunięcia propozycji (dla Autora lub Administratora) */}
      <DeleteIdeaModal
        idea={deleteModalIdea}
        isOpen={Boolean(deleteModalIdea)}
        onClose={() => setDeleteModalIdea(null)}
        currentUser={currentUser}
        onConfirm={async (idea) => {
          await deleteIdea(idea.id);
          setDeleteNotice(`Pomyślnie usunięto propozycję „${idea.title}”.`);
          setTimeout(() => setDeleteNotice(null), 4000);
        }}
      />
    </div>
  );
}
