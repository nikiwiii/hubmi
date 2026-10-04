import {
  InnovationRecord,
  InstitutionProfile,
  ServiceCardResponse,
} from "./types";
import { EMPTY_PROFILE } from "./middleman";

const STORAGE_INNOVATIONS_KEY = "hubmi_innovations_cache_v2";
const STORAGE_MIDDLEMAN_KEY = "hubmi_middleman_draft_v2";

let inMemoryInnovations: InnovationRecord[] | null = null;

export function getStoredInnovations(): InnovationRecord[] {
  if (inMemoryInnovations && inMemoryInnovations.length > 0) {
    return inMemoryInnovations;
  }
  if (typeof window === "undefined") return [];

  try {
    const raw =
      sessionStorage.getItem(STORAGE_INNOVATIONS_KEY) ||
      localStorage.getItem(STORAGE_INNOVATIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      inMemoryInnovations = parsed;
      return parsed;
    }
  } catch (err) {
    console.warn("Failed to parse cached innovations:", err);
  }
  return [];
}

export function saveStoredInnovations(items: InnovationRecord[]): void {
  inMemoryInnovations = items;
  if (typeof window === "undefined") return;
  try {
    const json = JSON.stringify(items);
    sessionStorage.setItem(STORAGE_INNOVATIONS_KEY, json);
    localStorage.setItem(STORAGE_INNOVATIONS_KEY, json);
  } catch (err) {
    console.warn("Failed to save innovations to cache:", err);
  }
}

export function filterInnovations(
  items: InnovationRecord[],
  query: string,
): InnovationRecord[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;

  return items.filter((inn) => {
    const title = (inn.title || "").toLowerCase();
    const desc = (inn.description || "").toLowerCase();
    const prob = (inn.addressed_problems || "").toLowerCase();
    const group = (inn.target_group || "").toLowerCase();
    const cat = (inn.category || "").toLowerCase();

    return (
      title.includes(q) ||
      desc.includes(q) ||
      prob.includes(q) ||
      group.includes(q) ||
      cat.includes(q)
    );
  });
}

export interface MiddlemanStoredDraft {
  step: "pick" | "view" | "profile" | "result";
  selectedInnovation: InnovationRecord | null;
  profile: InstitutionProfile;
  result: ServiceCardResponse | null;
  pickerQuery: string;
  pickerPage: number;
  refineText?: string;
}

export function getStoredMiddlemanDraft(): MiddlemanStoredDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      sessionStorage.getItem(STORAGE_MIDDLEMAN_KEY) ||
      localStorage.getItem(STORAGE_MIDDLEMAN_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveStoredMiddlemanDraft(draft: MiddlemanStoredDraft): void {
  if (typeof window === "undefined") return;
  try {
    const json = JSON.stringify(draft);
    sessionStorage.setItem(STORAGE_MIDDLEMAN_KEY, json);
    localStorage.setItem(STORAGE_MIDDLEMAN_KEY, json);
  } catch {
    // Ignore storage quota errors
  }
}

export function clearStoredMiddlemanDraft(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_MIDDLEMAN_KEY);
    localStorage.removeItem(STORAGE_MIDDLEMAN_KEY);
  } catch {
    // Ignore
  }
}
