"use client";

import React, { useState } from "react";
import { User, UserRole } from "../../lib/types";
import { Search, UserPlus, Edit2, Trash2 } from "lucide-react";

interface DashboardUsersTabProps {
  usersList: User[];
  onOpenCreateModal: () => void;
  onOpenEditModal: (u: User) => void;
  onDeleteUser: (id: string, name: string) => void;
}

export function DashboardUsersTab({
  usersList,
  onOpenCreateModal,
  onOpenEditModal,
  onDeleteUser,
}: DashboardUsersTabProps) {
  const [userRoleFilter, setUserRoleFilter] = useState<
    "all" | "creator" | "tester" | "admin"
  >("all");
  const [searchUserQuery, setSearchUserQuery] = useState("");

  const filteredUsers = usersList.filter((u) => {
    if (userRoleFilter !== "all" && u.role !== userRoleFilter) return false;
    if (searchUserQuery.trim()) {
      const q = searchUserQuery.toLowerCase();
      const matchName = (u.name || "").toLowerCase().includes(q);
      const matchEmail = (u.email || "").toLowerCase().includes(q);
      const matchRole = (u.role || "").toLowerCase().includes(q);
      return matchName || matchEmail || matchRole;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Pasek narzędzi - zsynchronizowany z pozostałymi zakładkami */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-[#1C1E23] rounded-2xl border border-black/5 dark:border-white/10 shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "all", label: "Wszyscy", count: usersList.length },
            {
              id: "creator",
              label: "Twórcy",
              count: usersList.filter((u) => u.role === "creator").length,
            },
            {
              id: "tester",
              label: "Testerzy",
              count: usersList.filter((u) => u.role === "tester").length,
            },
            {
              id: "admin",
              label: "Administratorzy",
              count: usersList.filter((u) => u.role === "admin").length,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setUserRoleFilter(tab.id as typeof userRoleFilter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5 ${
                userRoleFilter === tab.id
                  ? "bg-stone-900 dark:bg-white text-white dark:text-stone-950 shadow-2xs"
                  : "bg-stone-100 dark:bg-white/10 hover:bg-stone-200 dark:hover:bg-white/15 text-stone-600 dark:text-stone-300"
              }`}
            >
              {tab.label}
              <span
                className={`text-[10px] font-bold px-1 rounded ${
                  userRoleFilter === tab.id ? "opacity-80" : "opacity-60"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Prawa strona: Szukajka + Dodaj użytkownika */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
            <input
              type="text"
              value={searchUserQuery}
              onChange={(e) => setSearchUserQuery(e.target.value)}
              placeholder="Szukaj użytkownika..."
              className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-stone-200 dark:border-white/15 focus:border-stone-900 dark:focus:border-white focus:outline-none text-xs text-stone-900 dark:text-white bg-transparent"
            />
            {searchUserQuery && (
              <button
                onClick={() => setSearchUserQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-950 rounded-xl text-xs font-semibold cursor-pointer shadow-2xs whitespace-nowrap transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Dodaj użytkownika</span>
          </button>
        </div>
      </div>

      {/* Tabela użytkowników w karcie */}
      <div className="bg-white dark:bg-[#1C1E23] rounded-2xl border border-black/5 dark:border-white/10 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-800 dark:text-stone-200">
            <thead className="bg-stone-50 dark:bg-white/5 text-stone-500 dark:text-stone-400 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4 rounded-l-lg">Użytkownik</th>
                <th className="py-3 px-4">Rola</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right rounded-r-lg">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-white/10">
              {filteredUsers.map((u) => (
                <tr
                  key={u.id}
                  className="hover:bg-stone-50/60 dark:hover:bg-white/5 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-stone-800 text-[11px] shrink-0"
                        style={{ backgroundColor: u.avatarBg || "#A4B3F6" }}
                      >
                        {(u.name || u.email || "U").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-stone-900 dark:text-white">
                          {u.name || u.email || "Użytkownik"}
                        </p>
                        <p className="text-[10px] text-stone-400">
                          {u.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-stone-100 dark:bg-white/10 text-stone-600 dark:text-stone-300 border border-stone-200/60 dark:border-white/10">
                      {u.role}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${
                        u.status === "active"
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-stone-400"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          u.status === "active"
                            ? "bg-emerald-500"
                            : "bg-stone-400"
                        }`}
                      />
                      {u.status === "active" ? "Aktywny" : "Zablokowany"}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onOpenEditModal(u)}
                        aria-label={`Edytuj użytkownika ${u.name}`}
                        className="p-1.5 min-h-[30px] min-w-[30px] flex items-center justify-center rounded-lg hover:bg-stone-100 dark:hover:bg-white/10 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white cursor-pointer transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteUser(u.id, u.name)}
                        aria-label={`Usuń użytkownika ${u.name}`}
                        className="p-1.5 min-h-[30px] min-w-[30px] flex items-center justify-center rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-500 hover:text-rose-700 cursor-pointer transition-colors"
                      >
                        <Trash2
                          className="w-3.5 h-3.5"
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <div className="p-12 text-center text-xs text-stone-500">
            {searchUserQuery || userRoleFilter !== "all"
              ? "Brak użytkowników pasujących do kryteriów wyszukiwania."
              : "Brak użytkowników w systemie."}
          </div>
        )}
      </div>
    </div>
  );
}
