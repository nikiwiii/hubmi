"use client";

import React from "react";
import {
  FileText,
  Lightbulb,
  FlaskConical,
  Users,
  Layers,
  Shield,
} from "lucide-react";

export type DashboardTab = "calls" | "ideas" | "testers" | "users" | "my-ideas";

interface DashboardTabsNavProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  callsCount: number;
  pendingIdeasCount: number;
  totalIdeasCount: number;
  pendingTesterAppsCount: number;
  totalTesterAppsCount: number;
  usersCount: number;
  myIdeasCount: number;
}

export function DashboardTabsNav({
  activeTab,
  onTabChange,
  callsCount,
  pendingIdeasCount,
  totalIdeasCount,
  pendingTesterAppsCount,
  totalTesterAppsCount,
  usersCount,
  myIdeasCount,
}: DashboardTabsNavProps) {
  const tabs = [
    {
      id: "calls" as DashboardTab,
      icon: <FileText className="w-3.5 h-3.5" />,
      label: "Nabory",
      badge: callsCount,
      isBadgeAlert: false,
    },
    {
      id: "ideas" as DashboardTab,
      icon: <Lightbulb className="w-3.5 h-3.5" />,
      label: "Pomysły",
      badge: pendingIdeasCount > 0 ? pendingIdeasCount : totalIdeasCount,
      isBadgeAlert: pendingIdeasCount > 0,
    },
    {
      id: "testers" as DashboardTab,
      icon: <FlaskConical className="w-3.5 h-3.5" />,
      label: "Testerzy",
      badge:
        pendingTesterAppsCount > 0
          ? pendingTesterAppsCount
          : totalTesterAppsCount,
      isBadgeAlert: pendingTesterAppsCount > 0,
    },
    {
      id: "users" as DashboardTab,
      icon: <Users className="w-3.5 h-3.5" />,
      label: "Użytkownicy",
      badge: usersCount,
      isBadgeAlert: false,
    },
    {
      id: "my-ideas" as DashboardTab,
      icon: <Layers className="w-3.5 h-3.5" />,
      label: "Moje Pomysły",
      badge: myIdeasCount,
      isBadgeAlert: false,
    },
  ];

  return (
    <div className="bg-white dark:bg-[#1C1E23] rounded-2xl border border-black/5 dark:border-white/10 shadow-2xs overflow-hidden">
      {/* Nagłówek Panelu Zarządzania */}
      <div className="flex items-center gap-2.5 px-4 pt-3.5 pb-2.5 border-b border-black/5 dark:border-white/10">
        <div className="w-6 h-6 rounded-md bg-stone-900 dark:bg-white text-white dark:text-stone-900 flex items-center justify-center shrink-0">
          <Shield className="w-3.5 h-3.5" />
        </div>
        <h2 className="text-xs font-bold text-stone-900 dark:text-white tracking-tight uppercase">
          Panel Zarządzania
        </h2>
      </div>

      {/* Pasek zakładek */}
      <div
        role="tablist"
        aria-label="Zakładki panelu zarządzania"
        className="flex items-center gap-0.5 overflow-x-auto scrollbar-none px-3 py-2 bg-stone-50 dark:bg-white/3"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`min-h-[34px] px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-white dark:bg-[#1C1E23] text-stone-900 dark:text-white shadow-sm border border-black/5 dark:border-white/10 font-bold"
                : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-white/5"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                tab.isBadgeAlert
                  ? "bg-amber-500 text-white animate-pulse"
                  : activeTab === tab.id
                    ? "bg-stone-200 dark:bg-white/15 text-stone-700 dark:text-stone-300"
                    : "bg-stone-200/70 dark:bg-white/10 text-stone-500 dark:text-stone-500"
              }`}
            >
              {tab.badge}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
