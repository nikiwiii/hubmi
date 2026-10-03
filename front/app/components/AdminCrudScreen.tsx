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
  Search
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
  onUpdateIdeaStatus
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

  const handleElevateToAdmin = () => {
    const all = getUsers();
    const adminAccount = all.find(u => u.role === 'admin') || all[0];
    setCurrentUser(adminAccount);
    onUserChange(adminAccount);
    setAdminFeedback(`Zalogowano jako ${adminAccount.name}.`);
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
      setAdminFeedback(`Zaktualizowano: ${formName}`);
    } else {
      const newUser: User = {
        id: `user-${Date.now()}`,
        name: formName.trim(),
        email: formEmail.trim(),
        role: formRole,
        avatarBg: formRole === 'admin' ? '#EFE5C6' : formRole === 'tester' ? '#CAD7CE' : '#D2D8EE',
        createdAt: new Date().toISOString().split('T')[0],
        status: formStatus,
        bio: formBio.trim() || 'Nowy użytkownik.'
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
      const updated = usersList.filter(u => u.id !== id);
      setUsersList(updated);
      saveUsers(updated);
      setAdminFeedback(`Usunięto: ${name}`);
    }
  };

  if (!isAdmin) {
    return (
      <div className="py-16 px-4 max-w-md mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-6 h-6" />
        </div>

        <h1 className="text-xl font-bold text-stone-900">
          Wymagane uprawnienia administratora
        </h1>

        <div className="p-5 bg-white rounded-2xl border border-black/[0.05] shadow-2xs space-y-3">
          <p className="text-xs text-stone-600">
            Zalogowany: <strong>{currentUser?.name || 'Gość'}</strong>
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
    u =>
      u.name.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchUserQuery.toLowerCase())
  );

  return (
    <div className="py-6 px-4 sm:px-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
            Panel Zarządzania
          </h1>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-stone-200/50 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Użytkownicy ({usersList.length})
          </button>
          <button
            onClick={() => setActiveTab('ideas')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'ideas'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Pomysły ({ideas.length})
          </button>
        </div>
      </div>

      {adminFeedback && (
        <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{adminFeedback}</span>
          </div>
          <button onClick={() => setAdminFeedback('')} className="text-emerald-700 font-semibold text-xs">
            ✕
          </button>
        </div>
      )}

      {/* TAB 1: USERS CRUD */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-black/[0.05] shadow-2xs overflow-hidden p-5 space-y-4">
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
                          style={{ backgroundColor: u.avatarBg }}
                        >
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-stone-900">{u.name}</p>
                          <p className="text-[10px] text-stone-400">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-stone-100 text-stone-700">
                        {u.role}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${u.status === 'active' ? 'text-emerald-700' : 'text-stone-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-500' : 'bg-stone-400'}`} />
                        {u.status === 'active' ? 'Aktywny' : 'Zablokowany'}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-600"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
      {activeTab === 'ideas' && (
        <div className="bg-white rounded-2xl border border-black/[0.05] shadow-2xs overflow-hidden p-5 space-y-3">
          <div className="divide-y divide-stone-100">
            {ideas.map((idea) => (
              <div key={idea.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
                      {idea.category}
                    </span>
                    <span className="text-[11px] text-stone-400">{idea.authorName}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-stone-900">{idea.title}</h4>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={idea.status}
                    onChange={(e) => onUpdateIdeaStatus(idea.id, e.target.value as any)}
                    className="text-xs font-medium px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 focus:outline-none"
                  >
                    <option value="active">Aktywny</option>
                    <option value="testing">Testy</option>
                    <option value="archived">Archiwum</option>
                  </select>

                  <button
                    onClick={() => {
                      if (confirm(`Usunąć pomysł "${idea.title}"?`)) {
                        onDeleteIdea(idea.id);
                        setAdminFeedback(`Usunięto pomysł.`);
                      }
                    }}
                    className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-stone-200 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-stone-900">
              {editingUserId ? 'Edytuj użytkownika' : 'Nowy użytkownik'}
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
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="w-full px-2.5 py-2 rounded-xl border border-stone-200 focus:border-stone-900 focus:outline-none text-xs text-stone-900"
                  >
                    <option value="creator">Twórca</option>
                    <option value="tester">Tester</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-2.5 py-2 rounded-xl border border-stone-200 focus:border-stone-900 focus:outline-none text-xs text-stone-900"
                  >
                    <option value="active">Aktywny</option>
                    <option value="blocked">Zablokowany</option>
                  </select>
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
};
