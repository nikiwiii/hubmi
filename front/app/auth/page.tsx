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
import { playAccessibilitySound } from "../lib/a11yAudio";

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
      playAccessibilitySound("error");
      return;
    }

    setIsSubmitting(true);

    if (isRegister) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        setErrorMsg("Wprowadź swoje imię.");
        playAccessibilitySound("error");
        setIsSubmitting(false);
        return;
      }

      if (password.length < 4) {
        setErrorMsg("Hasło musi mieć co najmniej 4 znaki!");
        playAccessibilitySound("error");
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
        playAccessibilitySound("success");
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
        playAccessibilitySound("error");
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
        playAccessibilitySound("success");
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
        playAccessibilitySound("error");
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="flex-1 min-h-screen flex flex-col items-center justify-center p-4 bg-[#F4F4F0]">
      {/* App Logo */}
      <div className="flex flex-col items-center justify-center mb-4 select-none text-center">
        <div className="w-11 h-11 rounded-xl overflow-hidden shadow-xs mb-2">
          <img
            src="/logo.svg"
            alt="Logo MiNNO – Małopolskie Innowacje Społeczne"
            className="w-full h-full object-cover"
          />
        </div>
        <span
          className="text-xl font-bold text-stone-900 tracking-tight font-ubuntu"
          style={{ fontFamily: "var(--font-ubuntu), 'Ubuntu', sans-serif" }}
        >
          MiNNO
        </span>
        <p className="text-[11px] text-stone-600 font-medium mt-0.5">
          Małopolskie Innowacje Społeczne &amp; ROPS Kraków
        </p>
      </div>

      <div className="w-full max-w-[380px] bg-white rounded-2xl p-6 border border-stone-200/90 shadow-sm flex flex-col gap-3">
        <div>
          {/* Przełącznik Logowanie / Rejestracja */}
          <div
            role="tablist"
            aria-label="Wybór trybu logowania lub rejestracji"
            className="flex bg-stone-100 p-1 rounded-xl mb-3 shrink-0"
          >
            <button
              type="button"
              role="tab"
              aria-selected={!isRegister}
              onClick={() => {
                setIsRegister(false);
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className={`flex-1 min-h-[36px] py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-stone-900 ${
                !isRegister
                  ? "bg-white text-stone-900 shadow-2xs font-bold"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Logowanie
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={isRegister}
              onClick={() => {
                setIsRegister(true);
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className={`flex-1 min-h-[36px] py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-stone-900 ${
                isRegister
                  ? "bg-white text-stone-900 shadow-2xs font-bold"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Nowe Konto
            </button>
          </div>

          {/* Komunikaty błędów i sukcesów - z WCAG aria-live i rolami */}
          {(errorMsg || successMsg) && (
            <div className="mb-2">
              {errorMsg && (
                <div
                  id="auth-error-msg"
                  role="alert"
                  aria-live="assertive"
                  className="p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs font-medium flex items-start gap-2 animate-in fade-in duration-150"
                >
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div
                  role="status"
                  aria-live="polite"
                  className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-medium flex items-center gap-2 animate-in fade-in duration-150"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
                  <span>{successMsg}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <form
          onSubmit={handleLoginOrRegister}
          noValidate
          className="flex flex-col gap-3"
        >
          {isRegister && (
            <div>
              <label
                htmlFor="auth-name"
                className="block text-xs font-semibold text-stone-800 mb-1"
              >
                Imię i nazwisko <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" aria-hidden="true" />
                <input
                  id="auth-name"
                  type="text"
                  autoComplete="name"
                  required
                  aria-required="true"
                  aria-invalid={!!errorMsg}
                  aria-describedby={errorMsg ? "auth-error-msg" : undefined}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="np. Anna Kowalska"
                  disabled={isSubmitting}
                  className="w-full min-h-[42px] pl-9.5 pr-3 py-2 rounded-xl border border-stone-300 focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10 focus:outline-none text-xs text-stone-900 placeholder:text-stone-500 disabled:opacity-50"
                />
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="auth-email"
              className="block text-xs font-semibold text-stone-800 mb-1"
            >
              Adres e-mail <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" aria-hidden="true" />
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                required
                aria-required="true"
                aria-invalid={!!errorMsg}
                aria-describedby={errorMsg ? "auth-error-msg" : undefined}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="twoj@email.pl"
                disabled={isSubmitting}
                className="w-full min-h-[42px] pl-9.5 pr-3 py-2 rounded-xl border border-stone-300 focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10 focus:outline-none text-xs text-stone-900 placeholder:text-stone-500 disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="auth-password"
              className="block text-xs font-semibold text-stone-800 mb-1"
            >
              Hasło <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" aria-hidden="true" />
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                autoComplete={isRegister ? "new-password" : "current-password"}
                required
                aria-required="true"
                aria-invalid={!!errorMsg}
                aria-describedby={errorMsg ? "auth-error-msg" : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Wpisz hasło"
                disabled={isSubmitting}
                className="w-full min-h-[42px] pl-9.5 pr-10 py-2 rounded-xl border border-stone-300 focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10 focus:outline-none text-xs text-stone-900 placeholder:text-stone-500 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={isSubmitting}
                className="min-w-[28px] min-h-[28px] absolute right-2 top-1/2 -translate-y-1/2 text-stone-600 hover:text-stone-900 transition-colors p-1.5 rounded-lg cursor-pointer focus-visible:ring-2 focus-visible:ring-stone-900"
                title={showPassword ? "Ukryj hasło" : "Pokaż hasło"}
                aria-label={showPassword ? "Ukryj wpisane hasło" : "Pokaż wpisane hasło"}
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Eye className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[44px] py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer mt-1 disabled:opacity-60 disabled:cursor-not-allowed shrink-0 shadow-2xs focus-visible:ring-2 focus-visible:ring-stone-900"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Trwa weryfikacja...</span>
              </>
            ) : (
              <>
                <span>{isRegister ? "Utwórz konto" : "Zaloguj się"}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
