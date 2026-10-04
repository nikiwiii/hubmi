import { POWIATY_DATA } from "./malopolskaMapData";
import {
  BudgetRange,
  InstitutionProfile,
  InstitutionType,
  ServiceCardResponse,
} from "./types";

export const INSTITUTION_TYPE_OPTIONS: { value: InstitutionType; label: string }[] = [
  { value: "gmina_miejska", label: "Gmina miejska" },
  { value: "gmina_wiejska", label: "Gmina wiejska" },
  { value: "gmina_miejsko_wiejska", label: "Gmina miejsko-wiejska" },
  { value: "powiat", label: "Powiat" },
  { value: "cus", label: "Centrum Usług Społecznych" },
  { value: "ops", label: "Ośrodek pomocy społecznej" },
  { value: "ngo", label: "Organizacja pozarządowa (NGO)" },
  { value: "inna", label: "Inna instytucja" },
];

export const BUDGET_OPTIONS: { value: BudgetRange; label: string }[] = [
  { value: "below_20k", label: "do 20 tys. zł" },
  { value: "20k_100k", label: "20–100 tys. zł" },
  { value: "100k_500k", label: "100–500 tys. zł" },
  { value: "above_500k", label: "ponad 500 tys. zł" },
];

export const HORIZON_OPTIONS: { value: 3 | 6 | 12; label: string }[] = [
  { value: 3, label: "3 miesiące" },
  { value: 6, label: "6 miesięcy" },
  { value: 12, label: "12 miesięcy" },
];

export const POWIAT_OPTIONS: string[] = POWIATY_DATA.map((p) => p.name).sort(
  (a, b) => a.localeCompare(b, "pl"),
);

export const EMPTY_PROFILE: InstitutionProfile = {
  institution_type: "gmina_wiejska",
  institution_name: "",
  powiat: "",
  target_group: "",
  recipients_count: null,
  budget_range: "20k_100k",
  staff_resources: "",
  time_horizon_months: 6,
  local_context: "",
};

export function institutionTypeLabel(type: InstitutionType): string {
  return INSTITUTION_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? "Instytucja";
}

export function institutionDisplayName(profile: InstitutionProfile): string {
  const name = profile.institution_name?.trim();
  const base = name || institutionTypeLabel(profile.institution_type);
  return profile.powiat ? `${base} (${profile.powiat})` : base;
}

export function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

export function formatPLN(amount: number): string {
  return `${amount.toLocaleString("pl-PL")} zł`;
}

export function getInnovationCategoryStyle(category?: string | null, fallbackText?: string) {
  const cat = (category || fallbackText || "").toLowerCase();
  if (cat.includes("ogród") || cat.includes("dom") || cat.includes("środowisk") || cat.includes("ekolog") || cat.includes("zieleni")) {
    return {
      cardBg: "bg-[#F0F6F2] dark:bg-[#1C2620] hover:bg-[#E5F1E9] dark:hover:bg-[#223028]",
      border: "border-[#D4E5DB] dark:border-emerald-500/25",
      badgeBg: "bg-emerald-100/90 text-emerald-950 dark:bg-emerald-950/70 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/60",
      accentDot: "bg-emerald-600",
      label: category || "Ochrona środowiska & Ekologia",
    };
  }
  if (cat.includes("zdrowie") || cat.includes("lek") || cat.includes("niepełnosprawn") || cat.includes("szpital") || cat.includes("opiek") || cat.includes("senior")) {
    return {
      cardBg: "bg-[#F1F4FB] dark:bg-[#1E2232] hover:bg-[#E6ECFA] dark:hover:bg-[#23293D]",
      border: "border-[#D7E0F5] dark:border-indigo-500/25",
      badgeBg: "bg-indigo-100/90 text-indigo-950 dark:bg-indigo-950/70 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800/60",
      accentDot: "bg-indigo-600",
      label: category || "Zdrowie & Dostępność",
    };
  }
  if (cat.includes("społecz") || cat.includes("rozwój") || cat.includes("młodzież") || cat.includes("pomoc") || cat.includes("dziec") || cat.includes("rodzin")) {
    return {
      cardBg: "bg-[#FAF5EC] dark:bg-[#26231A] hover:bg-[#F5EDDC] dark:hover:bg-[#2E2A1E]",
      border: "border-[#EFE4CC] dark:border-amber-500/25",
      badgeBg: "bg-amber-100/90 text-amber-950 dark:bg-amber-950/70 dark:text-amber-200 border border-amber-200 dark:border-amber-800/60",
      accentDot: "bg-amber-600",
      label: category || "Społeczność & Usługi CUS",
    };
  }
  if (cat.includes("podróż") || cat.includes("transport") || cat.includes("cyfryz") || cat.includes("komunik") || cat.includes("dostęp")) {
    return {
      cardBg: "bg-[#F0F7FA] dark:bg-[#19252B] hover:bg-[#E4F2F7] dark:hover:bg-[#1F3038]",
      border: "border-[#D2E6EE] dark:border-cyan-500/25",
      badgeBg: "bg-cyan-100/90 text-cyan-950 dark:bg-cyan-950/70 dark:text-cyan-200 border border-cyan-200 dark:border-cyan-800/60",
      accentDot: "bg-cyan-600",
      label: category || "Dostępność & Cyfryzacja",
    };
  }
  if (cat.includes("rzemiosł") || cat.includes("kultur") || cat.includes("edukacj") || cat.includes("warsztat") || cat.includes("szkoł")) {
    return {
      cardBg: "bg-[#F6F1FB] dark:bg-[#251D2C] hover:bg-[#EEE6FA] dark:hover:bg-[#2F2438]",
      border: "border-[#E3D6F3] dark:border-purple-500/25",
      badgeBg: "bg-purple-100/90 text-purple-950 dark:bg-purple-950/70 dark:text-purple-200 border border-purple-200 dark:border-purple-800/60",
      accentDot: "bg-purple-600",
      label: category || "Kultura & Edukacja",
    };
  }
  if (cat.includes("prac") || cat.includes("biznes") || cat.includes("finanse") || cat.includes("aktyw") || cat.includes("bezrobot")) {
    return {
      cardBg: "bg-[#FAF1F3] dark:bg-[#2A1B20] hover:bg-[#F4E5E8] dark:hover:bg-[#342228]",
      border: "border-[#F2D6DC] dark:border-rose-500/25",
      badgeBg: "bg-rose-100/90 text-rose-950 dark:bg-rose-950/70 dark:text-rose-200 border border-rose-200 dark:border-rose-800/60",
      accentDot: "bg-rose-600",
      label: category || "Rynek Pracy & Finanse",
    };
  }
  return {
    cardBg: "bg-[#F5F5F3] dark:bg-[#202226] hover:bg-[#EBEBE7] dark:hover:bg-[#282B30]",
    border: "border-[#E1E2DB] dark:border-stone-500/25",
    badgeBg: "bg-stone-200/80 text-stone-900 dark:bg-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-700",
    accentDot: "bg-stone-500",
    label: category || "Innowacja Społeczna",
  };
}

