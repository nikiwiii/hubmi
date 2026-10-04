"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, UserRole, TesterApplication } from "../lib/types";
import { getUsers, saveUsers, setCurrentUser } from "../lib/auth";
import {
  ShieldAlert,
  UserPlus,
  Edit2,
  Trash2,
  CheckCircle2,
  Search,
  RefreshCw,
  Lock,
  Check,
  X,
  ExternalLink,
  Clock,
  Sparkles,
  Users,
  AlertCircle,
  FlaskConical,
} from "lucide-react";
import { CustomSelect } from "../components/shared/CustomSelect";
import { useApp } from "../context/AppContext";
import {
  fetchTesterApplications,
  updateTesterApplicationStatus,
} from "../lib/api";

export default function AdminPage() {
  const {
    currentUser,
    ideas,
    setCurrentUser: onUserChange,
    deleteIdea,
    updateIdeaStatus,
    isLoadingUser,
  } = useApp();
  const router = useRouter();

  const [usersList, setUsersList] = useState<User[]>(getUsers());
  const [searchUserQuery, setSearchUserQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"users" | "ideas" | "testers">("users");

  // Moderation filter states
  const [ideaStatusFilter, setIdeaStatusFilter] = useState<"all" | "pending" | "active" | "testing">("all");
  const [testerAppFilter, setTesterAppFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  // Tester applications state
  const [testerApps, setTesterApps] = useState<TesterApplication[]>([]);
  const [isLoadingTesterApps, setIsLoadingTesterApps] = useState(false);

  // Modal / Form states for Create/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState<UserRole>("creator");
  const [formStatus, setFormStatus] = useState<"active" | "blocked">("active");
  const [formBio, setFormBio] = useState("");
  const [adminFeedback, setAdminFeedback] = useState<string>("");

  const isAdmin = currentUser?.role === "admin";

  // Auth guard
  useEffect(() => {
    if (!isLoadingUser && !currentUser) {
      router.push('/auth');
    }
  }, [currentUser, isLoadingUser, router]);

  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center h-96 text-stone-400">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        <span className="text-sm font-medium">Wczytywanie panelu...</span>
      </div>
    );
  }

  if (!currentUser) {
    return null; // redirect in progress
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4 text-stone-500">
        <Lock className="w-8 h-8 text-stone-300" />
        <p className="text-sm font-medium">Brak dostępu. Wymagane uprawnienia administratora.</p>
        <button
          onClick={() => router.push('/')}
          className="px-5 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition-colors"
        >
          Wróć do strony głównej
        </button>
      </div>
    );
  }

  const handleElevateToAdmin = () => {
    const all = getUsers();
    const adminAccount = all.find((u) => u.role === "admin") || all[0];
    setCurrentUser(adminAccount);
    onUserChange(adminAccount);
    setAdminFeedback(`Zalogowano jako ${adminAccount.name}.`);
  };

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
      setAdminFeedback(`Zaktualizowano: ${formName}`);
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
      setAdminFeedback(`Utworzono: ${newUser.name}`);
    }

    setIsModalOpen(false);
  };

  const handleDeleteUser = (id: string, name: string) => {
    if (confirm(`Usunąć użytkownika "${name}"?`)) {
      const updated = usersList.filter((u) => u.id !== id);
      setUsersList(updated);
      saveUsers(updated);
      setAdminFeedback(`Usunięto: ${name}`);
    }
  };

  const loadTesterApps = async () => {
    setIsLoadingTesterApps(true);
    try {
      const apps = await fetchTesterApplications();
      setTesterApps(apps);
    } catch {
      // Local fallback
    } finally {
      setIsLoadingTesterApps(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadTesterApps();
    }
  }, [isAdmin, activeTab]);

  const handleApproveIdea = async (ideaId: string, ideaTitle: string) => {
    try {
      await updateIdeaStatus(ideaId, "active");
      setAdminFeedback(`Zaakceptowano i opublikowano pomysł "${ideaTitle}". Autor otrzymał powiadomienie.`);
    } catch (err: any) {
      setAdminFeedback(err.message || "Błąd akceptacji pomysłu.");
    }
  };

  const handleRejectIdea = async (ideaId: string, ideaTitle: string) => {
    try {
      await updateIdeaStatus(ideaId, "rejected");
      setAdminFeedback(`Odrzucono pomysł "${ideaTitle}".`);
    } catch (err: any) {
      setAdminFeedback(err.message || "Błąd odrzucenia pomysłu.");
    }
  };

  const handleApproveTester = async (appId: string, userName: string, ideaTitle: string) => {
    try {
      await updateTesterApplicationStatus(appId, "approved");
      setTesterApps((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: "approved" } : a))
      );
      setAdminFeedback(`Zaakceptowano ${userName} jako testera dla "${ideaTitle}". Wysłano powiadomienie do użytkownika.`);
    } catch (err: any) {
      setAdminFeedback(err.message || "Błąd akceptacji testera.");
    }
  };

  const handleRejectTester = async (appId: string, userName: string) => {
    try {
      await updateTesterApplicationStatus(appId, "rejected");
      setTesterApps((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: "rejected" } : a))
      );
      setAdminFeedback(`Odrzucono wniosek testera: ${userName}.`);
    } catch (err: any) {
      setAdminFeedback(err.message || "Błąd odrzucenia testera.");
    }
  };

  const pendingIdeasCount = ideas.filter((i) => i.status === "pending").length;
  const pendingTesterAppsCount = testerApps.filter((a) => a.status === "pending").length;
  const approvedTesterAppsCount = testerApps.filter((a) => a.status === "approved").length;

  if (!isAdmin) {
    return (
      <div className="py-16 px-4 max-w-md mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-6 h-6" />
        </div>

        <h1 className="text-xl font-bold text-stone-900">
          Wymagane uprawnienia administratora
        </h1>

        <div className="p-5 bg-white rounded-2xl border border-black/5 shadow-2xs space-y-3">
          <p className="text-xs text-stone-600">
            Zalogowany: <strong>{currentUser?.name || "Gość"}</strong>
          </p>

          <button
            onClick={handleElevateToAdmin}
            className="w-full py-2.5 px-4 bg-stone-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
          >
            Przełącz na konto Administratora (Marek)
          </button>
        </div>
      </div>
    );
  }

  const filteredUsers = usersList.filter(
    (u) =>
      u.name.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchUserQuery.toLowerCase()),
  );

  return (
    <div className="py-6 px-4 sm:px-6 max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-black/5">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
            Panel Zarządzania
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Zarządzanie użytkownikami, zgłoszeniami oraz ewaluacją prototypów
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => router.push("/testing")}
            className="flex items-center gap-2 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
            title="Przejdź do sekcji testera innowacji"
          >
            <FlaskConical className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
            <span>Sekcja Testera</span>
            <ExternalLink className="w-3.5 h-3.5 text-stone-400 group-hover:text-white transition-colors" />
          </button>

          {/* Tab Switcher */}
          <div
            role="tablist"
            aria-label="Widoki panelu administratora"
            className="flex flex-wrap bg-stone-200/50 p-1 rounded-xl self-start sm:self-auto gap-1"
          >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "users"}
            onClick={() => setActiveTab("users")}
            className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "users"
                ? "bg-white text-stone-900 shadow-2xs font-bold"
                : "text-stone-700 hover:text-stone-900"
            }`}
          >
            Użytkownicy ({usersList.length})
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "ideas"}
            onClick={() => setActiveTab("ideas")}
            className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "ideas"
                ? "bg-white text-stone-900 shadow-2xs font-bold"
                : "text-stone-700 hover:text-stone-900"
            }`}
          >
            <span>Pomysły & Moderacja</span>
            {pendingIdeasCount > 0 ? (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
                {pendingIdeasCount} do akceptacji
              </span>
            ) : (
              <span className="text-[11px] text-stone-500 font-mono">({ideas.length})</span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "testers"}
            onClick={() => setActiveTab("testers")}
            className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "testers"
                ? "bg-white text-stone-900 shadow-2xs font-bold"
                : "text-stone-700 hover:text-stone-900"
            }`}
          >
            <span>Zgłoszenia Testerów</span>
            {pendingTesterAppsCount > 0 ? (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
                {pendingTesterAppsCount} do weryfikacji
              </span>
            ) : (
              <span className="text-[11px] text-stone-500 font-mono">({testerApps.length})</span>
            )}
          </button>
        </div>
      </div>
    </div>

      {adminFeedback && (
        <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{adminFeedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setAdminFeedback("")}
            aria-label="Zamknij powiadomienie"
            className="p-1 min-h-[28px] min-w-[28px] flex items-center justify-center text-emerald-800 hover:text-emerald-950 font-bold text-xs rounded-lg cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* TAB 1: USERS CRUD */}
      {activeTab === "users" && (
        <div className="bg-white rounded-2xl border border-black/5 shadow-2xs overflow-hidden p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={searchUserQuery}
                onChange={(e) => setSearchUserQuery(e.target.value)}
                placeholder="Szukaj..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 focus:border-stone-900 focus:outline-none text-xs text-stone-900"
              />
            </div>

            <button
              onClick={openCreateModal}
              className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Dodaj użytkownika</span>
            </button>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-800">
              <thead className="bg-stone-50 text-stone-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-lg">Użytkownik</th>
                  <th className="py-2.5 px-3">Rola</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right rounded-r-lg">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-stone-50/50">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-stone-800 text-[11px] shrink-0"
                          style={{ backgroundColor: u.avatarBg || '#A4B3F6' }}
                        >
                          {(u.name || u.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-stone-900">
                            {u.name || u.email || 'Użytkownik'}
                          </p>
                          <p className="text-[10px] text-stone-400">
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-stone-100 text-stone-700">
                        {u.role}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-medium ${u.status === "active" ? "text-emerald-700" : "text-stone-400"}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${u.status === "active" ? "bg-emerald-500" : "bg-stone-400"}`}
                        />
                        {u.status === "active" ? "Aktywny" : "Zablokowany"}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(u)}
                          aria-label={`Edytuj użytkownika ${u.name}`}
                          className="p-1.5 min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg hover:bg-stone-100 text-stone-600 hover:text-stone-900 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          aria-label={`Usuń użytkownika ${u.name}`}
                          className="p-1.5 min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg hover:bg-rose-50 text-rose-600 hover:text-rose-800 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: IDEAS MODERATION */}
      {activeTab === "ideas" && (
        <div className="space-y-4">
          {/* Moderation Filter bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-black/5 shadow-2xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-stone-500 mr-1">Filtruj status:</span>
              {(
                [
                  { id: "all", label: `Wszystkie (${ideas.length})` },
                  { id: "pending", label: `Oczekujące (${pendingIdeasCount})` },
                  { id: "active", label: `Aktywne (${ideas.filter((i) => i.status === "active").length})` },
                  { id: "testing", label: `Testy (${ideas.filter((i) => i.status === "testing").length})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setIdeaStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    ideaStatusFilter === tab.id
                      ? tab.id === "pending" && pendingIdeasCount > 0
                        ? "bg-amber-600 text-white shadow-2xs"
                        : "bg-stone-900 text-white shadow-2xs"
                      : "bg-stone-100 hover:bg-stone-200 text-stone-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="text-xs text-stone-500">
              {pendingIdeasCount > 0 ? (
                <span className="inline-flex items-center gap-1.5 text-amber-700 font-semibold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                  <Clock className="w-3.5 h-3.5 animate-spin" />
                  Wymaga weryfikacji: {pendingIdeasCount} pomysłów
                </span>
              ) : (
                <span className="text-emerald-700 font-medium inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Wszystkie pomysły zweryfikowane
                </span>
              )}
            </div>
          </div>

          {/* Ideas List */}
          <div className="bg-white rounded-2xl border border-black/5 shadow-2xs overflow-hidden p-5 space-y-3">
            <div className="divide-y divide-stone-100">
              {ideas
                .filter((idea) => {
                  if (ideaStatusFilter === "all") return true;
                  if (ideaStatusFilter === "pending") return idea.status === "pending";
                  if (ideaStatusFilter === "active") return idea.status === "active";
                  if (ideaStatusFilter === "testing") return idea.status === "testing";
                  return true;
                })
                .map((idea) => {
                  const isPending = idea.status === "pending";

                  return (
                    <div
                      key={idea.id}
                      className={`py-4 px-3 sm:px-4 rounded-2xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        isPending
                          ? "bg-amber-50/60 border border-amber-200/80 my-2"
                          : "hover:bg-stone-50/60"
                      }`}
                    >
                      <div className="space-y-1.5 max-w-xl">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
                            {idea.category}
                          </span>
                          <span className="text-[11px] text-stone-500">
                            Autor: <strong>{idea.authorName}</strong>
                          </span>
                          <span className="text-[11px] text-stone-400">
                            {idea.createdAt}
                          </span>

                          {/* Status Pill */}
                          {isPending ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              <Clock className="w-3 h-3 text-amber-700" />
                              Oczekuje na akceptację
                            </span>
                          ) : idea.status === "active" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3" />
                              Aktywny (na feedzie)
                            </span>
                          ) : idea.status === "testing" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-100 text-sky-800">
                              <Users className="w-3 h-3" />
                              Testy społeczne ({idea.testersCount} testerów)
                            </span>
                          ) : idea.status === "rejected" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800">
                              <X className="w-3 h-3" />
                              Odrzucony
                            </span>
                          ) : null}
                        </div>

                        <h4 className="text-sm sm:text-base font-bold text-stone-900 flex items-center gap-2">
                          <span>{idea.title}</span>
                          <button
                            type="button"
                            onClick={() => router.push(`/discover/${idea.id}`)}
                            aria-label={`Zobacz podgląd pomysłu ${idea.title}`}
                            className="text-stone-500 hover:text-stone-900 p-1 min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg cursor-pointer transition-colors"
                            title="Zobacz podgląd pomysłu"
                          >
                            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </h4>

                        <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                          {idea.description}
                        </p>
                      </div>

                      {/* Moderation Controls */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {isPending && (
                          <>
                            <button
                              onClick={() => handleApproveIdea(idea.id, idea.title)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                              title="Zatwierdź pomysł i opublikuj na feedzie głównym"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Zaakceptuj i opublikuj</span>
                            </button>

                            <button
                              onClick={() => handleRejectIdea(idea.id, idea.title)}
                              className="inline-flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                              title="Odrzuć zgłoszenie"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Odrzuć</span>
                            </button>
                          </>
                        )}

                        <CustomSelect
                          value={idea.status}
                          onChange={(val) => updateIdeaStatus(idea.id, val as any)}
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
                          aria-label={`Usuń całkowicie pomysł ${idea.title}`}
                          className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center hover:bg-rose-50 text-rose-600 rounded-xl cursor-pointer transition-colors"
                          title="Usuń całkowicie"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  );
                })}

              {ideas.length === 0 && (
                <div className="py-12 text-center text-xs text-stone-500">
                  Brak pomysłów spełniających wybrane kryteria.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TESTER APPLICATIONS */}
      {activeTab === "testers" && (
        <div className="space-y-4">
          {/* Quick link banner to Tester module */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-amber-500/20 text-amber-300 rounded-lg">
                  <FlaskConical className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-bold text-white">
                  Tester Innowacji (Walidacja & Użyteczność)
                </h3>
              </div>
              <p className="text-xs text-stone-300 max-w-xl">
                Przejdź do pełnej sekcji testowania innowacji, weryfikacji prototypów w mikroskali, formularzy ocen WCAG oraz uwag testerów.
              </p>
            </div>
            <button
              onClick={() => router.push("/testing")}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-stone-900 hover:bg-stone-100 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-xs"
            >
              <FlaskConical className="w-4 h-4 text-amber-600" />
              <span>Otwórz sekcję Testera</span>
              <ExternalLink className="w-3.5 h-3.5 text-stone-500" />
            </button>
          </div>

          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-black/5 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block">
                Oczekujące na akceptację
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-stone-900">{pendingTesterAppsCount}</span>
                <span className="text-xs text-stone-400">zgłoszeń</span>
              </div>
              <p className="text-[11px] text-stone-500">
                Wymaga decyzji administratora przed przyznaniem roli testera
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-black/5 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
                Zatwierdzeni Testerzy
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-stone-900">{approvedTesterAppsCount}</span>
                <span className="text-xs text-stone-400">aktywnych</span>
              </div>
              <p className="text-[11px] text-stone-500">
                Mają dostęp do oceny użyteczności prototypów
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-black/5 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                Łącznie zgłoszeń
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-stone-900">{testerApps.length}</span>
                <span className="text-xs text-stone-400">wszystkich</span>
              </div>
              <p className="text-[11px] text-stone-500">
                Wszystkie aplikacje mieszkańców do pilotaży innowacji
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-black/5 shadow-2xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-stone-500 mr-1">Status wniosku:</span>
              {(
                [
                  { id: "all", label: `Wszystkie (${testerApps.length})` },
                  { id: "pending", label: `Oczekujące (${pendingTesterAppsCount})` },
                  { id: "approved", label: `Zaakceptowani (${approvedTesterAppsCount})` },
                  { id: "rejected", label: `Odrzuceni (${testerApps.filter((a) => a.status === "rejected").length})` },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setTesterAppFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    testerAppFilter === f.id
                      ? f.id === "pending" && pendingTesterAppsCount > 0
                        ? "bg-amber-600 text-white shadow-2xs"
                        : "bg-stone-900 text-white shadow-2xs"
                      : "bg-stone-100 hover:bg-stone-200 text-stone-700"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <button
              onClick={loadTesterApps}
              className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl cursor-pointer text-xs font-medium inline-flex items-center gap-1.5"
              title="Odśwież zgłoszenia"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTesterApps ? "animate-spin" : ""}`} />
              <span>Odśwież</span>
            </button>
          </div>

          {/* Tester Applications Table / Cards */}
          <div className="bg-white rounded-2xl border border-black/5 shadow-2xs overflow-hidden">
            {isLoadingTesterApps && testerApps.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-stone-500" />
                <span>Wczytywanie zgłoszeń testerów...</span>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {testerApps
                  .filter((app) => {
                    if (testerAppFilter === "all") return true;
                    return app.status === testerAppFilter;
                  })
                  .map((app) => {
                    const isAppPending = app.status === "pending";

                    return (
                      <div
                        key={app.id}
                        className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                          isAppPending ? "bg-amber-50/40" : "hover:bg-stone-50/60"
                        }`}
                      >
                        <div className="space-y-1.5 max-w-xl">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-stone-900">
                              {app.user_name}
                            </span>
                            {app.user_email && (
                              <span className="text-xs text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                                {app.user_email}
                              </span>
                            )}
                            <span className="text-[11px] text-stone-400">
                              {app.created_at ? app.created_at.split("T")[0] : ""}
                            </span>

                            {/* Status badge */}
                            {isAppPending ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                <Clock className="w-3 h-3 text-amber-700" />
                                Oczekuje na decyzję admina
                              </span>
                            ) : app.status === "approved" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                Zaakceptowany tester
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                <X className="w-3 h-3 text-rose-700" />
                                Odrzucony
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-stone-800 flex items-center gap-1.5 pt-0.5">
                            <span className="text-stone-400">Zgłoszenie do projektu:</span>
                            <button
                              onClick={() => router.push(`/discover/${app.idea_id}`)}
                              className="font-bold text-stone-900 hover:text-amber-700 underline underline-offset-2 flex items-center gap-1 cursor-pointer text-left"
                            >
                              <span>{app.idea_title}</span>
                              <ExternalLink className="w-3 h-3 text-stone-400" />
                            </button>
                          </div>

                          {app.motivation && (
                            <p className="text-xs text-stone-600 bg-white/80 p-2.5 rounded-xl border border-stone-200/80 leading-relaxed italic">
                              &ldquo;{app.motivation}&rdquo;
                            </p>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                          {isAppPending ? (
                            <>
                              <button
                                onClick={() =>
                                  handleApproveTester(app.id, app.user_name, app.idea_title)
                                }
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                                title="Zaakceptuj użytkownika jako testera"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>Zaakceptuj testera</span>
                              </button>

                              <button
                                onClick={() => handleRejectTester(app.id, app.user_name)}
                                className="inline-flex items-center gap-1 px-3 py-2 bg-stone-100 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                                title="Odrzuć aplikację"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Odrzuć</span>
                              </button>
                            </>
                          ) : app.status === "approved" ? (
                            <div className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Tester ma aktywny dostęp</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 text-xs text-rose-700 font-medium bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200">
                              <span>Wniosek odrzucony</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                {testerApps.length === 0 && (
                  <div className="py-12 text-center text-xs text-stone-500">
                    Brak zgłoszeń testerów w systemie.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-stone-200 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-stone-900">
              {editingUserId ? "Edytuj użytkownika" : "Nowy użytkownik"}
            </h3>

            <form onSubmit={handleSaveUser} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Imię i nazwisko
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:border-stone-900 focus:outline-none text-xs text-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:border-stone-900 focus:outline-none text-xs text-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Rola
                  </label>
                  <CustomSelect
                    value={formRole}
                    onChange={(val) => setFormRole(val as UserRole)}
                    options={[
                      { value: "creator", label: "Twórca" },
                      { value: "tester", label: "Tester" },
                      { value: "admin", label: "Administrator" },
                    ]}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Status
                  </label>
                  <CustomSelect
                    value={formStatus}
                    onChange={(val) => setFormStatus(val as any)}
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
                  className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
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
