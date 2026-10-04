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