function bulletList(items: string[]): string {
  return items.length ? items.map((i) => `- ${i}`).join("\n") : "- brak";
}

export function serviceCardToText(
  response: ServiceCardResponse,
  profile: InstitutionProfile,
): string {
  const c = response.card;
  return [
    `KARTA USŁUGI: ${c.service_name}`,
    `Instytucja: ${institutionDisplayName(profile)}`,
    `Na podstawie innowacji: ${response.innovation_title}${response.innovation_url ? ` (${response.innovation_url})` : ""}`,
    "",
    c.summary,
    "",
    "JAK DOSTOSOWALIŚMY INNOWACJĘ",
    bulletList(c.adaptations.map((a) => `${a.change} – ${a.reason}`)),
    "",
    "ZAKRES USŁUGI",
    bulletList(c.scope),
    `Odbiorcy: ${c.recipients}`,
    "",
    "POTRZEBNE ZASOBY",
    `Kadra:\n${bulletList(c.resources.staff)}`,
    `Lokal:\n${bulletList(c.resources.premises)}`,
    `Sprzęt:\n${bulletList(c.resources.equipment)}`,
    `Partnerzy lokalni:\n${bulletList(c.resources.local_partners)}`,
    "",
    "HARMONOGRAM",
    c.timeline
      .map((t) => `${t.name} (${t.duration})\n${bulletList(t.activities)}`)
      .join("\n"),
    "",
    "SZACUNKOWY BUDŻET",
    bulletList(
      c.budget.items.map(
        (i) => `${i.name}: ${formatPLN(i.amount_pln)}${i.note ? ` – ${i.note}` : ""}`,
      ),
    ),
    `Razem: ${formatPLN(c.budget.total_pln)}`,
    ...(c.feasibility_note ? [`UWAGA: ${c.feasibility_note}`] : []),
    c.budget.disclaimer,
    "",
    "MOŻLIWE ŹRÓDŁA FINANSOWANIA",
    bulletList(c.funding_sources.map((f) => `${f.source} – ${f.how_to_use}`)),
    "",
    "WSKAŹNIKI SUKCESU",
    bulletList(c.kpis.map((k) => `${k.name}: ${k.target} (pomiar: ${k.measurement})`)),
    "",
    "RYZYKA",
    bulletList(c.risks.map((r) => `${r.risk} → ${r.mitigation}`)),
    "",
    "NASTĘPNE KROKI",
    bulletList(c.next_steps),
  ].join("\n");
}

/**
 * Wyciąga 11-znakowy identyfikator filmu YouTube z różnych formatów adresów URL.
 */
export function extractYoutubeVideoId(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    // 1. Krótki link youtu.be/<id>
    const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortMatch && shortMatch[1]) return shortMatch[1];

    // 2. Linki embed/<id> lub shorts/<id> lub v/<id>
    const embedMatch = trimmed.match(/youtube(?:-nocookie)?\.com\/(?:embed|shorts|v)\/([a-zA-Z0-9_-]{11})/);
    if (embedMatch && embedMatch[1]) return embedMatch[1];

    // 3. Standardowy link watch?v=<id> lub &v=<id>
    const vMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (vMatch && vMatch[1]) return vMatch[1];

  } catch {
    return null;
  }
  return null;
}

/**
 * Zwraca bezpieczny adres osadzenia YouTube (youtube-nocookie) dla iframe.
 */
export function getYoutubeEmbedUrl(url: string | null | undefined): string | null {
  const id = extractYoutubeVideoId(url);
  if (!id) return null;
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0`;
}

