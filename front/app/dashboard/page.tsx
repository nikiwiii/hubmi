"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { User, UserRole, TesterApplication } from "../lib/types";
import { getUsers, saveUsers } from "../lib/auth";
import { RefreshCw } from "lucide-react";
import { useApp } from "../context/AppContext";
import { fetchAllCalls } from "../lib/grantsApi";
import {
  fetchTesterApplications,
  updateTesterApplicationStatus,
} from "../lib/api";

import { DashboardHeader } from "../components/dashboard/DashboardHeader";
import {
  DashboardTabsNav,
  DashboardTab,
} from "../components/dashboard/DashboardTabsNav";
import { AdminCallsTab } from "../components/grants/AdminCallsTab";
import { DashboardIdeasTab } from "../components/dashboard/DashboardIdeasTab";
import { DashboardTestersTab } from "../components/dashboard/DashboardTestersTab";
import { DashboardUsersTab } from "../components/dashboard/DashboardUsersTab";
import { DashboardMyIdeasTab } from "../components/dashboard/DashboardMyIdeasTab";
import { UserEditModal } from "../components/dashboard/UserEditModal";

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
      : "calls",
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

  // Stan zgłoszeń testerów
  const [testerApps, setTesterApps] = useState<TesterApplication[]>([]);
  const [isLoadingTesterApps, setIsLoadingTesterApps] = useState(false);

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

  const handleUpdateIdeaStatus = async (
    ideaId: string,
    status: "active" | "pending" | "testing" | "rejected" | "archived",
  ) => {
    try {
      await updateIdeaStatus(ideaId, status);
      setAdminFeedback(`Zmieniono status pomysłu na: ${status}`);
    } catch (err: unknown) {
      setAdminFeedback(
        err instanceof Error ? err.message : "Błąd zmiany statusu pomysłu.",
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

  return (
    <div className="py-6 px-4 sm:px-6 max-w-6xl mx-auto space-y-5">
      {/* 1. Header profilu i szybkich akcji */}
      <DashboardHeader
        user={user}
        isLargeFont={isLargeFont}
        toggleFontSize={toggleFontSize}
        onNavigatePropose={() => navigate("propose")}
        onNavigateTesting={() => router.push("/testing")}
        onLogout={handleLogout}
        adminFeedback={adminFeedback}
        onDismissFeedback={() => setAdminFeedback("")}
      />

      {/* 2. Pasek zakładek */}
      <DashboardTabsNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        callsCount={callsCount}
        pendingIdeasCount={pendingIdeasCount}
        totalIdeasCount={ideas.length}
        pendingTesterAppsCount={pendingTesterAppsCount}
        totalTesterAppsCount={testerApps.length}
        usersCount={usersList.length}
        myIdeasCount={myCreatedIdeas.length + myTestingIdeas.length}
      />

      {/* 3. Zawartość zakładek */}
      <div>
        {/* TAB 1: NABORY I WNIOSKI */}
        <div className={activeTab === "calls" ? "block" : "hidden"}>
          <AdminCallsTab
            onFeedback={(msg) => setAdminFeedback(msg)}
            onCount={(count) => setCallsCount(count)}
          />
        </div>

        {/* TAB 2: MODERACJA POMYSŁÓW */}
        <div className={activeTab === "ideas" ? "block" : "hidden"}>
          <DashboardIdeasTab
            ideas={ideas}
            pendingIdeasCount={pendingIdeasCount}
            onApproveIdea={handleApproveIdea}
            onRejectIdea={handleRejectIdea}
            onUpdateIdeaStatus={handleUpdateIdeaStatus}
            onDeleteIdea={(ideaId, ideaTitle) => {
              if (
                confirm(
                  `Czy na pewno usunąć pomysł "${ideaTitle}"? Ta operacja jest nieodwracalna.`,
                )
              ) {
                deleteIdea(ideaId);
                setAdminFeedback(`Usunięto pomysł "${ideaTitle}".`);
              }
            }}
            onViewIdea={(ideaId) => {
              const idea = ideas.find((i) => i.id === ideaId);
              if (idea) selectIdea(idea);
            }}
          />
        </div>

        {/* TAB 3: ZGŁOSZENIA TESTERÓW */}
        <div className={activeTab === "testers" ? "block" : "hidden"}>
          <DashboardTestersTab
            testerApps={testerApps}
            isLoadingTesterApps={isLoadingTesterApps}
            pendingTesterAppsCount={pendingTesterAppsCount}
            approvedTesterAppsCount={approvedTesterAppsCount}
            onReload={loadTesterApps}
            onApproveTester={handleApproveTester}
            onRejectTester={handleRejectTester}
            onViewIdea={(ideaId) => {
              const idea = ideas.find((i) => i.id === ideaId);
              if (idea) selectIdea(idea);
            }}
          />
        </div>

        {/* TAB 4: UŻYTKOWNICY I UPRAWNIENIA */}
        <div className={activeTab === "users" ? "block" : "hidden"}>
          <DashboardUsersTab
            usersList={usersList}
            onOpenCreateModal={openCreateModal}
            onOpenEditModal={openEditModal}
            onDeleteUser={handleDeleteUser}
          />
        </div>

        {/* TAB 5: MOJE POMYSŁY & TESTY */}
        <div className={activeTab === "my-ideas" ? "block" : "hidden"}>
          <DashboardMyIdeasTab
            myCreatedIdeas={myCreatedIdeas}
            myTestingIdeas={myTestingIdeas}
            selectIdea={selectIdea}
            userEmail={user.email}
          />
        </div>
      </div>

      {/* Modal edycji / tworzenia użytkownika */}
      <UserEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingUserId={editingUserId}
        formName={formName}
        setFormName={setFormName}
        formEmail={formEmail}
        setFormEmail={setFormEmail}
        formRole={formRole}
        setFormRole={setFormRole}
        formStatus={formStatus}
        setFormStatus={setFormStatus}
        onSave={handleSaveUser}
      />
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
