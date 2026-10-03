import React, { useState } from 'react';
import { User, Idea, UserRole, ScreenId } from '../lib/types';
import { getUsers, saveUsers, setCurrentUser } from '../lib/auth';
import {
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Users,
  Lightbulb,
  KeyRound,
  RotateCcw
} from 'lucide-react';

interface AdminCrudScreenProps {
  currentUser: User | null;
  ideas: Idea[];
  onUserChange: (user: User | null) => void;
  onDeleteIdea: (id: string) => void;
  onUpdateIdeaStatus: (id: string, status: 'active' | 'testing' | 'archived') => void;
  onNavigate: (screen: ScreenId) => void;
}

export const AdminCrudScreen: React.FC<AdminCrudScreenProps> = ({
  currentUser,
  ideas,
  onUserChange,
  onDeleteIdea,
  onUpdateIdeaStatus,
  onNavigate
}) => {
  const [usersList, setUsersList] = useState<User[]>(getUsers());
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'ideas'>('users');

  // Modal / Form states for Create/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('creator');
  const [formStatus, setFormStatus] = useState<'active' | 'blocked'>('active');
  const [formBio, setFormBio] = useState('');
  const [adminFeedback, setAdminFeedback] = useState<string>('');

  const isAdmin = currentUser?.role === 'admin';

  // Quick switch to admin account for non-admin testers
  const handleElevateToAdmin = () => {
    const all = getUsers();
    const adminAccount = all.find(u => u.role === 'admin') || all[0];
    setCurrentUser(adminAccount);
    onUserChange(adminAccount);
    setAdminFeedback(`Zalogowano z uprawnieniami administratora (${adminAccount.name}).`);
  };

  const openCreateModal = () => {
    setEditingUserId(null);
    setFormName('');
    setFormEmail('');
    setFormRole('creator');
    setFormStatus('active');
    setFormBio('');
    setIsModalOpen(true);
  };

  const openEditModal = (u: User) => {
    setEditingUserId(u.id);
    setFormName(u.name);
    setFormEmail(u.email);
    setFormRole(u.role);
    setFormStatus(u.status);
    setFormBio(u.bio || '');
    setIsModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) return;

    if (editingUserId) {
      // UPDATE
      const updated = usersList.map(u => {
        if (u.id !== editingUserId) return u;
        return {
          ...u,
          name: formName.trim(),
          email: formEmail.trim(),
          role: formRole,
          status: formStatus,
          bio: formBio.trim()
        };
      });
      setUsersList(updated);
      saveUsers(updated);
      setAdminFeedback(`Zaktualizowano dane użytkownika: ${formName}`);
    } else {
      // CREATE
      const newUser: User = {
        id: `user-${Date.now()}`,
        name: formName.trim(),
        email: formEmail.trim(),
        role: formRole,
        avatarBg: formRole === 'admin' ? '#F5E85A' : formRole === 'tester' ? '#98C5AE' : '#A4B3F6',
        createdAt: new Date().toISOString().split('T')[0],
        status: formStatus,
        bio: formBio.trim() || 'Użytkownik dodany ręcznie przez administratora.'
      };
      const updated = [newUser, ...usersList];
      setUsersList(updated);
      saveUsers(updated);
      setAdminFeedback(`Pomyślnie utworzono nowego użytkownika: ${newUser.name}`);
    }

    setIsModalOpen(false);
  };

  const handleDeleteUser = (id: string, name: string) => {
    if (confirm(`Czy na pewno usunąć użytkownika "${name}" z bazy danych?`)) {
      const updated = usersList.filter(u => u.id !== id);
      setUsersList(updated);
      saveUsers(updated);
      setAdminFeedback(`Usunięto użytkownika ${name}.`);
    }
  };

  // If user lacks admin privilege
  if (!isAdmin) {
    return (
      <div className="py-16 px-4 max-w-2xl mx-auto text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-amber-100 text-amber-700 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-10 h-10" />
        </div>

        <h1 className="text-3xl font-black text-stone-900">
          Wymagane Uprawnienia Administratora
        </h1>

        <p className="text-stone-600 text-lg">
          Ten panel (CRUD) jest dostępny wyłącznie dla użytkowników z flagą uprawnień administratora w bazie danych (FastAPI).
        </p>

        <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-md space-y-4">
          <p className="text-sm font-semibold text-stone-700">
            Obecnie jesteś zalogowany jako: <strong>{currentUser?.name || 'Gość'}</strong> ({currentUser?.role || 'brak'})
          </p>

          <button
            onClick={handleElevateToAdmin}
            className="w-full py-4 px-6 bg-stone-900 hover:bg-stone-800 text-white rounded-2xl text-base font-bold shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-5 h-5 text-[#F5E85A]" />
            <span>Przełącz na konto Administratora (Marek Nowak)</span>
          </button>
        </div>
      </div>
    );
  }

  const filteredUsers = usersList.filter(
    u =>
      u.name.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchUserQuery.toLowerCase())
  );

  return (
    <div className="py-6 px-4 sm:px-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-stone-900 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#F5E85A]" />
              Panel Administratora (CRUD)
            </span>
            <span className="text-xs text-stone-500 font-semibold">Baza FastAPI Mock</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight mt-1">
            Zarządzanie Użytkownikami i Treściami
          </h1>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-stone-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-white text-stone-900 shadow-md'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Użytkownicy ({usersList.length})
          </button>
          <button
            onClick={() => setActiveTab('ideas')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'ideas'
                ? 'bg-white text-stone-900 shadow-md'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Moderacja Pomysłów ({ideas.length})
          </button>
        </div>
      </div>

      {adminFeedback && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{adminFeedback}</span>
          </div>
          <button onClick={() => setAdminFeedback('')} className="text-emerald-700 font-bold text-xs">
            Zamknij
          </button>
        </div>
      )}

      {/* TAB 1: USERS CRUD */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-[32px] border border-stone-200 shadow-xl overflow-hidden p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input
                type="text"
                value={searchUserQuery}
                onChange={(e) => setSearchUserQuery(e.target.value)}
                placeholder="Szukaj po nazwisku, e-mailu lub roli..."
                className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-stone-200 focus:border-stone-900 focus:outline-none text-sm font-medium text-stone-900"
              />
            </div>

            {/* Create User Button */}
            <button
              onClick={openCreateModal}
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-stone-900 hover:bg-stone-800 text-white rounded-2xl text-sm font-bold shadow-md transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-[#F5E85A]" />
              <span>Dodaj Użytkownika</span>
            </button>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-stone-800">
              <thead className="bg-stone-100 text-stone-500 font-bold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 rounded-l-xl">Użytkownik</th>
                  <th className="py-3.5 px-4">Rola</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Data rejestracji</th>
                  <th className="py-3.5 px-4 text-right rounded-r-xl">Akcje (CRUD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-stone-50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-stone-900 shrink-0"
                          style={{ backgroundColor: u.avatarBg }}
                        >
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-stone-900">{u.name}</p>
                          <p className="text-xs text-stone-500">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          u.role === 'admin'
                            ? 'bg-yellow-100 text-yellow-900 border border-yellow-300'
                            : u.role === 'tester'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          u.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            u.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        {u.status === 'active' ? 'Aktywny' : 'Zablokowany'}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-xs font-medium text-stone-600">
                      {u.createdAt}
                    </td>

                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(u)}
                          title="Edytuj użytkownika"
                          className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          title="Usuń użytkownika"
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* TAB 2: IDEAS MODERATION CRUD */}
      {activeTab === 'ideas' && (
        <div className="bg-white rounded-[32px] border border-stone-200 shadow-xl overflow-hidden p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-stone-900">
              Moderacja Wszystkich Pomysłów w Bazie ({ideas.length})
            </h3>
            <span className="text-xs text-stone-500 font-semibold">
              Możliwość zmiany statusu i usuwania
            </span>
          </div>

          <div className="divide-y divide-stone-100">
            {ideas.map((idea) => (
              <div key={idea.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-800">
                      {idea.category}
                    </span>
                    <span className="text-xs text-stone-400">Autor: {idea.authorName}</span>
                  </div>
                  <h4 className="text-base font-bold text-stone-900">{idea.title}</h4>
                  <p className="text-xs text-stone-500">{idea.subtitle}</p>
                  <div className="flex items-center gap-4 text-xs font-medium text-stone-600 pt-1">
                    <span>Głosy: <strong>+{idea.likes} / -{idea.dislikes}</strong></span>
                    <span>Testerzy: <strong>{idea.testersCount}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto">
                  <select
                    value={idea.status}
                    onChange={(e) => onUpdateIdeaStatus(idea.id, e.target.value as any)}
                    className="text-xs font-bold px-3 py-2 bg-stone-100 border border-stone-200 rounded-xl text-stone-800 focus:outline-none"
                  >
                    <option value="active">Aktywny</option>
                    <option value="testing">W trakcie testów</option>
                    <option value="archived">Zarchiwizowany</option>
                  </select>

                  <button
                    onClick={() => {
                      if (confirm(`Usunąć pomysł "${idea.title}"?`)) {
                        onDeleteIdea(idea.id);
                        setAdminFeedback(`Usunięto pomysł "${idea.title}".`);
                      }
                    }}
                    className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl transition-colors"
                    title="Usuń pomysł"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATE / EDIT USER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-6 sm:p-8 max-w-lg w-full border border-stone-200 shadow-2xl space-y-5 animate-in fade-in">
            <h3 className="text-2xl font-black text-stone-900">
              {editingUserId ? 'Edytuj Użytkownika' : 'Utwórz Nowego Użytkownika'}
            </h3>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                  Imię i Nazwisko
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-stone-200 focus:border-stone-900 focus:outline-none text-base text-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                  Adres E-mail
                </label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-stone-200 focus:border-stone-900 focus:outline-none text-base text-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                    Rola
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="w-full px-3 py-3 rounded-2xl border-2 border-stone-200 focus:border-stone-900 focus:outline-none text-sm font-bold text-stone-900"
                  >
                    <option value="creator">Twórca (creator)</option>
                    <option value="tester">Tester (tester)</option>
                    <option value="admin">Administrator (admin)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-3 rounded-2xl border-2 border-stone-200 focus:border-stone-900 focus:outline-none text-sm font-bold text-stone-900"
                  >
                    <option value="active">Aktywny</option>
                    <option value="blocked">Zablokowany</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                  Krótki opis / Bio
                </label>
                <textarea
                  rows={2}
                  value={formBio}
                  onChange={(e) => setFormBio(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-stone-200 focus:border-stone-900 focus:outline-none text-sm text-stone-900"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-2xl font-bold transition-colors cursor-pointer"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-stone-900 hover:bg-stone-800 text-white rounded-2xl font-bold shadow-lg transition-colors cursor-pointer"
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
};
