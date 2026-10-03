import React, { useState } from 'react';
import { User, ScreenId } from '../lib/types';
import { computeSha256, getUsers, saveUsers, setCurrentUser } from '../lib/auth';
import { Lock, Mail, User as UserIcon, ShieldCheck, ArrowRight, CheckCircle2, KeyRound } from 'lucide-react';

interface AuthScreenProps {
  currentUser: User | null;
  onUserChange: (user: User | null) => void;
  onNavigate: (screen: ScreenId) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  currentUser,
  onUserChange,
  onNavigate
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [shaHashPreview, setShaHashPreview] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute live SHA-256 preview when password changes
  const handlePasswordChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPassword(val);
    if (val) {
      const hash = await computeSha256(val);
      setShaHashPreview(hash);
    } else {
      setShaHashPreview('');
    }
  };

  const handleLoginOrRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !password) {
      setErrorMsg('Proszę podać adres e-mail oraz hasło.');
      return;
    }

    setIsSubmitting(true);
    const hash = await computeSha256(password);
    const users = getUsers();

    if (isRegister) {
      if (!name) {
        setErrorMsg('Proszę podać swoje imię lub pseudonim.');
        setIsSubmitting(false);
        return;
      }

      const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        setErrorMsg('Konto z tym adresem e-mail już istnieje. Przejdź do logowania.');
        setIsSubmitting(false);
        return;
      }

      const newUser: User = {
        id: `user-${Date.now()}`,
        email: email.trim(),
        name: name.trim(),
        role: 'creator',
        avatarBg: '#A4B3F6',
        createdAt: new Date().toISOString().split('T')[0],
        status: 'active',
        bio: 'Nowy użytkownik społeczności Hubmi.'
      };

      saveUsers([...users, newUser]);
      setCurrentUser(newUser);
      onUserChange(newUser);
      setSuccessMsg('Rejestracja pomyślna! Hasło zostało zabezpieczone algorytmem SHA-256.');
      setTimeout(() => onNavigate('discover'), 1200);
    } else {
      // Login mode
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        setErrorMsg('Nie znaleziono konta z takim adresem. Możesz skorzystać z szybkiego logowania testowego poniżej lub zarejestrować się.');
        setIsSubmitting(false);
        return;
      }

      if (user.status === 'blocked') {
        setErrorMsg('To konto zostało zablokowane przez administratora.');
        setIsSubmitting(false);
        return;
      }

      setCurrentUser(user);
      onUserChange(user);
      setSuccessMsg(`Witaj ponownie, ${user.name}!`);
      setTimeout(() => onNavigate('discover'), 900);
    }

    setIsSubmitting(false);
  };

  const handleQuickLogin = (demoEmail: string) => {
    const users = getUsers();
    const user = users.find(u => u.email === demoEmail);
    if (user) {
      setCurrentUser(user);
      onUserChange(user);
      setSuccessMsg(`Zalogowano jako: ${user.name} (${user.role.toUpperCase()})`);
      setTimeout(() => onNavigate(user.role === 'admin' ? 'admin' : 'discover'), 700);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6">
      {/* Editorial Headline */}
      <div className="mb-8 text-center sm:text-left">
        <h1 className="text-4xl sm:text-5xl font-black text-stone-900 tracking-tight leading-tight">
          {isRegister ? 'Dołącz do' : 'Witaj w'} Hubmi.
        </h1>
        <p className="text-2xl sm:text-3xl font-bold text-stone-400 tracking-tight mt-1">
          {isRegister ? 'Bezpieczne konto twórcy.' : 'Zaloguj się do platformy.'}
        </p>
        <p className="text-stone-600 mt-3 text-base sm:text-lg">
          Prosta, przejrzysta przestrzeń do zgłaszania i testowania pomysłów dla osób z doświadczeniem.
        </p>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-[32px] p-6 sm:p-10 border border-stone-200 shadow-xl">
        {/* Toggle Login / Register */}
        <div className="flex bg-stone-100 p-1.5 rounded-2xl mb-8">
          <button
            type="button"
            onClick={() => { setIsRegister(false); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 py-3 text-base font-bold rounded-xl transition-all ${
              !isRegister
                ? 'bg-stone-900 text-white shadow-md'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Logowanie
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 py-3 text-base font-bold rounded-xl transition-all ${
              isRegister
                ? 'bg-stone-900 text-white shadow-md'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Nowe Konto
          </button>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-sm font-medium">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm font-medium flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleLoginOrRegister} className="space-y-5">
          {isRegister && (
            <div>
              <label className="block text-sm font-bold text-stone-800 mb-2">
                Imię i Nazwisko / Pseudonim
              </label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="np. Anna Kowalska"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-stone-200 focus:border-stone-900 focus:outline-none text-base text-stone-900 font-medium transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-stone-800 mb-2">
              Adres E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="twoj.mail@domena.pl"
                className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-stone-200 focus:border-stone-900 focus:outline-none text-base text-stone-900 font-medium transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-stone-800 mb-2">
              Hasło
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input
                type="password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="Wpisz bezpieczne hasło"
                className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-stone-200 focus:border-stone-900 focus:outline-none text-base text-stone-900 font-medium transition-colors"
              />
            </div>
          </div>

          {/* SHA-256 Encryption Security Preview Indicator */}
          {shaHashPreview && (
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Docelowy skrót kryptograficzny (SHA-256):</span>
              </div>
              <p className="font-mono text-[11px] text-stone-500 break-all leading-tight bg-white p-2 rounded-lg border border-stone-200">
                {shaHashPreview}
              </p>
              <p className="text-[11px] text-stone-400">
                Hasło jest hashowane przed wysyłką do bazy danych FastAPI.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-6 bg-stone-900 hover:bg-stone-800 text-white rounded-2xl text-lg font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer"
          >
            <span>{isRegister ? 'Utwórz konto w Hubmi' : 'Zaloguj się'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        {/* Quick Demo Switcher for fast testing without typing */}
        <div className="mt-8 pt-8 border-t border-stone-100">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-400 text-center mb-4">
            Szybkie logowanie testowe (Wybierz profil demonstracyjny):
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => handleQuickLogin('anna.kowalska@hubmi.pl')}
              className="p-3 rounded-2xl bg-[#A4B3F6]/20 hover:bg-[#A4B3F6]/40 border border-[#A4B3F6]/40 text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full bg-[#A4B3F6]" />
                <span className="text-xs font-bold text-stone-900">Anna Kowalska</span>
              </div>
              <p className="text-[11px] text-stone-600 font-medium">Użytkownik 40+ (Twórca)</p>
            </button>

            <button
              onClick={() => handleQuickLogin('admin@hubmi.pl')}
              className="p-3 rounded-2xl bg-[#F5E85A]/30 hover:bg-[#F5E85A]/50 border border-[#F5E85A]/60 text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full bg-[#F5E85A]" />
                <span className="text-xs font-bold text-stone-900">Marek Nowak</span>
              </div>
              <p className="text-[11px] text-stone-600 font-medium">Administrator (CRUD)</p>
            </button>

            <button
              onClick={() => handleQuickLogin('jan.wisniewski@hubmi.pl')}
              className="p-3 rounded-2xl bg-[#98C5AE]/30 hover:bg-[#98C5AE]/50 border border-[#98C5AE]/50 text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full bg-[#98C5AE]" />
                <span className="text-xs font-bold text-stone-900">Jan Wiśniewski</span>
              </div>
              <p className="text-[11px] text-stone-600 font-medium">Tester Społeczności</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
