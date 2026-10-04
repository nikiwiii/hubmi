import React from "react";
import { UserRole } from "../../lib/types";
import { CustomSelect } from "../shared/CustomSelect";

interface UserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingUserId: string | null;
  formName: string;
  setFormName: (val: string) => void;
  formEmail: string;
  setFormEmail: (val: string) => void;
  formRole: UserRole;
  setFormRole: (val: UserRole) => void;
  formStatus: "active" | "blocked";
  setFormStatus: (val: "active" | "blocked") => void;
  onSave: (e: React.FormEvent) => void;
}

export const UserEditModal: React.FC<UserEditModalProps> = ({
  isOpen,
  onClose,
  editingUserId,
  formName,
  setFormName,
  formEmail,
  setFormEmail,
  formRole,
  setFormRole,
  formStatus,
  setFormStatus,
  onSave,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1C1E23] rounded-2xl p-6 max-w-md w-full border border-stone-200 dark:border-white/15 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-stone-900 dark:text-white">
          {editingUserId ? "Edytuj użytkownika" : "Nowy użytkownik"}
        </h3>

        <form onSubmit={onSave} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
              Imię i nazwisko
            </label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-white/15 focus:border-stone-900 dark:focus:border-white focus:outline-none text-xs text-stone-900 dark:text-white bg-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
              E-mail
            </label>
            <input
              type="email"
              required
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-white/15 focus:border-stone-900 dark:focus:border-white focus:outline-none text-xs text-stone-900 dark:text-white bg-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Rola
              </label>
              <CustomSelect
                value={formRole}
                onChange={(val) => setFormRole(val as UserRole)}
                options={[
                  { value: "creator", label: "Twórca / Instytucja" },
                  { value: "tester", label: "Tester" },
                  { value: "admin", label: "Administrator (ROPS)" },
                ]}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Status
              </label>
              <CustomSelect
                value={formStatus}
                onChange={(val) => setFormStatus(val as "active" | "blocked")}
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
              onClick={onClose}
              className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-white/10 dark:hover:bg-white/15 text-stone-800 dark:text-stone-200 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-950 rounded-xl text-xs font-semibold cursor-pointer shadow-2xs"
            >
              Zapisz
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
