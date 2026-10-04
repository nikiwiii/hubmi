"use client";

import React from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { CustomSelect } from "../shared/CustomSelect";
import { CallField, FieldType, FIELD_TYPE_LABELS } from "../../lib/grantsApi";

const inputClass =
  "w-full px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-white/15 focus:border-stone-900 dark:focus:border-white focus:outline-none text-xs text-stone-900 dark:text-white bg-transparent";

function slug(label: string): string {
  return (
    label
      .toLowerCase()
      .replace(/ł/g, "l")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 40) || "pole"
  );
}

function uniqueId(base: string, fields: CallField[]): string {
  const used = new Set(fields.map((f) => f.id));
  let id = base;
  for (let n = 2; used.has(id); n++) id = `${base}_${n}`;
  return id;
}

interface Props {
  fields: CallField[];
  onChange: (fields: CallField[]) => void;
}

/** Admin review of the fields the AI extracted from the PDF template. */
export function CallFieldsEditor({ fields, onChange }: Props) {
  const update = (index: number, patch: Partial<CallField>) =>
    onChange(fields.map((f, i) => (i === index ? { ...f, ...patch } : f)));

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= fields.length) return;
    const next = [...fields];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const add = () => {
    const section = fields[fields.length - 1]?.section ?? "";
    onChange([
      ...fields,
      { id: uniqueId("nowe_pole", fields), label: "Nowe pole", section, help: "", type: "long_text", required: false, max_chars: null },
    ]);
  };

  return (
    <div className="space-y-2">
      {fields.map((field, i) => (
        <div key={field.id} className="p-3 rounded-xl border border-stone-200 dark:border-white/10 space-y-2 bg-stone-50/50 dark:bg-white/5">
          <div className="flex items-start gap-2">
            <span className="text-[10px] font-semibold text-stone-400 mt-2 w-5 shrink-0">{i + 1}.</span>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-stone-500 dark:text-stone-400 mb-0.5">Etykieta pola</label>
                <input
                  value={field.label}
                  onChange={(e) => update(i, { label: e.target.value })}
                  onBlur={(e) => {
                    if (field.id.startsWith("nowe_pole")) {
                      update(i, { id: uniqueId(slug(e.target.value), fields.filter((_, j) => j !== i)) });
                    }
                  }}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-stone-500 dark:text-stone-400 mb-0.5">Sekcja</label>
                <input value={field.section} onChange={(e) => update(i, { section: e.target.value })} className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-semibold text-stone-500 dark:text-stone-400 mb-0.5">Instrukcja dla wnioskodawcy</label>
                <textarea
                  value={field.help}
                  rows={2}
                  onChange={(e) => update(i, { help: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-wrap items-end gap-3 sm:col-span-2">
                <div>
                  <label className="block text-[10px] font-semibold text-stone-500 dark:text-stone-400 mb-0.5">Typ</label>
                  <CustomSelect<FieldType>
                    value={field.type}
                    onChange={(v) => update(i, { type: v })}
                    options={(Object.keys(FIELD_TYPE_LABELS) as FieldType[]).map((t) => ({ value: t, label: FIELD_TYPE_LABELS[t] }))}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-stone-500 dark:text-stone-400 mb-0.5">Limit znaków</label>
                  <input
                    type="number"
                    min={1}
                    value={field.max_chars ?? ""}
                    placeholder="brak"
                    onChange={(e) => update(i, { max_chars: e.target.value ? Number(e.target.value) : null })}
                    className={`${inputClass} w-24`}
                  />
                </div>
                <label className="flex items-center gap-1.5 text-xs text-stone-700 dark:text-stone-300 pb-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => update(i, { required: e.target.checked })}
                  />
                  Wymagane
                </label>
              </div>
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              <button onClick={() => move(i, -1)} disabled={i === 0} className="p-1 rounded hover:bg-stone-200 dark:hover:bg-white/10 text-stone-500 dark:text-stone-400 disabled:opacity-30 cursor-pointer">
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => move(i, 1)} disabled={i === fields.length - 1} className="p-1 rounded hover:bg-stone-200 dark:hover:bg-white/10 text-stone-500 dark:text-stone-400 disabled:opacity-30 cursor-pointer">
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => onChange(fields.filter((_, j) => j !== i))} className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 cursor-pointer">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={add}
        className="w-full py-2 rounded-xl border border-dashed border-stone-300 dark:border-white/20 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:border-stone-900 dark:hover:border-white hover:text-stone-900 dark:hover:text-white flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Dodaj pole
      </button>
    </div>
  );
}
