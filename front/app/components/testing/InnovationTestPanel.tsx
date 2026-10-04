"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Star,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  MessageSquare,
  Send,
  Users,
  ShieldCheck,
  HeartHandshake,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Sliders,
  Check,
  Clock,
  X,
} from "lucide-react";
import {
  IdeaFeedback,
  IdeaComment,
  TestingSummary,
  FeedbackSubmitPayload,
  User,
} from "../../lib/types";
import {
  fetchIdeaTestingSummary,
  submitIdeaFeedback,
  submitIdeaComment,
  applyAsTester,
  fetchTesterApplications,
} from "../../lib/api";

interface InnovationTestPanelProps {
  ideaId: string;
  ideaTitle: string;
  currentUser: User | null;
  isTester: boolean;
  onToggleTesting: (ideaId: string) => void;
}

const TESTER_ROLES = [
  "Senior (60+)",
  "Opiekun osoby niesamodzielnej",
  "Mieszkaniec Małopolski",
  "Ekspert ds. Dostępności (WCAG)",
  "Pracownik CUS / MOPS",
  "Przedstawiciel NGO / Wolontariusz",
  "Innowator społeczny",
];

export const InnovationTestPanel: React.FC<InnovationTestPanelProps> = ({
  ideaId,
  ideaTitle,
  currentUser,
  isTester,
  onToggleTesting,
}) => {
  const router = useRouter();
  const isAdmin = currentUser?.role === "admin";
  const [summary, setSummary] = useState<TestingSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"reviews" | "add_review" | "comments">("reviews");

  // Tester application states
  const [myAppStatus, setMyAppStatus] = useState<"none" | "pending" | "approved" | "rejected">("none");
  const isApprovedTester = isTester || myAppStatus === "approved" || isAdmin;
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [motivationInput, setMotivationInput] = useState("");
  const [isSubmittingApp, setIsSubmittingApp] = useState(false);
  const [applySuccessMsg, setApplySuccessMsg] = useState<string | null>(null);
  const [applyErrorMsg, setApplyErrorMsg] = useState<string | null>(null);

  // Form states for adding feedback
  const [overallRating, setOverallRating] = useState(5);
  const [usabilityRating, setUsabilityRating] = useState(5);
  const [accessibilityRating, setAccessibilityRating] = useState(5);
  const [impactRating, setImpactRating] = useState(5);
  const [testerRole, setTesterRole] = useState(TESTER_ROLES[0]);
  const [strengths, setStrengths] = useState("");
  const [weaknesses, setWeaknesses] = useState("");
  const [suggestedImprovements, setSuggestedImprovements] = useState("");
  const [comment, setComment] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  // Form states for comments
  const [commentInput, setCommentInput] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchIdeaTestingSummary(ideaId);
      setSummary(data);
    } catch {
      // Local fallback
      setSummary({
        idea_id: ideaId,
        testers_count: isTester ? 1 : 0,
        reviews_count: 0,
        avg_overall_rating: 0,
        avg_usability_rating: 0,
        avg_accessibility_rating: 0,
        avg_impact_rating: 0,
        feedback_list: [],
        comments_list: [],
      });
    }

    if (currentUser) {
      try {
        const apps = await fetchTesterApplications(ideaId);
        const mine = apps.find(
          (a) => a.user_id === currentUser.id || a.user_email === currentUser.email
        );
        if (mine) {
          setMyAppStatus(mine.status);
        } else if (isTester) {
          setMyAppStatus("approved");
        } else {
          setMyAppStatus("none");
        }
      } catch {
        if (isTester) setMyAppStatus("approved");
      }
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [ideaId]);

  const handleOpenApplyModal = () => {
    if (!currentUser) {
      router.push("/auth");
      return;
    }
    if (isTester || myAppStatus === "approved") {
      return;
    }
    if (myAppStatus === "pending") {
      alert("Twoje zgłoszenie do testów oczekuje już na decyzję administratora.");
      return;
    }
    setApplyErrorMsg(null);
    setApplySuccessMsg(null);
    setIsApplyModalOpen(true);
  };

  const handleSendTesterApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingApp(true);
    setApplyErrorMsg(null);
    setApplySuccessMsg(null);

    try {
      await applyAsTester(ideaId, motivationInput.trim() || undefined);
      setMyAppStatus("pending");
      setApplySuccessMsg("Zgłoszenie zostało wysłane do administratora! Otrzymasz powiadomienie po akceptacji.");
      setTimeout(() => {
        setIsApplyModalOpen(false);
        setApplySuccessMsg(null);
        setMotivationInput("");
      }, 1800);
    } catch (err: any) {
      setApplyErrorMsg(err.message || "Wystąpił błąd podczas wysyłania zgłoszenia.");
    } finally {
      setIsSubmittingApp(false);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingFeedback(true);
    setFeedbackError(null);
    setFeedbackSuccess(null);

    const payload: FeedbackSubmitPayload = {
      overall_rating: overallRating,
      usability_rating: usabilityRating,
      accessibility_rating: accessibilityRating,
      impact_rating: impactRating,
      author_role: testerRole,
      strengths: strengths.trim() || undefined,
      weaknesses: weaknesses.trim() || undefined,
      suggested_improvements: suggestedImprovements.trim() || undefined,
      comment: comment.trim() || undefined,
    };

    try {
      const created = await submitIdeaFeedback(ideaId, payload);
      setFeedbackSuccess("Dziękujemy! Twoja ocena i informacja zwrotna zostały pomyślnie zapisane.");
      // Refresh summary
      await loadData();
      // Reset form
      setStrengths("");
      setWeaknesses("");
      setSuggestedImprovements("");
      setComment("");
      setTimeout(() => {
        setActiveTab("reviews");
        setFeedbackSuccess(null);
      }, 1500);
    } catch (err: any) {
      setFeedbackError(err.message || "Wystąpił błąd podczas wysyłania opinii.");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    setIsSubmittingComment(true);
    setCommentError(null);

    try {
      await submitIdeaComment(ideaId, commentInput.trim());
      setCommentInput("");
      await loadData();
    } catch (err: any) {
      setCommentError(err.message || "Błąd dodawania komentarza.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const renderStarsSelector = (
    label: string,
    sublabel: string,
    value: number,
    onChange: (val: number) => void
  ) => {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-stone-50 border border-stone-200/70">
        <div>
          <span className="text-xs font-bold text-stone-900 block">{label}</span>
          <span className="text-[11px] text-stone-600 font-medium">{sublabel}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              aria-label={`${label}: ${star} z 5 gwiazdek`}
              className="min-h-[32px] min-w-[32px] flex items-center justify-center p-1 rounded-lg cursor-pointer transition-transform hover:scale-115 focus:outline-none"
              title={`${star} na 5`}
            >
              <Star
                aria-hidden="true"
                className={`w-5 h-5 ${star <= value
                    ? "text-amber-500 fill-amber-400"
                    : "text-stone-300 hover:text-amber-300"
                  }`}
              />
            </button>
          ))}
          <span className="text-xs font-bold text-stone-800 ml-1.5 w-6 text-right">
            {value}/5
          </span>
        </div>
      </div>
    );
  };

  const renderReadOnlyStars = (val: number, size = "w-3.5 h-3.5") => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`${size} ${s <= Math.round(val)
                ? "text-amber-500 fill-amber-400"
                : "text-stone-300"
              }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="mt-8 rounded-3xl bg-white border border-stone-200/90 shadow-sm overflow-hidden">
      {/* Top Header Banner */}
      <div className="p-6 sm:p-8 bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-xl">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Ocena Użyteczności & Feedback
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
            Testuj prototyp w warunkach lokalnych, oceń dostępność dla seniorów i zgłaszaj usprawnienia przed wdrożeniem w gminie.
          </p>
        </div>

        {/* Tester status CTA */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
          {isApprovedTester ? (
            <div className="flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold bg-emerald-600 text-white shadow-md ring-2 ring-emerald-300/40">
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{isAdmin ? "Status Administratora (Uprawnienia testera)" : "Aktywny Zaakceptowany Tester"}</span>
            </div>
          ) : myAppStatus === "pending" ? (
            <div className="flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold bg-amber-500 text-white shadow-md ring-2 ring-amber-300/40">
              <Clock className="w-4 h-4 animate-spin" />
              <span>Zgłoszenie czeka na decyzję admina</span>
            </div>
          ) : (
            <button
              onClick={handleOpenApplyModal}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold bg-white text-stone-900 hover:bg-stone-100 transition-all cursor-pointer shadow-md"
            >
              <Users className="w-4 h-4 text-stone-700" />
              <span>Dołącz jako Tester ({summary?.testers_count || 0})</span>
            </button>
          )}
        </div>
      </div>

      {/* Usability & Accessibility Scorecards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-5 sm:p-6 bg-[#FAF9F5] border-b border-stone-200">
        {/* Metric 1: Overall */}
        <div className="bg-white p-4 rounded-2xl border border-black/5 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
            Średnia Ogólna
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-900">
              {summary && summary.reviews_count > 0 ? summary.avg_overall_rating.toFixed(1) : "—"}
            </span>
            <span className="text-xs text-stone-400">/ 5.0</span>
          </div>
          {summary && summary.reviews_count > 0 && renderReadOnlyStars(summary.avg_overall_rating)}
          <span className="text-[10px] text-stone-500 block pt-0.5">
            {summary?.reviews_count || 0} ocen testerów
          </span>
        </div>

        {/* Metric 2: Usability */}
        <div className="bg-white p-4 rounded-2xl border border-black/5 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
            Użyteczność / Obsługa
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-900">
              {summary && summary.reviews_count > 0 ? summary.avg_usability_rating.toFixed(1) : "—"}
            </span>
            <span className="text-xs text-stone-400">/ 5.0</span>
          </div>
          {summary && summary.reviews_count > 0 && renderReadOnlyStars(summary.avg_usability_rating)}
          <span className="text-[10px] text-stone-500 block pt-0.5">
            Intuicyjność procedur
          </span>
        </div>

        {/* Metric 3: Accessibility */}
        <div className="bg-white p-4 rounded-2xl border border-black/5 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
            Dostępność & WCAG
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-900">
              {summary && summary.reviews_count > 0 ? summary.avg_accessibility_rating.toFixed(1) : "—"}
            </span>
            <span className="text-xs text-stone-400">/ 5.0</span>
          </div>
          {summary && summary.reviews_count > 0 && renderReadOnlyStars(summary.avg_accessibility_rating)}
          <span className="text-[10px] text-stone-500 block pt-0.5">
            Seniorzy i bariery
          </span>
        </div>

        {/* Metric 4: Impact */}
        <div className="bg-white p-4 rounded-2xl border border-black/5 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
            Wpływ Społeczny
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-900">
              {summary && summary.reviews_count > 0 ? summary.avg_impact_rating.toFixed(1) : "—"}
            </span>
            <span className="text-xs text-stone-400">/ 5.0</span>
          </div>
          {summary && summary.reviews_count > 0 && renderReadOnlyStars(summary.avg_impact_rating)}
          <span className="text-[10px] text-stone-500 block pt-0.5">
            Skala rozwiązania problemu
          </span>
        </div>
      </div>

      {/* Tabs navigation */}
      <div
        role="tablist"
        aria-label="Zakładki panelu testowania innowacji"
        className="flex items-center gap-2 px-6 pt-5 pb-2 border-b border-stone-100 overflow-x-auto"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "reviews"}
          onClick={() => setActiveTab("reviews")}
          className={`min-h-[38px] flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "reviews"
              ? "bg-stone-900 dark:bg-white text-white dark:text-stone-950 shadow-2xs"
              : "text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-white/10"
            }`}
        >
          <ShieldCheck className="w-4 h-4" aria-hidden="true" />
          <span>Opinie i Usprawnienia</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 dark:bg-black/10 ml-1 font-mono">
            {summary?.feedback_list.length || 0}
          </span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "add_review"}
          onClick={() => setActiveTab("add_review")}
          className={`min-h-[38px] flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "add_review"
              ? "bg-amber-600 text-white shadow-2xs"
              : "text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-white/10"
            }`}
        >
          <Star className="w-4 h-4" aria-hidden="true" />
          <span>Wystaw Ocenę & Feedback</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "comments"}
          onClick={() => setActiveTab("comments")}
          className={`min-h-[38px] flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "comments"
              ? "bg-stone-900 dark:bg-white text-white dark:text-stone-950 shadow-2xs"
              : "text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-white/10"
            }`}
        >
          <MessageSquare className="w-4 h-4" aria-hidden="true" />
          <span>Dyskusja Testerów</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 dark:bg-black/10 ml-1 font-mono">
            {summary?.comments_list.length || 0}
          </span>
        </button>
      </div>

      {/* TAB CONTENT: 1. REVIEWS & SUGGESTIONS */}
      {activeTab === "reviews" && (
        <div className="p-6 sm:p-8 space-y-5">
          {summary?.feedback_list && summary.feedback_list.length > 0 ? (
            <div className="space-y-4">
              {summary.feedback_list.map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-3 transition-all hover:bg-white hover:shadow-xs"
                >
                  {/* Review header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/60 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-xs shrink-0">
                        {item.author_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-stone-900">
                            {item.author_name}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-200/80 text-stone-700">
                            {item.author_role}
                          </span>
                        </div>
                        <span className="text-[10px] text-stone-400">
                          {new Date(item.created_at).toLocaleDateString("pl-PL", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Ratings badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1 text-xs font-bold text-stone-800 bg-white px-2.5 py-1 rounded-lg border border-stone-200">
                        <span>Ogólna:</span>
                        {renderReadOnlyStars(item.overall_rating)}
                      </div>
                      <span className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
                        Użyteczność: {item.usability_rating}/5
                      </span>
                      <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">
                        Dostępność: {item.accessibility_rating}/5
                      </span>
                    </div>
                  </div>

                  {/* PROPOSED IMPROVEMENTS (Highlighted callout!) */}
                  {item.suggested_improvements && (
                    <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                        <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Proponowane usprawnienie dla innowacji:</span>
                      </div>
                      <p className="text-amber-950 font-medium leading-relaxed pl-5.5">
                        {item.suggested_improvements}
                      </p>
                    </div>
                  )}

                  {/* Strengths & Weaknesses */}
                  {(item.strengths || item.weaknesses) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                      {item.strengths && (
                        <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/60">
                          <span className="font-bold text-emerald-900 block mb-1">
                            ✓ Co działa dobrze:
                          </span>
                          <p className="text-emerald-950">{item.strengths}</p>
                        </div>
                      )}
                      {item.weaknesses && (
                        <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-200/60">
                          <span className="font-bold text-rose-900 block mb-1">
                            ⚠ Wykryte bariery / trudności:
                          </span>
                          <p className="text-rose-950">{item.weaknesses}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* General Comment */}
                  {item.comment && (
                    <p className="text-xs text-stone-700 leading-relaxed font-medium pt-1">
                      &quot;{item.comment}&quot;
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 px-4 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 mx-auto flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-stone-800">
                Brak zarejestrowanych ocen z testów terenowych
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Bądź pierwszą osobą, która przetestuje ten prototyp i wskaże autorom potencjalne usprawnienia oraz ocenę użyteczności.
              </p>
              <button
                onClick={() => setActiveTab("add_review")}
                className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-stone-800 transition-colors cursor-pointer"
              >
                Dodaj pierwszą ocenę
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: 2. ADD FEEDBACK FORM */}
      {activeTab === "add_review" && (
        !isApprovedTester ? (
          <div className="p-8 sm:p-12 text-center max-w-lg mx-auto space-y-4">
            <div
              className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center ${myAppStatus === "pending"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-stone-100 text-stone-600"
                }`}
            >
              {myAppStatus === "pending" ? (
                <Clock className="w-7 h-7 animate-spin text-amber-700" />
              ) : (
                <ShieldCheck className="w-7 h-7 text-stone-700" />
              )}
            </div>

            <h3 className="text-base font-bold text-stone-900">
              {myAppStatus === "pending"
                ? "Twoje zgłoszenie do roli testera oczekuje na decyzję administratora"
                : "Wymagany status zaakceptowanego testera"}
            </h3>

            <p className="text-xs text-stone-600 leading-relaxed">
              {myAppStatus === "pending"
                ? "Administrator weryfikuje Twoją aplikację. Gdy zostanie zaakceptowana, otrzymasz powiadomienie i formularz ocen użyteczności zostanie automatycznie odblokowany."
                : "Aby oceniać użyteczność prototypu i wystawić formalną opinię, musisz najpierw zostać zaakceptowany jako tester przez administratora. Wyślij zapytanie poniżej."}
            </p>

            {myAppStatus !== "pending" && (
              <button
                type="button"
                onClick={handleOpenApplyModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Users className="w-4 h-4" />
                <span>Wyślij zgłoszenie o zostanie testerem</span>
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmitFeedback} className="p-6 sm:p-8 space-y-5">
            <div className="border-b border-stone-200 pb-3">
              <h3 className="text-base font-bold text-stone-900">
                Formularz Testera Społecznego
              </h3>
              <p className="text-xs text-stone-500">
                Oceń innowację &quot;{ideaTitle}&quot; z punktu widzenia dostępności i wdrożenia.
              </p>
            </div>

            {feedbackSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{feedbackSuccess}</span>
              </div>
            )}

            {feedbackError && (
              <div className="p-3 bg-rose-50 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{feedbackError}</span>
              </div>
            )}

            {/* Tester Role */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-900 block">
                Twoja rola / perspektywa testowania *
              </label>
              <select
                value={testerRole}
                onChange={(e) => setTesterRole(e.target.value)}
                className="w-full sm:w-80 px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-900 bg-white focus:outline-none focus:border-stone-900"
              >
                {TESTER_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* 4 Usability & Accessibility Star Selectors */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                Kryteria ewaluacji innowacji (1-5 gwiazdek)
              </h4>
              {renderStarsSelector(
                "1. Ocena ogólna prototypu",
                "Subiektywna ocena wartości rozwiązania dla mieszkańców",
                overallRating,
                setOverallRating
              )}
              {renderStarsSelector(
                "2. Ocena użyteczności (Usability)",
                "Intuicyjność obsługi, jasność instrukcji, prostota codziennego użytkowania",
                usabilityRating,
                setUsabilityRating
              )}
              {renderStarsSelector(
                "3. Dostępność dla seniorów i WCAG",
                "Brak barier sensorycznych i ruchowych, wielkość elementów, kontrast",
                accessibilityRating,
                setAccessibilityRating
              )}
              {renderStarsSelector(
                "4. Wpływ społeczny i zapotrzebowanie",
                "Czy to rozwiązanie realnie rozwiązuje zgłoszony problem w Małopolsce",
                impactRating,
                setImpactRating
              )}
            </div>

            {/* Detailed Structured Feedback Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-emerald-800 block">
                  Mocne strony (Co działa dobrze?)
                </label>
                <textarea
                  rows={3}
                  value={strengths}
                  onChange={(e) => setStrengths(e.target.value)}
                  placeholder="np. Prosty proces zapisu, jasne wskazówki, szybka korzyść..."
                  className="w-full p-3 rounded-xl border border-stone-200 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-rose-800 block">
                  Wykryte bariery / trudności
                </label>
                <textarea
                  rows={3}
                  value={weaknesses}
                  onChange={(e) => setWeaknesses(e.target.value)}
                  placeholder="np. Zbyt małe litery, skomplikowany formularz, brak kontaktu telefonicznego..."
                  className="w-full p-3 rounded-xl border border-stone-200 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900"
                />
              </div>
            </div>

            {/* KEY CHALLENGE FEATURE: Proponowane usprawnienia */}
            <div className="space-y-1.5 p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
              <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-amber-600" />
                <span>Proponowane usprawnienia dla twórców (Sugestia zmian)</span>
              </label>
              <p className="text-[11px] text-amber-800">
                Co konkretnie autorzy innowacji powinni poprawić, dodać lub zmodyfikować przed wdrożeniem w regionie?
              </p>
              <textarea
                rows={3}
                value={suggestedImprovements}
                onChange={(e) => setSuggestedImprovements(e.target.value)}
                placeholder="np. Rekomenduję dodać opcję powiadomień głosowych lub SMS, a także możliwość wyznaczenia lokalnego opiekuna wolontariusza..."
                className="w-full p-3 rounded-xl border border-amber-200 bg-white text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-amber-600"
              />
            </div>

            {/* General Summary */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-900 block">
                Ogólny komentarz / podsumowanie testu
              </label>
              <textarea
                rows={2}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Dodatkowe uwagi dotyczące testu w mikroskali..."
                className="w-full p-3 rounded-xl border border-stone-200 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab("reviews")}
                className="px-4 py-2.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-700 hover:bg-stone-50 cursor-pointer"
              >
                Anuluj
              </button>
              <button
                type="submit"
                disabled={isSubmittingFeedback}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmittingFeedback ? (
                  <span>Wysyłanie...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Zapisz ocenę & prześlij feedback</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ))}

      {/* TAB CONTENT: 3. COMMENTS & DISCUSSION */}
      {activeTab === "comments" && (
        <div className="p-6 sm:p-8 space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-stone-900">
              Dyskusja i pytania testerów ({summary?.comments_list.length || 0})
            </h3>

            {summary?.comments_list && summary.comments_list.length > 0 ? (
              <div className="space-y-3">
                {summary.comments_list.map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/70 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-900">
                        {c.author_name}
                      </span>
                      <span className="text-[10px] text-stone-400">
                        {new Date(c.created_at).toLocaleDateString("pl-PL", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-stone-700 leading-relaxed font-medium">
                      {c.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-400 italic">
                Brak pytań i komentarzy. Zadaj pytanie autorom lub mentorom projektu.
              </p>
            )}
          </div>

          {/* Add comment input - restricted to approved testers & admins */}
          {isApprovedTester ? (
            <form onSubmit={handleAddComment} className="space-y-2 pt-2 border-t border-stone-200">
              <label className="text-xs font-bold text-stone-900 block">
                Dodaj komentarz do wątku testowego (Aktywny Tester)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="Wpisz treść komentarza lub zapytania..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-none focus:border-stone-900"
                />
                <button
                  type="submit"
                  disabled={isSubmittingComment || !commentInput.trim()}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Dodaj</span>
                </button>
              </div>
              {commentError && (
                <p className="text-[11px] text-rose-600 font-semibold">{commentError}</p>
              )}
            </form>
          ) : (
            <div className="pt-4 border-t border-stone-200 p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5 max-w-md">
                <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                  Komentowanie wymaga akceptacji zgłoszenia testera
                </span>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  {myAppStatus === "pending"
                    ? "Twoje zgłoszenie do testów oczekuje na decyzję administratora. Po zatwierdzeniu będziesz mógł dodawać pytania i komentarze."
                    : "Wątek dyskusyjny testów jest przeznaczony dla zaakceptowanych testerów projektu oraz administratorów."}
                </p>
              </div>
              {myAppStatus !== "pending" && (
                <button
                  type="button"
                  onClick={handleOpenApplyModal}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-xs"
                >
                  {currentUser ? "Zgłoś się do testów" : "Zaloguj się"}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* APPLICATION MODAL: ZGŁOŚ SIĘ DO TESTÓW */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full border border-stone-200 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-3">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  <span>Zgłoszenie do pilotażu</span>
                </div>
                <h3 className="text-lg font-bold text-stone-900">
                  Dołącz jako Tester Innowacji
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsApplyModalOpen(false)}
                aria-label="Zamknij formularz zgłoszenia"
                className="min-h-[36px] min-w-[36px] flex items-center justify-center p-1.5 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Zgłaszasz chęć udziału w testach innowacji{" "}
              <strong className="text-stone-900">&quot;{ideaTitle}&quot;</strong>.
              Twoje zgłoszenie zostanie przesłane do weryfikacji administratora platformy.
              Po zatwierdzeniu otrzymasz powiadomienie e-mail i pełny dostęp do formularza ocen.
            </p>

            {applySuccessMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{applySuccessMsg}</span>
              </div>
            )}

            {applyErrorMsg && (
              <div className="p-3 bg-rose-50 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2 border border-rose-200">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{applyErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSendTesterApplication} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-800 block">
                  Dlaczego chcesz testować ten prototyp? / Twoja perspektywa
                </label>
                <textarea
                  rows={3}
                  value={motivationInput}
                  onChange={(e) => setMotivationInput(e.target.value)}
                  placeholder="np. Jestem seniorem z Krakowa / opiekunem osoby starszej / reprezentuję NGO i mogę przetestować rozwiązanie w lokalnej świetlicy..."
                  className="w-full p-3 rounded-xl border border-stone-200 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900"
                />
                <span className="text-[10px] text-stone-400 block">
                  Uzasadnienie pomoże moderatorowi dopasować Cię do odpowiedniej grupy testowej.
                </span>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingApp || Boolean(applySuccessMsg)}
                  className="flex-1 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmittingApp ? (
                    <span>Wysyłanie zgłoszenia...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Wyślij zgłoszenie do admina</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
