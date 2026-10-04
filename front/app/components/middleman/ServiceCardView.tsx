"use client";

import React from "react";
import {
  Puzzle,
  ListChecks,
  Building2,
  CalendarRange,
  Wallet,
  Coins,
  Target,
  TriangleAlert,
  ArrowRight,
  MessageCircle,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { InstitutionProfile, ServiceCardResponse } from "../../lib/types";
import { formatPLN, institutionDisplayName } from "../../lib/middleman";

interface ServiceCardViewProps {
  response: ServiceCardResponse;
  profile: InstitutionProfile;
  onConsultExpert: () => void;
  isConsulting: boolean;
}

const Section: React.FC<{
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}> = ({ icon, title, children }) => (
  <section className="mm-print-section bg-white rounded-2xl border border-black/5 p-5 sm:p-6 shadow-2xs space-y-3">
    <h3 className="flex items-center gap-2 text-base font-bold text-stone-900">
      <span className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center text-stone-700 print:hidden">
        {icon}
      </span>
      {title}
    </h3>
    <div className="text-sm text-stone-700 leading-relaxed">{children}</div>
  </section>
);

const Bullets: React.FC<{ items: string[] }> = ({ items }) =>
  items.length ? (
    <ul className="list-disc pl-5 space-y-1.5">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  ) : (
    <p className="text-stone-400">—</p>
  );

export const ServiceCardView: React.FC<ServiceCardViewProps> = ({
  response,
  profile,
  onConsultExpert,
  isConsulting,
}) => {
  const card = response.card;
  const resourceGroups: { label: string; items: string[] }[] = [
    { label: "Kadra", items: card.resources.staff },
    { label: "Lokal", items: card.resources.premises },
    { label: "Sprzęt", items: card.resources.equipment },
    { label: "Partnerzy lokalni", items: card.resources.local_partners },
  ];

  return (
    <article className="space-y-4">
      <header
        className="mm-print-section rounded-[28px] p-6 sm:p-8 border border-black/5 shadow-2xs space-y-3"
        style={{
          background:
            "radial-gradient(circle at 14% 14%, #FAF4E5 0%, #FFFFFF 48%, #FAFAF8 80%, #F5F5F0 100%)",
        }}
      >
        <span className="inline-block px-3 py-1 bg-stone-900 text-white rounded-xl text-[10px] font-extrabold uppercase tracking-wider">
          Dostosowana forma usługi
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight leading-tight">
          {card.service_name}
        </h2>
        <p className="text-base text-stone-700 leading-relaxed">{card.summary}</p>
        {card.feasibility_note && (
          <div className="flex items-start gap-2 text-sm text-amber-900 bg-amber-50 border border-amber-300 rounded-xl px-4 py-3">
            <TriangleAlert className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
            <p>
              <span className="font-semibold">Uwaga dotycząca budżetu: </span>
              {card.feasibility_note}
            </p>
          </div>
        )}
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-stone-500 pt-2 border-t border-black/5">
          <div>
            <dt className="inline font-semibold text-stone-700">Instytucja: </dt>
            <dd className="inline">{institutionDisplayName(profile)}</dd>
          </div>
          <div>
            <dt className="inline font-semibold text-stone-700">Na podstawie innowacji: </dt>
            <dd className="inline">
              {response.innovation_url ? (
                <a
                  href={response.innovation_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-stone-900 inline-flex items-center gap-1"
                >
                  {response.innovation_title}
                  <ExternalLink className="w-3 h-3 print:hidden" />
                </a>
              ) : (
                response.innovation_title
              )}
            </dd>
          </div>
        </dl>
      </header>

      <Section icon={<Puzzle className="w-4 h-4" />} title="Jak dostosowaliśmy innowację do Waszej instytucji">
        <ul className="space-y-2.5">
          {card.adaptations.map((a, i) => (
            <li key={i} className="p-3 rounded-xl bg-[#FAF9F5] border border-black/5">
              <p className="font-semibold text-stone-900">{a.change}</p>
              <p className="text-stone-600">Dlaczego: {a.reason}</p>
            </li>
          ))}
        </ul>
      </Section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Section icon={<ListChecks className="w-4 h-4" />} title="Zakres usługi i odbiorcy">
          <Bullets items={card.scope} />
          <p className="mt-3">
            <span className="font-semibold text-stone-900">Odbiorcy: </span>
            {card.recipients}
          </p>
        </Section>

        <Section icon={<Building2 className="w-4 h-4" />} title="Potrzebne zasoby">
          <dl className="space-y-2.5">
            {resourceGroups.map((g) => (
              <div key={g.label}>
                <dt className="font-semibold text-stone-900">{g.label}</dt>
                <dd>
                  <Bullets items={g.items} />
                </dd>
              </div>
            ))}
          </dl>
        </Section>
      </div>

      <Section icon={<CalendarRange className="w-4 h-4" />} title="Harmonogram wdrożenia">
        <ol className="space-y-3">
          {card.timeline.map((phase, i) => (
            <li key={i} className="flex gap-3">
              <span className="w-7 h-7 shrink-0 rounded-full bg-stone-900 text-white text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <div className="flex-1">
                <p className="font-semibold text-stone-900">
                  {phase.name}{" "}
                  <span className="font-normal text-stone-500">· {phase.duration}</span>
                </p>
                <Bullets items={phase.activities} />
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section icon={<Wallet className="w-4 h-4" />} title="Szacunkowy budżet">
        <div className="overflow-x-auto border border-black/5 rounded-xl">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-stone-50 text-stone-900">
              <tr>
                <th className="px-3.5 py-2.5 font-semibold">Pozycja</th>
                <th className="px-3.5 py-2.5 font-semibold text-right whitespace-nowrap">Kwota</th>
              </tr>
            </thead>
            <tbody>
              {card.budget.items.map((item, i) => (
                <tr key={i} className="border-t border-black/5 align-top">
                  <td className="px-3.5 py-2.5">
                    <span className="text-stone-900">{item.name}</span>
                    {item.note && <span className="block text-xs text-stone-500">{item.note}</span>}
                  </td>
                  <td className="px-3.5 py-2.5 text-right whitespace-nowrap font-mono">
                    {formatPLN(item.amount_pln)}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-stone-900/20 bg-[#FAF9F5]">
                <td className="px-3.5 py-2.5 font-bold text-stone-900">Razem (szacunek)</td>
                <td className="px-3.5 py-2.5 text-right whitespace-nowrap font-mono font-bold text-stone-900">
                  {formatPLN(card.budget.total_pln)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-amber-800 bg-amber-50 border border-amber-200/60 rounded-lg px-3 py-2">
          {card.budget.disclaimer}
        </p>
      </Section>

      <Section icon={<Coins className="w-4 h-4" />} title="Możliwe źródła finansowania">
        {card.funding_sources.length ? (
          <ul className="space-y-2">
            {card.funding_sources.map((f, i) => (
              <li key={i}>
                <span className="font-semibold text-stone-900">{f.source}</span> – {f.how_to_use}
              </li>
            ))}
          </ul>
        ) : (
          <p>Baza nie zawiera informacji o finansowaniu tej innowacji – warto zapytać ekspertów ROPS.</p>
        )}
      </Section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Section icon={<Target className="w-4 h-4" />} title="Wskaźniki sukcesu">
          <ul className="space-y-2.5">
            {card.kpis.map((k, i) => (
              <li key={i}>
                <p className="font-semibold text-stone-900">
                  {k.name}: <span className="font-normal">{k.target}</span>
                </p>
                <p className="text-xs text-stone-500">Jak mierzyć: {k.measurement}</p>
              </li>
            ))}
          </ul>
        </Section>

        <Section icon={<TriangleAlert className="w-4 h-4" />} title="Ryzyka i jak je ograniczyć">
          <ul className="space-y-2.5">
            {card.risks.map((r, i) => (
              <li key={i}>
                <p className="font-semibold text-stone-900">{r.risk}</p>
                <p className="text-stone-600">→ {r.mitigation}</p>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <Section icon={<ArrowRight className="w-4 h-4" />} title="Następne kroki">
        <ol className="list-decimal pl-5 space-y-1.5">
          {card.next_steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
        <button
          onClick={onConsultExpert}
          disabled={isConsulting}
          className="print:hidden mt-4 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-stone-900 hover:bg-stone-800 text-white shadow-2xs transition-all cursor-pointer disabled:opacity-60"
        >
          {isConsulting ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <MessageCircle className="w-4 h-4" />
          )}
          Skonsultuj z ekspertem ROPS
        </button>
      </Section>
    </article>
  );
};
