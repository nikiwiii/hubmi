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
    <div className="flex-1 min-h-screen flex flex-col items-center justify-center p-4 bg-[#F4F4F0]">
      {/* App Logo */}
      <div className="flex flex-col items-center justify-center mb-4 select-none text-center">
        <div className="w-11 h-11 rounded-xl overflow-hidden shadow-xs mb-2">
          <img
            src="/logo.svg"
            alt="Logo platformy MiNNO Małopolskie Innowacje"
            className="w-full h-full object-cover"
          />
        </div>
        <span
          className="text-xl font-bold text-stone-900 tracking-tight font-ubuntu"
          style={{ fontFamily: "var(--font-ubuntu), 'Ubuntu', sans-serif" }}
        >
          MiNNO
        </span>
        <p className="text-[11px] text-stone-600 font-semibold mt-0.5">
          Małopolskie Innowacje Społeczne &amp; ROPS Kraków
        </p>
      </div>

      <div className="w-full max-w-[360px] bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs flex flex-col gap-3">
        <div>
          {/* Przełącznik Logowanie / Rejestracja */}
          <div
            role="tablist"
            aria-label="Wybór trybu logowania lub rejestracji"
            className="flex bg-stone-100 p-1 rounded-xl mb-2.5 shrink-0 gap-1"
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
              className={`flex-1 min-h-[36px] py-1.5 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
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
              className={`flex-1 min-h-[36px] py-1.5 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                isRegister
                  ? "bg-white text-stone-900 shadow-2xs font-bold"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Nowe Konto
            </button>
          </div>

          {/* Komunikaty błędów i sukcesów - tylko gdy istnieją */}
          {(errorMsg || successMsg) && (
            <div className="mb-2">
              {errorMsg && (
                <div className="p-2 bg-rose-50 border border-rose-200/60 text-rose-700 rounded-lg text-xs font-medium flex items-start gap-2 animate-in fade-in duration-150">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-2 bg-emerald-50 border border-emerald-200/60 text-emerald-800 rounded-lg text-xs font-medium flex items-center gap-2 animate-in fade-in duration-150">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <form
          onSubmit={handleLoginOrRegister}
          className="flex flex-col gap-3"
        >
          {isRegister && (
            <div>
              <label htmlFor="auth-name" className="block text-xs font-bold text-stone-700 mb-1">
                Imię i nazwisko
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" aria-hidden="true" />
                <input
                  id="auth-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Anna Kowalska"
                  disabled={isSubmitting}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 focus:border-stone-900 focus:outline-none text-xs text-stone-900 disabled:opacity-50"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="block text-xs font-bold text-stone-700 mb-1">
              Adres e-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" aria-hidden="true" />
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="twoj@email.pl"
                disabled={isSubmitting}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 focus:border-stone-900 focus:outline-none text-xs text-stone-900 disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label htmlFor="auth-password" className="block text-xs font-bold text-stone-700 mb-1">
              Hasło
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" aria-hidden="true" />
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Hasło"
                disabled={isSubmitting}
                className="w-full pl-9 pr-10 py-2 rounded-xl border border-stone-200 focus:border-stone-900 focus:outline-none text-xs text-stone-900 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={isSubmitting}
                aria-label={showPassword ? "Ukryj hasło" : "Pokaż hasło w postaci tekstu"}
                aria-pressed={showPassword}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 min-h-[32px] min-w-[32px] flex items-center justify-center text-stone-500 hover:text-stone-900 transition-colors p-1 rounded-lg cursor-pointer"
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
            className="w-full min-h-[40px] py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1 disabled:opacity-60 disabled:cursor-not-allowed shrink-0 shadow-2xs"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                <span>Trwa weryfikacja...</span>
              </>
            ) : (
              <>
                <span>{isRegister ? "Utwórz konto" : "Zaloguj się"}</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
