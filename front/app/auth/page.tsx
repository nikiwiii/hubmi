"use client";

import React, { useState } from "react";
import { User } from "../lib/types";
import {
  computeSha256,
  getUsers,
  saveUsers,
  setCurrentUser,
} from "../lib/auth";
import { loginUser, loginAdmin, registerUser } from "../lib/api";
import {
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { useApp } from "../context/AppContext";

export default function AuthPage() {
  const { setCurrentUser: onUserChange, navigate } = useApp();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [shaHashPreview, setShaHashPreview] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePasswordChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const val = e.target.value;
    setPassword(val);
    if (val) {
      const hash = await computeSha256(val);
      setShaHashPreview(hash);
    } else {
      setShaHashPreview("");
    }
  };

  const handleLoginOrRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!email || !password) {
      setErrorMsg("Wprowadź e-mail oraz hasło.");
      return;
    }

    setIsSubmitting(true);
    await computeSha256(password);
    const users = getUsers();

    if (isRegister) {
      if (!name) {
        setErrorMsg("Wprowadź swoje imię.");
        setIsSubmitting(false);
        return;
      }

      // Try Backend Registration
      try {
        const isAdminEmail = email.toLowerCase().includes("admin");
        const user = await registerUser(
          email,
          password,
          name,
          isAdminEmail ? "admin" : "user",
        );
        setCurrentUser(user);
        onUserChange(user);
        setSuccessMsg(`Konto utworzone w bazie i zalogowano (${user.name})!`);
        setTimeout(() => navigate("discover"), 800);
        return;
      } catch (backendErr: any) {
        console.warn(
          "Backend register error, trying local fallback:",
          backendErr,
        );
        // Local fallback
        const existing = users.find(
          (u) => u.email.toLowerCase() === email.toLowerCase(),
        );
        if (existing) {
          setErrorMsg(
            backendErr?.message || "Konto z tym adresem już istnieje.",
          );
          setIsSubmitting(false);
          return;
        }

        const newUser: User = {
          id: `user-${Date.now()}`,
          email: email.trim(),
          name: name.trim(),
          role: email.toLowerCase().includes("admin") ? "admin" : "creator",
          avatarBg: "#D2D8EE",
          createdAt: new Date().toISOString().split("T")[0],
          status: "active",
          bio: "Nowy użytkownik.",
        };

        saveUsers([...users, newUser]);
        setCurrentUser(newUser);
        onUserChange(newUser);
        setSuccessMsg("Konto utworzone.");
        setTimeout(() => navigate("discover"), 800);
      }
    } else {
      // Try Backend Login
      try {
        const isAdmin = email.toLowerCase().includes("admin");
        const loggedUser = isAdmin
          ? await loginAdmin(email, password)
          : await loginUser(email, password);

        setCurrentUser(loggedUser);
        onUserChange(loggedUser);
        setSuccessMsg(`Zalogowano pomyślnie: ${loggedUser.name}`);
        setTimeout(() => navigate("discover"), 600);
        return;
      } catch (backendErr: any) {
        console.warn("Backend login error, trying local fallback:", backendErr);
        // Fallback to local accounts
        const user = users.find(
          (u) => u.email.toLowerCase() === email.toLowerCase(),
        );
        if (!user) {
          setErrorMsg(backendErr?.message || "Niepoprawne dane logowania.");
          setIsSubmitting(false);
          return;
        }

        if (user.status === "blocked") {
          setErrorMsg("Konto zablokowane.");
          setIsSubmitting(false);
          return;
        }

        setCurrentUser(user);
        onUserChange(user);
        setSuccessMsg(`Zalogowano: ${user.name}`);
        setTimeout(() => navigate("discover"), 600);
      }
    }

    setIsSubmitting(false);
  };

  return (
    <div className="max-w-md mx-auto py-10 px-4">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight">
          {isRegister ? "Rejestracja" : "Logowanie"}
        </h1>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-black/5 shadow-2xs">
        {/* Toggle Login / Register */}
        <div className="flex bg-stone-100 p-1 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setErrorMsg("");
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              !isRegister
                ? "bg-white text-stone-900 shadow-2xs"
                : "text-stone-500"
            }`}
          >
            Logowanie
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setErrorMsg("");
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              isRegister
                ? "bg-white text-stone-900 shadow-2xs"
                : "text-stone-500"
            }`}
          >
            Nowe Konto
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 text-rose-700 rounded-xl text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleLoginOrRegister} className="space-y-3.5">
          {isRegister && (
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Imię
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="np. Anna"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-stone-200 focus:border-stone-900 focus:outline-none text-sm text-stone-900"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="twoj@email.pl"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-stone-200 focus:border-stone-900 focus:outline-none text-sm text-stone-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              Hasło
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="Hasło"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-stone-200 focus:border-stone-900 focus:outline-none text-sm text-stone-900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
          >
            <span>{isRegister ? "Utwórz konto" : "Zaloguj się"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
