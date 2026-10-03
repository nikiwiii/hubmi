import React, { useState } from 'react';
import { User, ScreenId } from '../lib/types';
import { computeSha256, getUsers, saveUsers, setCurrentUser } from '../lib/auth';
import { Lock, Mail, User as UserIcon, ArrowRight, CheckCircle2 } from 'lucide-react';

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
      setErrorMsg('Wprowadź e-mail oraz hasło.');
      return;
    }

    setIsSubmitting(true);
    const hash = await computeSha256(password);
    const users = getUsers();

    if (isRegister) {
      if (!name) {
        setErrorMsg('Wprowadź swoje imię.');
        setIsSubmitting(false);
        return;
      }

      const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        setErrorMsg('Konto z tym adresem już istnieje.');
        setIsSubmitting(false);
        return;
      }

      const newUser: User = {
        id: `user-${Date.now()}`,
        email: email.trim(),
        name: name.trim(),
        role: 'creator',
        avatarBg: '#D2D8EE',
        createdAt: new Date().toISOString().split('T')[0],
        status: 'active',
        bio: 'Nowy użytkownik.'
      };

      saveUsers([...users, newUser]);
      setCurrentUser(newUser);
      onUserChange(newUser);
      setSuccessMsg('Konto utworzone.');
      setTimeout(() => onNavigate('discover'), 800);
    } else {
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        setErrorMsg('Nie znaleziono konta. Skorzystaj z szybkiego wyboru profilu poniżej.');
        setIsSubmitting(false);
        return;
      }

      if (user.status === 'blocked') {
        setErrorMsg('Konto zablokowane.');
        setIsSubmitting(false);
        return;
      }

      setCurrentUser(user);
      onUserChange(user);
      setSuccessMsg(`Zalogowano: ${user.name}`);
      setTimeout(() => onNavigate('discover'), 600);
    }

    setIsSubmitting(false);
  };

  const handleQuickLogin = (demoEmail: string) => {
    const users = getUsers();
    const user = users.find(u => u.email === demoEmail);
    if (user) {
      setCurrentUser(user);
      onUserChange(user);
      setTimeout(() => onNavigate(user.role === 'admin' ? 'admin' : 'discover'), 400);
    }
  };

  return (
    <div className="max-w-md mx-auto py-10 px-4">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight">
          {isRegister ? 'Rejestracja' : 'Logowanie'}
        </h1>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-black/[0.05] shadow-2xs">
        {/* Toggle Login / Register */}
        <div className="flex bg-stone-100 p-1 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => { setIsRegister(false); setErrorMsg(''); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              !isRegister ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'
            }`}
          >
            Logowanie
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setErrorMsg(''); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              isRegister ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'
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

          {shaHashPreview && (
            <div className="p-2.5 bg-stone-50 rounded-xl text-[10px] font-mono text-stone-500 break-all border border-stone-200">
              SHA-256: {shaHashPreview.slice(0, 28)}...
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
          >
            <span>{isRegister ? 'Utwórz konto' : 'Zaloguj się'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Switcher */}
        <div className="mt-6 pt-5 border-t border-stone-100">
          <p className="text-[11px] font-semibold text-stone-400 text-center mb-2">
            Szybki profil testowy:
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickLogin('anna.kowalska@hubmi.pl')}
              className="p-2 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-center transition-colors cursor-pointer"
            >
              <span className="block text-xs font-semibold text-stone-800">Anna</span>
              <span className="text-[10px] text-stone-400">Twórca</span>
            </button>

            <button
              onClick={() => handleQuickLogin('admin@hubmi.pl')}
              className="p-2 rounded-xl bg-[#EFE5C6]/60 hover:bg-[#EFE5C6] border border-[#DFD3AE] text-center transition-colors cursor-pointer"
            >
              <span className="block text-xs font-semibold text-stone-800">Marek</span>
              <span className="text-[10px] text-stone-600">Admin</span>
            </button>

            <button
              onClick={() => handleQuickLogin('jan.wisniewski@hubmi.pl')}
              className="p-2 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-center transition-colors cursor-pointer"
            >
              <span className="block text-xs font-semibold text-stone-800">Jan</span>
              <span className="text-[10px] text-stone-400">Tester</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
