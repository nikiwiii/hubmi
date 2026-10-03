"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User } from "../lib/types";
import { setCurrentUser } from "../lib/auth";
import { loginUser, loginAdmin, registerUser } from "../lib/api";
import {
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { useApp } from "../context/AppContext";

export default function AuthPage() {
  const router = useRouter();
  const { currentUser, setCurrentUser: onUserChange } = useApp();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [redirectPath, setRedirectPath] = useState("/");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const redir = params.get("redirect");
      if (redir && redir.startsWith("/")) {
        setRedirectPath(redir);
      }
    }
  }, []);

  // Jeśli użytkownik jest już zalogowany, automatycznie przekieruj
  useEffect(() => {
    if (currentUser) {
      router.replace(redirectPath);
    }
  }, [currentUser, redirectPath, router]);

  const handleLoginOrRegister = async (
    e: React.SyntheticEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMsg("Wprowadź e-mail oraz hasło.");
      return;
    }

    setIsSubmitting(true);

    if (isRegister) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        setErrorMsg("Wprowadź swoje imię.");
        setIsSubmitting(false);
        return;
      }

      if (password.length < 4) {
        setErrorMsg("Hasło musi mieć co najmniej 4 znaki!");
        setIsSubmitting(false);
        return;
      }

      try {
        const isAdminEmail = trimmedEmail.toLowerCase().includes("admin");
        const user = await registerUser(
          trimmedEmail,
          password,
          trimmedName,
          isAdminEmail ? "admin" : "user",
        );
        setCurrentUser(user);
        onUserChange(user);
        setSuccessMsg(`Konto utworzone pomyślnie. Witaj, ${user.name}!`);
        setTimeout(() => {
          router.replace(redirectPath);
        }, 500);
      } catch (backendErr: unknown) {
        const err = backendErr as { message?: string };
        let msg = err?.message || "Wystąpił błąd podczas rejestracji konta.";
        if (
          typeof msg !== "string" ||
          msg.includes("[object Object]") ||
          msg.includes("object Object")
        ) {
          msg = "Wystąpił błąd podczas rejestracji konta.";
        }
        setErrorMsg(msg);
        setIsSubmitting(false);
      }
    } else {
      try {
        const isAdminHint = trimmedEmail.toLowerCase().includes("admin");
        let loggedUser: User;

        if (isAdminHint) {
          try {
            loggedUser = await loginAdmin(trimmedEmail, password);
          } catch (adminErr: unknown) {
            // Jeśli logowanie admina zwróciło brak uprawnień lub błąd specyficzny dla admina, spróbuj standardowego
            const aErr = adminErr as { message?: string };
            if (
              aErr?.message?.includes("uprawnień") ||
              aErr?.message?.includes("Dostęp zabroniony")
            ) {
              loggedUser = await loginUser(trimmedEmail, password);
            } else {
              throw adminErr;
            }
          }
        } else {
          loggedUser = await loginUser(trimmedEmail, password);
        }

        setCurrentUser(loggedUser);
        onUserChange(loggedUser);
        setSuccessMsg(`Zalogowano pomyślnie: ${loggedUser.name}`);
        setTimeout(() => {
          router.replace(redirectPath);
        }, 500);
      } catch (backendErr: unknown) {
        const err = backendErr as { message?: string };
        let msg = err?.message || "Niepoprawne dane logowania.";
        if (
          typeof msg !== "string" ||
          msg.includes("[object Object]") ||
          msg.includes("object Object")
        ) {
          msg = "Niepoprawne dane logowania.";
        }
        setErrorMsg(msg);
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex-1 flex flex-col items-center justify-center p-4 sm:p-6 bg-[#F4F4F0]">
      {/* App Logo */}
      <div className="flex flex-col items-center justify-center mb-8 select-none text-center">
        <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-sm mb-3">
          <img
            src="/logo.svg"
            alt="minno logo"
            className="w-full h-full object-cover"
          />
        </div>
        <span
          className="text-2xl font-bold text-stone-900 tracking-tight font-ubuntu"
          style={{ fontFamily: "var(--font-ubuntu), 'Ubuntu', sans-serif" }}
        >
          minno
        </span>
        <p className="text-xs text-stone-500 font-medium mt-1">
          Małopolskie Innowacje Społeczne &amp; ROPS Kraków
        </p>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-black/5 shadow-2xs flex flex-col gap-4">
        <div>
          {/* Przełącznik Logowanie / Rejestracja */}
          <div className="flex bg-stone-100 p-1 rounded-xl mb-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                !isRegister
                  ? "bg-white text-stone-900 shadow-2xs"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              Logowanie
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                isRegister
                  ? "bg-white text-stone-900 shadow-2xs"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              Nowe Konto
            </button>
          </div>

          {/* Komunikaty błędów i sukcesów */}
          <div className="min-h-5 mb-1 flex flex-col justify-center">
            {errorMsg && (
              <div className="p-2.5 bg-rose-50 border border-rose-200/60 text-rose-700 rounded-xl text-xs font-medium flex items-start gap-2 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200/60 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2 animate-in fade-in duration-150">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}
          </div>
        </div>

        <form
          onSubmit={handleLoginOrRegister}
          className="flex flex-col gap-3.5"
        >
          {isRegister && (
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Imię i nazwisko
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Anna Kowalska"
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-stone-200 focus:border-stone-900 focus:outline-none text-sm text-stone-900 disabled:opacity-50"
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
                disabled={isSubmitting}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-stone-200 focus:border-stone-900 focus:outline-none text-sm text-stone-900 disabled:opacity-50"
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
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Hasło"
                disabled={isSubmitting}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-stone-200 focus:border-stone-900 focus:outline-none text-sm text-stone-900 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={isSubmitting}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition-colors p-1 rounded-lg cursor-pointer"
                title={showPassword ? "Ukryj hasło" : "Pokaż hasło"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2 disabled:opacity-60 disabled:cursor-not-allowed shrink-0 shadow-2xs"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Trwa weryfikacja...</span>
              </>
            ) : (
              <>
                <span>{isRegister ? "Utwórz konto" : "Zaloguj się"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
