"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { User, UserRole, TesterApplication } from "../lib/types";
import { getUsers, saveUsers } from "../lib/auth";
import {
  Lightbulb,
  Users,
  Plus,
  RefreshCw,
  LogOut,
  Shield,
  Search,
  UserPlus,
  Edit2,
  Trash2,
  CheckCircle2,
  Check,
  X,
  Clock,
  ExternalLink,
  FlaskConical,
  FileText,
  Layers,
  Mail,
  Calendar,
  MessageSquare,
} from "lucide-react";
import { CustomSelect } from "../components/shared/CustomSelect";
import { AdminCallsTab } from "../components/grants/AdminCallsTab";
import { GrantCallsPanel } from "../components/grants/GrantCallsPanel";
import { IdeaCard } from "../components/shared/IdeaCard";
import { fetchAllCalls } from "../lib/grantsApi";
import { useApp } from "../context/AppContext";
import {
  fetchTesterApplications,
  updateTesterApplicationStatus,
} from "../lib/api";

type DashboardTab = "calls" | "ideas" | "testers" | "users" | "my-ideas";

function DashboardContent() {
  const {
    currentUser,
    setCurrentUser,
    ideas,
    selectIdea,
    navigate,
    isLargeFont,
    toggleFontSize,
    deleteIdea,
    updateIdeaStatus,
    isLoadingUser,
  } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Aktywna zakładka w panelu zarządzania
  const initialTabParam = searchParams.get("tab") as DashboardTab | null;
  const [activeTab, setActiveTab] = useState<DashboardTab>(
    initialTabParam &&
      ["calls", "ideas", "testers", "users", "my-ideas"].includes(
        initialTabParam,
      )
      ? initialTabParam
      : currentUser?.role === "admin"
        ? "calls"
        : "calls", // Domyślnie Panel Zarządzania jest od razu otwarty na Naborach i Wnioskach
  );

  // Synchronizacja parametru ?tab w adresie URL
  useEffect(() => {
    const tabParam = searchParams.get("tab") as DashboardTab | null;
    if (
      tabParam &&
      ["calls", "ideas", "testers", "users", "my-ideas"].includes(tabParam)
    ) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tab: DashboardTab) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.replaceState({}, "", url.toString());
    }
  };

  // Stan użytkowników (CRUD)
  const [usersList, setUsersList] = useState<User[]>([]);
  const [searchUserQuery, setSearchUserQuery] = useState("");

  // Filtry moderacji pomysłów
  const [ideaStatusFilter, setIdeaStatusFilter] = useState<
    "all" | "pending" | "active" | "testing"
  >("all");
  const [searchIdeaQuery, setSearchIdeaQuery] = useState("");

  // Filtry użytkowników
  const [userRoleFilter, setUserRoleFilter] = useState<
    "all" | "creator" | "tester" | "admin"
  >("all");

  // Filtry Moje Pomysły
  const [myIdeasFilter, setMyIdeasFilter] = useState<
    "all" | "created" | "testing"
  >("all");
  const [searchMyIdeasQuery, setSearchMyIdeasQuery] = useState("");

  // Stan zgłoszeń testerów
  const [testerApps, setTesterApps] = useState<TesterApplication[]>([]);
  const [isLoadingTesterApps, setIsLoadingTesterApps] = useState(false);
  const [testerAppFilter, setTesterAppFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");
  const [searchTesterQuery, setSearchTesterQuery] = useState("");

  // Licznik naborów
  const [callsCount, setCallsCount] = useState(0);

  // Komunikaty zwrotne (Feedback)
  const [adminFeedback, setAdminFeedback] = useState<string>("");

  // Modal tworzenia / edycji użytkownika
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState<UserRole>("creator");
  const [formStatus, setFormStatus] = useState<"active" | "blocked">("active");
  const [formBio, setFormBio] = useState("");

  // Auth guard
  useEffect(() => {
    if (!isLoadingUser && !currentUser) {
      router.push("/auth");
    }
  }, [currentUser, isLoadingUser, router]);

  // Ładowanie listy użytkowników
  useEffect(() => {
    setUsersList(getUsers());
  }, []);

  // Ładowanie zgłoszeń testerów
  useEffect(() => {
    let cancelled = false;
    setIsLoadingTesterApps(true);
    fetchTesterApplications()
      .then((apps) => {
        if (!cancelled) setTesterApps(apps);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsLoadingTesterApps(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Ładowanie naborów
  useEffect(() => {
    let cancelled = false;
    fetchAllCalls()
      .then((calls) => {
        if (!cancelled) setCallsCount(calls.length);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = () => {
    setCurrentUser(null);
    router.push("/auth");
  };

  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center h-96 text-stone-400">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        <span className="text-sm font-medium">
          Wczytywanie profilu i panelu...
        </span>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  const user = currentUser;

  // Filtrowanie pomysłów użytkownika
  const myCreatedIdeas = ideas.filter(
    (i) =>
      i.authorEmail?.toLowerCase() === user.email?.toLowerCase() ||
      i.authorId === user.id,
  );

  const myTestingIdeas = ideas.filter((i) =>
    i.testersList?.includes(user.email),
  );

  // Liczniki powiadomień i statusów
  const pendingIdeasCount = ideas.filter((i) => i.status === "pending").length;
  const pendingTesterAppsCount = testerApps.filter(
    (a) => a.status === "pending",
  ).length;
  const approvedTesterAppsCount = testerApps.filter(
    (a) => a.status === "approved",
  ).length;

  // Handlery dla użytkowników
  const openCreateModal = () => {
    setEditingUserId(null);
    setFormName("");
    setFormEmail("");
    setFormRole("creator");
    setFormStatus("active");
    setFormBio("");
    setIsModalOpen(true);
  };

  const openEditModal = (u: User) => {
    setEditingUserId(u.id);
    setFormName(u.name);
    setFormEmail(u.email);
    setFormRole(u.role);
    setFormStatus(u.status);
    setFormBio(u.bio || "");
    setIsModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) return;

    if (editingUserId) {
      const updated = usersList.map((u) => {
        if (u.id !== editingUserId) return u;
        return {
          ...u,
          name: formName.trim(),
          email: formEmail.trim(),
          role: formRole,
          status: formStatus,
          bio: formBio.trim(),
        };
      });
      setUsersList(updated);
      saveUsers(updated);
      setAdminFeedback(`Zaktualizowano dane użytkownika: ${formName}`);
    } else {
      const newUser: User = {
        id: `user-${Date.now()}`,
        name: formName.trim(),
        email: formEmail.trim(),
        role: formRole,
        avatarBg:
          formRole === "admin"
            ? "#EFE5C6"
            : formRole === "tester"
              ? "#CAD7CE"
              : "#D2D8EE",
        createdAt: new Date().toISOString().split("T")[0],
        status: formStatus,
        bio: formBio.trim() || "Nowy użytkownik.",
      };
      const updated = [newUser, ...usersList];
      setUsersList(updated);
      saveUsers(updated);
      setAdminFeedback(`Utworzono konto: ${newUser.name}`);
    }

    setIsModalOpen(false);
  };

  const handleDeleteUser = (id: string, name: string) => {
    if (confirm(`Czy na pewno usunąć użytkownika "${name}"?`)) {
      const updated = usersList.filter((u) => u.id !== id);
      setUsersList(updated);
      saveUsers(updated);
      setAdminFeedback(`Usunięto użytkownika: ${name}`);
    }
  };

  const loadTesterApps = async () => {
    setIsLoadingTesterApps(true);
    try {
      const apps = await fetchTesterApplications(undefined, undefined, true);
      setTesterApps(apps);
    } catch {
      // fallback
    } finally {
      setIsLoadingTesterApps(false);
    }
  };

  const getTesterInitials = (name?: string | null, email?: string | null) => {
    if (name && name.trim()) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2)
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (email) return email.slice(0, 2).toUpperCase();
    return "TE";
  };

  const getTesterAvatarBg = (str?: string | null) => {
    const s = str || "tester";
    const colors = [
      "#D2D8EE",
      "#CAD7CE",
      "#EFE5C6",
      "#FAD4D8",
      "#E0D7F5",
      "#D7E9F7",
    ];
    let hash = 0;
    for (let i = 0; i < s.length; i++)
      hash = s.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const handleApproveIdea = async (ideaId: string, ideaTitle: string) => {
    try {
      await updateIdeaStatus(ideaId, "active");
      setAdminFeedback(
        `Zaakceptowano i opublikowano pomysł "${ideaTitle}". Autor otrzymał powiadomienie.`,
      );
    } catch (err: unknown) {
      setAdminFeedback(
        err instanceof Error ? err.message : "Błąd akceptacji pomysłu.",
      );
    }
  };

  const handleRejectIdea = async (ideaId: string, ideaTitle: string) => {
    try {
      await updateIdeaStatus(ideaId, "rejected");
      setAdminFeedback(`Odrzucono pomysł "${ideaTitle}".`);
    } catch (err: unknown) {
      setAdminFeedback(
        err instanceof Error ? err.message : "Błąd odrzucenia pomysłu.",
      );
    }
  };

  const handleApproveTester = async (
    appId: string,
    userName: string,
    ideaTitle: string,
  ) => {
    try {
      await updateTesterApplicationStatus(appId, "approved");
      setTesterApps((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: "approved" } : a)),
      );
      setAdminFeedback(
        `Zaakceptowano ${userName} jako testera dla "${ideaTitle}". Wysłano powiadomienie.`,
      );
    } catch (err: unknown) {
      setAdminFeedback(
        err instanceof Error ? err.message : "Błąd akceptacji testera.",
      );
    }
  };

  const handleRejectTester = async (appId: string, userName: string) => {
    try {
      await updateTesterApplicationStatus(appId, "rejected");
      setTesterApps((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: "rejected" } : a)),
      );
      setAdminFeedback(`Odrzucono wniosek testera: ${userName}.`);
    } catch (err: unknown) {
      setAdminFeedback(
        err instanceof Error ? err.message : "Błąd odrzucenia testera.",
      );
    }
  };

  const filteredUsers = usersList.filter((u) => {
    if (userRoleFilter !== "all" && u.role !== userRoleFilter) return false;
    if (searchUserQuery.trim()) {
      const q = searchUserQuery.toLowerCase();
      const matchName = (u.name || "").toLowerCase().includes(q);
      const matchEmail = (u.email || "").toLowerCase().includes(q);
      const matchRole = (u.role || "").toLowerCase().includes(q);
      return matchName || matchEmail || matchRole;
    }
    return true;
  });

  const filteredIdeas = ideas.filter((idea) => {
    if (ideaStatusFilter !== "all" && idea.status !== ideaStatusFilter)
      return false;
    if (searchIdeaQuery.trim()) {
      const q = searchIdeaQuery.toLowerCase();
      const matchTitle = (idea.title || "").toLowerCase().includes(q);
      const matchAuthor = (idea.authorName || "").toLowerCase().includes(q);
      const matchDesc = (idea.description || "").toLowerCase().includes(q);
      const matchCat = (idea.category || "").toLowerCase().includes(q);
      return matchTitle || matchAuthor || matchDesc || matchCat;
    }
    return true;
  });

  const filteredMyCreatedIdeas = myCreatedIdeas.filter((idea) => {
    if (searchMyIdeasQuery.trim()) {
      const q = searchMyIdeasQuery.toLowerCase();
      const matchTitle = (idea.title || "").toLowerCase().includes(q);
      const matchDesc = (idea.description || "").toLowerCase().includes(q);
      const matchCat = (idea.category || "").toLowerCase().includes(q);
      return matchTitle || matchDesc || matchCat;
    }
    return true;
  });

  const filteredMyTestingIdeas = myTestingIdeas.filter((idea) => {
    if (searchMyIdeasQuery.trim()) {
      const q = searchMyIdeasQuery.toLowerCase();
      const matchTitle = (idea.title || "").toLowerCase().includes(q);
      const matchDesc = (idea.description || "").toLowerCase().includes(q);
      const matchCat = (idea.category || "").toLowerCase().includes(q);
      return matchTitle || matchDesc || matchCat;
    }
    return true;
  });

  return (
    <div className="py-6 px-4 sm:px-6 max-w-6xl mx-auto space-y-5">
      {/* 1. KARTA PROFILU I SZYBKICH AKCJI */}
      <div className="bg-white dark:bg-[#1C1E23] rounded-3xl px-5 py-4 border border-black/5 dark:border-white/10 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Lewa: awatar + imię */}
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold text-stone-800 shrink-0 shadow-sm ring-2 ring-black/5 dark:ring-white/10"
            style={{ backgroundColor: user.avatarBg || "#A4B3F6" }}
          >
            {(user.name || user.email || "U").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-stone-900 dark:text-white leading-tight truncate">
                {user.name || user.email || "Użytkownik"}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-900 dark:bg-white text-white dark:text-stone-900 shrink-0">
                <Shield className="w-2.5 h-2.5" />
                Admin
              </span>
            </div>
            <p className="text-[11px] text-stone-400 dark:text-stone-500 truncate">
              {user.email}
            </p>
          </div>
        </div>

        {/* Prawa: przyciski akcji */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => router.push("/testing")}
            className="min-h-[34px] flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-white/10 dark:hover:bg-white/15 text-stone-700 dark:text-stone-300 border border-stone-200/80 dark:border-white/10 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            title="Przejdź do sekcji testera innowacji"
          >
            <FlaskConical className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Sekcja Testera</span>
          </button>

          <button
            type="button"
            onClick={() => navigate("propose")}
            aria-label="Zaproponuj nowy pomysł"
            className="min-h-[34px] flex items-center gap-1.5 px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-950 rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Nowy pomysł</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            aria-label="Wyloguj się z platformy"
            className="min-h-[34px] p-2 flex items-center justify-center bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40 rounded-xl transition-colors cursor-pointer"
            title="Wyloguj się"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>

          {/* WCAG – dyskretny przycisk skali czcionki */}
          <button
            type="button"
            onClick={toggleFontSize}
            aria-label={
              isLargeFont
                ? "Czcionka powiększona (A+) – kliknij, aby przywrócić"
                : "Kliknij, aby włączyć czcionkę A+"
            }
            aria-pressed={isLargeFont}
            title={`WCAG 2.2 AA – czcionka ${isLargeFont ? "powiększona" : "standardowa"}`}
            className={`min-h-[34px] px-2.5 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
              isLargeFont
                ? "bg-stone-900 dark:bg-white text-white dark:text-stone-900 border-transparent"
                : "bg-stone-100 dark:bg-white/10 text-stone-500 dark:text-stone-400 border-stone-200 dark:border-white/10 hover:bg-stone-200 dark:hover:bg-white/15"
            }`}
          >
            {isLargeFont ? "A+" : "A"}
          </button>
        </div>
      </div>

      {/* FEEDBACK BANNER */}
      {adminFeedback && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 rounded-xl text-xs font-medium flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{adminFeedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setAdminFeedback("")}
            className="p-1 min-h-[26px] min-w-[26px] flex items-center justify-center text-emerald-800 dark:text-emerald-300 hover:opacity-70 font-bold text-xs rounded-lg cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. PANEL ZARZĄDZANIA W /DASHBOARD (1-KLIKNIĘCIE) */}
      <div className="space-y-4">
        {/* Nagłówek + zakładki razem w jednej karcie */}
        <div className="bg-white dark:bg-[#1C1E23] rounded-2xl border border-black/5 dark:border-white/10 shadow-2xs overflow-hidden">
          {/* Nagłówek Panelu Zarządzania */}
          <div className="flex items-center gap-2.5 px-4 pt-3.5 pb-2.5 border-b border-black/5 dark:border-white/10">
            <div className="w-6 h-6 rounded-md bg-stone-900 dark:bg-white text-white dark:text-stone-900 flex items-center justify-center shrink-0">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-xs font-bold text-stone-900 dark:text-white tracking-tight uppercase">
              Panel Zarządzania
            </h2>
          </div>

          {/* Pasek zakładek */}
          <div
            role="tablist"
            aria-label="Zakładki panelu zarządzania"
            className="flex items-center gap-0.5 overflow-x-auto scrollbar-none px-3 py-2 bg-stone-50 dark:bg-white/3"
          >
            {[
              {
                id: "calls" as DashboardTab,
                icon: <FileText className="w-3.5 h-3.5" />,
                label: "Nabory",
                badge: callsCount,
                isBadgeAlert: false,
              },
              {
                id: "ideas" as DashboardTab,
                icon: <Lightbulb className="w-3.5 h-3.5" />,
                label: "Pomysły",
                badge: pendingIdeasCount > 0 ? pendingIdeasCount : ideas.length,
                isBadgeAlert: pendingIdeasCount > 0,
              },
              {
                id: "testers" as DashboardTab,
                icon: <FlaskConical className="w-3.5 h-3.5" />,
                label: "Testerzy",
                badge:
                  pendingTesterAppsCount > 0
                    ? pendingTesterAppsCount
                    : testerApps.length,
                isBadgeAlert: pendingTesterAppsCount > 0,
              },
              {
                id: "users" as DashboardTab,
                icon: <Users className="w-3.5 h-3.5" />,
                label: "Użytkownicy",
                badge: usersList.length,
                isBadgeAlert: false,
              },
              {
                id: "my-ideas" as DashboardTab,
                icon: <Layers className="w-3.5 h-3.5" />,
                label: "Moje Pomysły",
                badge: myCreatedIdeas.length + myTestingIdeas.length,
                isBadgeAlert: false,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`min-h-[34px] px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-white dark:bg-[#1C1E23] text-stone-900 dark:text-white shadow-sm border border-black/5 dark:border-white/10 font-bold"
                    : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-white/5"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                    tab.isBadgeAlert
                      ? "bg-amber-500 text-white animate-pulse"
                      : activeTab === tab.id
                        ? "bg-stone-200 dark:bg-white/15 text-stone-700 dark:text-stone-300"
                        : "bg-stone-200/70 dark:bg-white/10 text-stone-500 dark:text-stone-500"
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* TAB 1: NABORY I WNIOSKI (GENERATOR PDF) */}
        <div className={activeTab === "calls" ? "block" : "hidden"}>
          <AdminCallsTab
            onFeedback={setAdminFeedback}
            onCount={setCallsCount}
          />
        </div>

        {/* TAB 2: MODERACJA POMYSŁÓW */}
        <div className={activeTab === "ideas" ? "block space-y-4" : "hidden"}>
          {/* Pasek filtrów - zsynchronizowany z pozostałymi zakładkami */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-[#1C1E23] rounded-2xl border border-black/5 dark:border-white/10 shadow-2xs">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: "all", label: `Wszystkie`, count: ideas.length },
                  {
                    id: "pending",
                    label: `Oczekujące`,
                    count: pendingIdeasCount,
                  },
                  {
                    id: "active",
                    label: `Aktywne`,
                    count: ideas.filter((i) => i.status === "active").length,
                  },
                  {
                    id: "testing",
                    label: `W testach`,
                    count: ideas.filter((i) => i.status === "testing").length,
                  },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setIdeaStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5 ${
                    ideaStatusFilter === tab.id
                      ? tab.id === "pending" && pendingIdeasCount > 0
                        ? "bg-amber-600 text-white shadow-2xs"
                        : "bg-stone-900 dark:bg-white text-white dark:text-stone-950 shadow-2xs"
                      : "bg-stone-100 dark:bg-white/10 hover:bg-stone-200 dark:hover:bg-white/15 text-stone-600 dark:text-stone-300"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`text-[10px] font-bold px-1 rounded ${
                      ideaStatusFilter === tab.id ? "opacity-80" : "opacity-60"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Prawa strona: Szukajka + Wskaźnik decyzji */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-52">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                <input
                  type="text"
                  value={searchIdeaQuery}
                  onChange={(e) => setSearchIdeaQuery(e.target.value)}
                  placeholder="Szukaj pomysłu..."
                  className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-stone-200 dark:border-white/15 focus:border-stone-900 dark:focus:border-white focus:outline-none text-xs text-stone-900 dark:text-white bg-transparent"
                />
                {searchIdeaQuery && (
                  <button
                    onClick={() => setSearchIdeaQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="text-xs shrink-0">
                {pendingIdeasCount > 0 ? (
                  <span className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-semibold bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800/40">
                    <Clock className="w-3.5 h-3.5" />
                    Wymaga decyzji: {pendingIdeasCount}
                  </span>
                ) : (
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Zweryfikowane
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Karty pomysłów */}
          <div className="space-y-3 sm:space-y-4">
            {filteredIdeas.map((idea) => {
              const isPending = idea.status === "pending";

              return (
                <div
                  key={idea.id}
                  className={`rounded-2xl border transition-all space-y-0 ${
                    isPending
                      ? "bg-amber-50/40 dark:bg-amber-950/20 border-amber-300/80 dark:border-amber-500/40 shadow-xs ring-1 ring-amber-400/20"
                      : "bg-white dark:bg-[#1C1E23] border-stone-200/80 dark:border-white/10 shadow-2xs hover:shadow-sm"
                  }`}
                >
                  {/* Górna sekcja: meta + tytuł */}
                  <div className="p-4 sm:p-5 space-y-3">
                    {/* Meta-row: kategoria, autor, data, status */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-white/10 text-stone-600 dark:text-stone-300 border border-stone-200/60 dark:border-white/10">
                        {idea.category}
                      </span>

                      {/* Status Pill */}
                      {isPending ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                          <Clock className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                          Oczekuje na akceptację
                        </span>
                      ) : idea.status === "active" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60">
                          <CheckCircle2 className="w-3 h-3" />
                          Aktywny
                        </span>
                      ) : idea.status === "testing" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-200/60">
                          <Users className="w-3 h-3" />W testach (
                          {idea.testersCount} testerów)
                        </span>
                      ) : idea.status === "rejected" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200/60">
                          <X className="w-3 h-3" />
                          Odrzucony
                        </span>
                      ) : null}

                      <span className="ml-auto text-[11px] text-stone-400 dark:text-stone-500">
                        {idea.createdAt}
                      </span>
                    </div>

                    {/* Tytuł + opis */}
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-stone-900 dark:text-white flex items-start gap-2">
                        <span className="flex-1">{idea.title}</span>
                        <button
                          type="button"
                          onClick={() => router.push(`/discover/${idea.id}`)}
                          className="text-stone-400 hover:text-stone-900 dark:hover:text-white p-1 rounded-lg cursor-pointer shrink-0"
                          title="Zobacz podgląd pomysłu"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </h4>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                        Autor:{" "}
                        <span className="font-semibold text-stone-700 dark:text-stone-300">
                          {idea.authorName}
                        </span>
                      </p>
                      {idea.description && (
                        <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2 leading-relaxed mt-1.5">
                          {idea.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Dolna sekcja: akcje moderacji */}
                  <div
                    className={`px-4 sm:px-5 py-3 border-t flex flex-wrap items-center gap-2 ${
                      isPending
                        ? "border-amber-200/60 dark:border-amber-700/30 bg-amber-50/50 dark:bg-amber-950/20"
                        : "border-stone-100 dark:border-white/5 bg-stone-50/50 dark:bg-white/2"
                    }`}
                  >
                    {isPending && (
                      <>
                        <button
                          onClick={() => handleApproveIdea(idea.id, idea.title)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Zaakceptuj
                        </button>
                        <button
                          onClick={() => handleRejectIdea(idea.id, idea.title)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-white/5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-700/30 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          Odrzuć
                        </button>
                      </>
                    )}

                    <div className="ml-auto flex items-center gap-2">
                      <CustomSelect
                        value={idea.status}
                        onChange={(val) =>
                          updateIdeaStatus(
                            idea.id,
                            val as
                              | "active"
                              | "pending"
                              | "testing"
                              | "rejected"
                              | "archived",
                          )
                        }
                        options={[
                          { value: "active", label: "Aktywny" },
                          { value: "pending", label: "Oczekujący" },
                          { value: "testing", label: "Testy" },
                          { value: "rejected", label: "Odrzucony" },
                          { value: "archived", label: "Archiwum" },
                        ]}
                        className="text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Usunąć pomysł "${idea.title}"?`)) {
                            deleteIdea(idea.id);
                            setAdminFeedback("Usunięto pomysł.");
                          }
                        }}
                        className="p-2 min-h-[34px] min-w-[34px] flex items-center justify-center hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-500 dark:text-rose-400 rounded-xl cursor-pointer transition-colors"
                        title="Usuń całkowicie"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredIdeas.length === 0 && (
              <div className="p-12 text-center text-xs text-stone-500 bg-white dark:bg-[#1C1E23] rounded-2xl border border-black/5 dark:border-white/10 shadow-2xs">
                {searchIdeaQuery || ideaStatusFilter !== "all"
                  ? "Brak pomysłów spełniających kryteria wyszukiwania."
                  : "Brak pomysłów do wyświetlenia."}
              </div>
            )}
          </div>
        </div>

        {/* TAB 3: ZGŁOSZENIA TESTERÓW */}
        <div className={activeTab === "testers" ? "block space-y-4" : "hidden"}>
          {/* Pasek filtrów - ta sama struktura co tab ideas */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-[#1C1E23] rounded-2xl border border-black/5 dark:border-white/10 shadow-2xs">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: "all", label: "Wszystkie", count: testerApps.length },
                  {
                    id: "pending",
                    label: "Oczekujące",
                    count: pendingTesterAppsCount,
                  },
                  {
                    id: "approved",
                    label: "Zaakceptowane",
                    count: approvedTesterAppsCount,
                  },
                  {
                    id: "rejected",
                    label: "Odrzucone",
                    count: testerApps.filter((a) => a.status === "rejected")
                      .length,
                  },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setTesterAppFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5 ${
                    testerAppFilter === f.id
                      ? f.id === "pending" && pendingTesterAppsCount > 0
                        ? "bg-amber-600 text-white shadow-2xs"
                        : "bg-stone-900 dark:bg-white text-white dark:text-stone-950 shadow-2xs"
                      : "bg-stone-100 dark:bg-white/10 hover:bg-stone-200 dark:hover:bg-white/15 text-stone-600 dark:text-stone-300"
                  }`}
                >
                  {f.label}
                  <span
                    className={`text-[10px] font-bold px-1 rounded ${
                      testerAppFilter === f.id ? "opacity-80" : "opacity-60"
                    }`}
                  >
                    {f.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Szukajka i Odśwież */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                <input
                  type="text"
                  value={searchTesterQuery}
                  onChange={(e) => setSearchTesterQuery(e.target.value)}
                  placeholder="Szukaj testera..."
                  className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-stone-200 dark:border-white/15 focus:border-stone-900 dark:focus:border-white focus:outline-none text-xs text-stone-900 dark:text-white bg-transparent"
                />
                {searchTesterQuery && (
                  <button
                    onClick={() => setSearchTesterQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
              <button
                onClick={loadTesterApps}
                className="p-2 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-white/10 rounded-xl cursor-pointer shrink-0"
                title="Odśwież zgłoszenia"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isLoadingTesterApps ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>

          {/* Lista kart zgłoszeń testerów - WYRAŹNA SEPARACJA */}
          {isLoadingTesterApps && testerApps.length === 0 ? (
            <div className="p-12 text-center text-xs text-stone-400 flex items-center justify-center gap-2 bg-white dark:bg-[#1C1E23] rounded-2xl border border-black/5 dark:border-white/10">
              <RefreshCw className="w-4 h-4 animate-spin text-stone-500" />
              <span>Wczytywanie zgłoszeń testerów...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {testerApps
                .filter((app) => {
                  if (
                    testerAppFilter !== "all" &&
                    app.status !== testerAppFilter
                  )
                    return false;
                  if (searchTesterQuery.trim()) {
                    const q = searchTesterQuery.toLowerCase();
                    const matchName = (app.user_name || "")
                      .toLowerCase()
                      .includes(q);
                    const matchEmail = (app.user_email || "")
                      .toLowerCase()
                      .includes(q);
                    const matchTitle = (app.idea_title || "")
                      .toLowerCase()
                      .includes(q);
                    const matchMotivation = (app.motivation || "")
                      .toLowerCase()
                      .includes(q);
                    return (
                      matchName || matchEmail || matchTitle || matchMotivation
                    );
                  }
                  return true;
                })
                .map((app) => {
                  const isAppPending = app.status === "pending";

                  return (
                    <div
                      key={app.id}
                      className={`rounded-2xl p-5 sm:p-6 border transition-all space-y-4 ${
                        isAppPending
                          ? "bg-amber-50/30 dark:bg-amber-950/20 border-amber-300/90 dark:border-amber-500/40 shadow-xs ring-1 ring-amber-400/20"
                          : "bg-white dark:bg-[#1C1E23] border-stone-200/80 dark:border-white/10 shadow-2xs hover:shadow-xs"
                      }`}
                    >
                      {/* 1. Górny pasek: Kandydat po lewej, Status i Decyzja po prawej */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100 dark:border-white/10">
                        {/* Kandydat */}
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-stone-900 text-xs shrink-0 shadow-2xs"
                            style={{
                              backgroundColor: getTesterAvatarBg(
                                app.user_name || app.user_email || "tester",
                              ),
                            }}
                          >
                            {getTesterInitials(app.user_name, app.user_email)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-bold text-stone-900 dark:text-white">
                                {app.user_name || "Anonimowy Kandydat"}
                              </h4>
                              {isAppPending ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300">
                                  <Clock className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                                  Oczekuje na akceptację
                                </span>
                              ) : app.status === "approved" ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
                                  Zaakceptowany tester
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40">
                                  <X className="w-3 h-3 text-rose-700 dark:text-rose-400" />
                                  Odrzucony
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400 mt-1 flex-wrap">
                              {app.user_email && (
                                <span className="inline-flex items-center gap-1">
                                  <Mail className="w-3 h-3 text-stone-400" />
                                  <span>{app.user_email}</span>
                                </span>
                              )}
                              {app.created_at && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-stone-400">
                                  <Calendar className="w-3 h-3 text-stone-400" />
                                  <span>
                                    Data zgłoszenia:{" "}
                                    {app.created_at.split("T")[0]}
                                  </span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Przyciski decyzyjne po prawej */}
                        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 pt-1 sm:pt-0">
                          {isAppPending ? (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  handleApproveTester(
                                    app.id,
                                    app.user_name,
                                    app.idea_title,
                                  )
                                }
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                              >
                                <Check className="w-4 h-4 stroke-[3]" />
                                <span>Zaakceptuj testera</span>
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleRejectTester(app.id, app.user_name)
                                }
                                className="inline-flex items-center gap-1 px-3 py-2 bg-stone-100 dark:bg-white/10 hover:bg-rose-100 dark:hover:bg-rose-950/50 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Odrzuć</span>
                              </button>
                            </div>
                          ) : app.status === "approved" ? (
                            <div className="inline-flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              <span>Tester ma dostęp do testów</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 text-xs text-rose-700 dark:text-rose-400 font-medium bg-rose-50 dark:bg-rose-950/40 px-3.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800/40">
                              <span>Wniosek odrzucony</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 2. Dolny pas: Siatka 2-kolumnowa (Projekt po lewej, Motywacja po prawej) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                        {/* Box Projektu testowego */}
                        <div className="bg-stone-50/90 dark:bg-white/5 rounded-xl p-3.5 sm:p-4 border border-stone-200/70 dark:border-white/10 flex items-center">
                          <button
                            type="button"
                            onClick={() =>
                              router.push(`/discover/${app.idea_id}`)
                            }
                            className="font-bold text-stone-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 text-xs sm:text-sm text-left flex items-center justify-between gap-3 w-full group cursor-pointer transition-colors"
                          >
                            <span className="flex items-center gap-2.5 line-clamp-2">
                              <FlaskConical className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                              <span>{app.idea_title}</span>
                            </span>
                            <ExternalLink className="w-4 h-4 text-stone-400 group-hover:text-amber-600 shrink-0 transition-transform group-hover:translate-x-0.5" />
                          </button>
                        </div>

                        {/* Box Motywacji */}
                        <div className="bg-stone-50/90 dark:bg-white/5 rounded-xl p-3.5 sm:p-4 border border-stone-200/70 dark:border-white/10 flex items-center">
                          {app.motivation ? (
                            <div className="flex items-start gap-2.5 text-xs text-stone-700 dark:text-stone-300 italic leading-relaxed">
                              <MessageSquare className="w-4 h-4 text-stone-400 dark:text-stone-500 shrink-0 mt-0.5 not-italic" />
                              <span>&ldquo;{app.motivation}&rdquo;</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2.5 text-xs text-stone-400 italic">
                              <MessageSquare className="w-4 h-4 text-stone-300 dark:text-stone-600 shrink-0 not-italic" />
                              <span>
                                Brak dodatkowej wiadomości od kandydata.
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

              {testerApps.length === 0 && (
                <div className="py-12 text-center text-xs text-stone-500 bg-white dark:bg-[#1C1E23] rounded-2xl border border-black/5 dark:border-white/10">
                  Brak zgłoszeń testerów w systemie.
                </div>
              )}
            </div>
          )}
        </div>

        {/* TAB 4: UŻYTKOWNICY I UPRAWNIENIA */}
        <div className={activeTab === "users" ? "block space-y-4" : "hidden"}>
          {/* Pasek narzędzi - zsynchronizowany z pozostałymi zakładkami */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-[#1C1E23] rounded-2xl border border-black/5 dark:border-white/10 shadow-2xs">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: "all", label: "Wszyscy", count: usersList.length },
                {
                  id: "creator",
                  label: "Twórcy",
                  count: usersList.filter((u) => u.role === "creator").length,
                },
                {
                  id: "tester",
                  label: "Testerzy",
                  count: usersList.filter((u) => u.role === "tester").length,
                },
                {
                  id: "admin",
                  label: "Administratorzy",
                  count: usersList.filter((u) => u.role === "admin").length,
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() =>
                    setUserRoleFilter(tab.id as typeof userRoleFilter)
                  }
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5 ${
                    userRoleFilter === tab.id
                      ? "bg-stone-900 dark:bg-white text-white dark:text-stone-950 shadow-2xs"
                      : "bg-stone-100 dark:bg-white/10 hover:bg-stone-200 dark:hover:bg-white/15 text-stone-600 dark:text-stone-300"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`text-[10px] font-bold px-1 rounded ${
                      userRoleFilter === tab.id ? "opacity-80" : "opacity-60"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Prawa strona: Szukajka + Dodaj użytkownika */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                <input
                  type="text"
                  value={searchUserQuery}
                  onChange={(e) => setSearchUserQuery(e.target.value)}
                  placeholder="Szukaj użytkownika..."
                  className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-stone-200 dark:border-white/15 focus:border-stone-900 dark:focus:border-white focus:outline-none text-xs text-stone-900 dark:text-white bg-transparent"
                />
                {searchUserQuery && (
                  <button
                    onClick={() => setSearchUserQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
              <button
                onClick={openCreateModal}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-950 rounded-xl text-xs font-semibold cursor-pointer shadow-2xs whitespace-nowrap transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Dodaj użytkownika</span>
              </button>
            </div>
          </div>

          {/* Tabela użytkowników w karcie */}
          <div className="bg-white dark:bg-[#1C1E23] rounded-2xl border border-black/5 dark:border-white/10 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-800 dark:text-stone-200">
                <thead className="bg-stone-50 dark:bg-white/5 text-stone-500 dark:text-stone-400 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4 rounded-l-lg">Użytkownik</th>
                    <th className="py-3 px-4">Rola</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right rounded-r-lg">Akcje</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-white/10">
                  {filteredUsers.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-stone-50/60 dark:hover:bg-white/5 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-stone-800 text-[11px] shrink-0"
                            style={{ backgroundColor: u.avatarBg || "#A4B3F6" }}
                          >
                            {(u.name || u.email || "U").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-stone-900 dark:text-white">
                              {u.name || u.email || "Użytkownik"}
                            </p>
                            <p className="text-[10px] text-stone-400">
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-stone-100 dark:bg-white/10 text-stone-600 dark:text-stone-300 border border-stone-200/60 dark:border-white/10">
                          {u.role}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${
                            u.status === "active"
                              ? "text-emerald-700 dark:text-emerald-400"
                              : "text-stone-400"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.status === "active"
                                ? "bg-emerald-500"
                                : "bg-stone-400"
                            }`}
                          />
                          {u.status === "active" ? "Aktywny" : "Zablokowany"}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(u)}
                            aria-label={`Edytuj użytkownika ${u.name}`}
                            className="p-1.5 min-h-[30px] min-w-[30px] flex items-center justify-center rounded-lg hover:bg-stone-100 dark:hover:bg-white/10 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white cursor-pointer transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            aria-label={`Usuń użytkownika ${u.name}`}
                            className="p-1.5 min-h-[30px] min-w-[30px] flex items-center justify-center rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-500 hover:text-rose-700 cursor-pointer transition-colors"
                          >
                            <Trash2
                              className="w-3.5 h-3.5"
                              aria-hidden="true"
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredUsers.length === 0 && (
              <div className="p-12 text-center text-xs text-stone-500">
                {searchUserQuery || userRoleFilter !== "all"
                  ? "Brak użytkowników pasujących do kryteriów wyszukiwania."
                  : "Brak użytkowników w systemie."}
              </div>
            )}
          </div>
        </div>

        {/* TAB 5: MOJE POMYSŁY & TESTY */}
        <div
          className={activeTab === "my-ideas" ? "block space-y-4" : "hidden"}
        >
          {/* Pasek filtrów i narzędzi – zsynchronizowany z pozostałymi zakładkami */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-[#1C1E23] rounded-2xl border border-black/5 dark:border-white/10 shadow-2xs">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                {
                  id: "all",
                  label: "Wszystkie moje",
                  count: myCreatedIdeas.length + myTestingIdeas.length,
                },
                {
                  id: "created",
                  label: "Moje pomysły",
                  count: myCreatedIdeas.length,
                },
                {
                  id: "testing",
                  label: "Udział w testach",
                  count: myTestingIdeas.length,
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() =>
                    setMyIdeasFilter(tab.id as typeof myIdeasFilter)
                  }
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5 ${
                    myIdeasFilter === tab.id
                      ? "bg-stone-900 dark:bg-white text-white dark:text-stone-950 shadow-2xs"
                      : "bg-stone-100 dark:bg-white/10 hover:bg-stone-200 dark:hover:bg-white/15 text-stone-600 dark:text-stone-300"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`text-[10px] font-bold px-1 rounded ${
                      myIdeasFilter === tab.id ? "opacity-80" : "opacity-60"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Prawa strona: Szukajka + Dodaj pomysł */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                <input
                  type="text"
                  value={searchMyIdeasQuery}
                  onChange={(e) => setSearchMyIdeasQuery(e.target.value)}
                  placeholder="Szukaj w moich..."
                  className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-stone-200 dark:border-white/15 focus:border-stone-900 dark:focus:border-white focus:outline-none text-xs text-stone-900 dark:text-white bg-transparent"
                />
                {searchMyIdeasQuery && (
                  <button
                    onClick={() => setSearchMyIdeasQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
              <button
                onClick={() => router.push("/propose")}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-stone-900 dark:bg-white text-white dark:text-stone-950 rounded-xl text-xs font-semibold hover:bg-stone-800 dark:hover:bg-stone-100 cursor-pointer shadow-2xs transition-colors whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nowy pomysł</span>
              </button>
            </div>
          </div>

          {/* Sekcja: Moje Zgłoszone Pomysły */}
          {(myIdeasFilter === "all" || myIdeasFilter === "created") && (
            <div className="space-y-3">
              {myIdeasFilter === "all" && (
                <div className="p-3.5 px-4 bg-white dark:bg-[#1C1E23] rounded-2xl border border-black/5 dark:border-white/10 shadow-2xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-stone-500 dark:text-stone-400" />
                    <span className="text-xs font-bold text-stone-900 dark:text-white">
                      Moje Zgłoszone Pomysły
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-stone-100 dark:bg-white/10 text-stone-600 dark:text-stone-400">
                      {filteredMyCreatedIdeas.length}
                    </span>
                  </div>
                </div>
              )}

              <GrantCallsPanel myIdeas={myCreatedIdeas} />

              {filteredMyCreatedIdeas.length === 0 ? (
                <div className="p-12 text-center text-xs text-stone-500 bg-white dark:bg-[#1C1E23] rounded-2xl border border-black/5 dark:border-white/10 shadow-2xs">
                  {searchMyIdeasQuery
                    ? "Brak zgłoszonych pomysłów pasujących do wyszukiwania."
                    : "Brak zgłoszonych pomysłów przez to konto."}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredMyCreatedIdeas.map((idea) => (
                    <IdeaCard
                      key={idea.id}
                      idea={idea}
                      onClick={() => selectIdea(idea)}
                      isTester={idea.testersList?.includes(user.email)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sekcja: Udział w testach */}
          {(myIdeasFilter === "all" || myIdeasFilter === "testing") && (
            <div className="space-y-3 pt-2">
              {myIdeasFilter === "all" && (
                <div className="p-3.5 px-4 bg-white dark:bg-[#1C1E23] rounded-2xl border border-black/5 dark:border-white/10 shadow-2xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-stone-500 dark:text-stone-400" />
                    <span className="text-xs font-bold text-stone-900 dark:text-white">
                      Mój Udział w Testach
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-stone-100 dark:bg-white/10 text-stone-600 dark:text-stone-400">
                      {filteredMyTestingIdeas.length}
                    </span>
                  </div>
                </div>
              )}

              {filteredMyTestingIdeas.length === 0 ? (
                <div className="p-12 text-center text-xs text-stone-500 bg-white dark:bg-[#1C1E23] rounded-2xl border border-black/5 dark:border-white/10 shadow-2xs">
                  {searchMyIdeasQuery
                    ? "Brak testowanych projektów pasujących do wyszukiwania."
                    : "Nie bierzesz udziału w żadnych testach prototypów."}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredMyTestingIdeas.map((idea) => (
                    <IdeaCard
                      key={idea.id}
                      idea={idea}
                      onClick={() => selectIdea(idea)}
                      isTester={true}
                      onChat={(e) => {
                        e.stopPropagation();
                        router.push(
                          `/chat?topic=${encodeURIComponent(`Testy projektu: ${idea.title}`)}`,
                        );
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CREATE / EDIT USER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1C1E23] rounded-2xl p-6 max-w-md w-full border border-stone-200 dark:border-white/15 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-stone-900 dark:text-white">
              {editingUserId ? "Edytuj użytkownika" : "Nowy użytkownik"}
            </h3>

            <form onSubmit={handleSaveUser} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Imię i nazwisko
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-white/15 focus:border-stone-900 dark:focus:border-white focus:outline-none text-xs text-stone-900 dark:text-white bg-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-white/15 focus:border-stone-900 dark:focus:border-white focus:outline-none text-xs text-stone-900 dark:text-white bg-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Rola
                  </label>
                  <CustomSelect
                    value={formRole}
                    onChange={(val) => setFormRole(val as UserRole)}
                    options={[
                      { value: "creator", label: "Twórca / Instytucja" },
                      { value: "tester", label: "Tester" },
                      { value: "admin", label: "Administrator (ROPS)" },
                    ]}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Status
                  </label>
                  <CustomSelect
                    value={formStatus}
                    onChange={(val) =>
                      setFormStatus(val as "active" | "blocked")
                    }
                    options={[
                      { value: "active", label: "Aktywny" },
                      { value: "blocked", label: "Zablokowany" },
                    ]}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-white/10 dark:hover:bg-white/15 text-stone-800 dark:text-stone-200 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-950 rounded-xl text-xs font-semibold cursor-pointer shadow-2xs"
                >
                  Zapisz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-96 text-stone-400">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" />
          <span className="text-sm font-medium">Wczytywanie dashboardu...</span>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
