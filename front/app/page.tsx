'use client';

import React from 'react';
import Link from 'next/link';
import {
  Compass,
  Search,
  Handshake,
  BookOpen,
  PlusCircle,
  FileText,
  MessageCircle,
  User as UserIcon,
  Eye,
  ArrowRight,
} from 'lucide-react';

interface SubpageCardItem {
  id: string;
  title: string;
  badge: string;
  badgeColor: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  href: string;
  tags: string[];
  ctaLabel: string;
}

const SUBPAGE_CARDS: SubpageCardItem[] = [
  {
    id: 'discover',
    title: 'Katalog Innowacji Społecznych',
    badge: 'Baza ROPS',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    icon: Compass,
    description:
      'Przeglądaj zweryfikowane innowacje społeczne z Małopolski. Dołącz do grona testerów, oceniaj prototypy i nawiązuj partnerstwa.',
    href: '/discover',
    tags: ['Kategorie tematyczne', 'Społeczność testerów', 'Eksperci ROPS'],
    ctaLabel: 'Odkrywaj innowacje',
  },
  {
    id: 'matching',
    title: 'Inteligentny Asystent Innowacji AI',
    badge: 'Matching & AI',
    badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
    icon: Search,
    description:
      'Interaktywny system doradczy AI, który analizuje wyzwania Twojej gminy lub instytucji i dobiera najskuteczniejsze innowacje.',
    href: '/matching',
    tags: ['Czat konwersacyjny', 'Rekomendacje 1-do-1', 'Diagnoza lokalna'],
    ctaLabel: 'Uruchom asystenta AI',
  },
  {
    id: 'middleman',
    title: 'Generator Usług Społecznych (Middleman)',
    badge: 'Standard CUS',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    icon: Handshake,
    description:
      'Przekształcaj innowacyjne idee w ustandaryzowaną Kartę Usługi Społecznej dla CUS i OPS z kalkulacją budżetu oraz harmonogramem.',
    href: '/middleman',
    tags: ['Karta Usługi CUS', 'Kalkulator kosztów', 'Gotowe do druku'],
    ctaLabel: 'Generuj kartę usługi',
  },
  {
    id: 'knowledge',
    title: 'Baza Raportów & Kartogramy ROPS',
    badge: '17 wskaźników 2014–2024',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    icon: BookOpen,
    description:
      'Interaktywne kartogramy 22 powiatów Małopolski, analiza trendów w czasie oraz inteligentny RAG oficjalnych diagnoz społecznych.',
    href: '/knowledge',
    tags: ['Kartogramy SVG', '22 powiaty', 'Asystent RAG do wniosków'],
    ctaLabel: 'Przeglądaj diagnozy',
  },
  {
    id: 'propose',
    title: 'Kreator Nowych Innowacji',
    badge: 'Zgłoszenia',
    badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
    icon: PlusCircle,
    description:
      'Masz pomysł na rozwiązanie problemu społecznego? Zgłoś projekt, znajdź instytucje do pilotażu i zyskaj wsparcie merytoryczne.',
    href: '/propose',
    tags: ['Formularz zgłoszeniowy', 'Weryfikacja wniosków', 'Wsparcie mentora'],
    ctaLabel: 'Zaproponuj innowację',
  },
  {
    id: 'admin',
    title: 'Generator Wniosków Grantowych',
    badge: 'Fundusze & PDF',
    badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
    icon: FileText,
    description:
      'Kreator aplikacji o granty z asystentem pól, walidacją kryteriów i automatycznym generowaniem oficjalnych dokumentów PDF.',
    href: '/admin',
    tags: ['Generator PDF', 'Szablony naborów', 'Asystent grantowy'],
    ctaLabel: 'Zarządzaj wnioskami',
  },
  {
    id: 'chat',
    title: 'Czat Społeczności i Konsultacje',
    badge: 'Komunikacja',
    badgeColor: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
    icon: MessageCircle,
    description:
      'Bezpośredni kontakt z autorami innowacji, zespołem koordynatorów ROPS Kraków oraz dyskusje między małopolskimi samorządami.',
    href: '/chat',
    tags: ['Wiadomości na żywo', 'Konsultacje projektowe', 'Współpraca'],
    ctaLabel: 'Otwórz komunikator',
  },
  {
    id: 'dashboard',
    title: 'Panel Obywatela i Profil',
    badge: 'Moje Konto',
    badgeColor: 'bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-200',
    icon: UserIcon,
    description:
      'Zarządzaj swoimi zgłoszonymi pomysłami, sprawdzaj statusy w naborach grantowych i przeglądaj historię testowanych innowacji.',
    href: '/dashboard',
    tags: ['Moje projekty', 'Statusy testowania', 'Zapisane raporty'],
    ctaLabel: 'Przejdź do profilu',
  },
  {
    id: 'testing',
    title: 'Laboratorium Dostępności Cyfrowej',
    badge: 'WCAG 2.2 AAA',
    badgeColor: 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300',
    icon: Eye,
    description:
      'Audyt i testy dostępności: symulator wad wzroku (daltonizm, zaćma), weryfikator kontrastu oraz testy nawigacji klawiaturą.',
    href: '/testing',
    tags: ['Symulator widzenia', 'Audyt kontrastu', 'Zgodność z ustawą'],
    ctaLabel: 'Uruchom tester WCAG',
  },
];

export default function HomePage() {
  return (
    <div className="py-8 sm:py-12 px-4 sm:px-6 max-w-6xl mx-auto space-y-12 animate-in fade-in duration-200">
      {/* =========================================================================
         HERO SECTION: NAGŁÓWEK GŁÓWNY I ZAPROSZENIE DO SAMOUCZKA
         ========================================================================= */}
      <section
        aria-label="Wprowadzenie do platformy"
        className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-stone-900 via-stone-850 to-stone-950 text-white p-6 sm:p-10 md:p-12 shadow-xl border border-white/10"
      >
        {/* Dekoracyjne elementy geometryczne w tle */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-white/10 text-stone-200 border border-white/15 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>MiNNO • Małopolskie Innowacje Społeczne</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight sm:leading-none">
            Zintegrowana platforma wspierania innowacji społecznych w Małopolsce
          </h1>

          <p className="text-stone-300 text-sm sm:text-base md:text-lg leading-relaxed font-normal max-w-2xl">
            Od diagnozy 17 wskaźników regionalnych ROPS Kraków, przez inteligentne dopasowanie AI i standaryzację usług CUS, aż po automatyczne generowanie wniosków grantowych.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-3">
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white hover:bg-stone-100 text-stone-950 text-xs sm:text-sm font-bold shadow-lg transition-all cursor-pointer group"
            >
              <Compass className="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              <span>Przeglądaj innowacje</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>

            <Link
              href="/knowledge"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold border border-white/15 backdrop-blur-md transition-colors cursor-pointer"
            >
              <BookOpen className="w-4 h-4" aria-hidden="true" />
              <span>Raporty i kartogramy</span>
            </Link>
          </div>
        </div>

        {/* Wskaźniki statystyczne platformy */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-6 border-t border-white/10">
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">17</div>
            <div className="text-xs text-stone-400 font-medium mt-0.5">Wskaźników GUS / ROPS</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">22</div>
            <div className="text-xs text-stone-400 font-medium mt-0.5">Powiaty Małopolski</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">100+</div>
            <div className="text-xs text-stone-400 font-medium mt-0.5">Innowacji społecznych</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">100%</div>
            <div className="text-xs text-stone-400 font-medium mt-0.5">Zgodność WCAG 2.2</div>
          </div>
        </div>
      </section>

      {/* =========================================================================
         KAFELKI PODSTRON (GŁÓWNE MODUŁY SYSTEMU)
         ========================================================================= */}
      <section aria-labelledby="modules-heading" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
              Przegląd możliwości
            </span>
            <h2
              id="modules-heading"
              className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white tracking-tight"
            >
              Moduły i podstrony platformy MiNNO
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-md">
            Wybierz sekcję, aby przejść do odpowiedniego narzędzia badawczego, doradczego lub wdrożeniowego.
          </p>
        </div>

        {/* Siatka 9 kafelków podstron */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {SUBPAGE_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.id}
                href={card.href}
                className="group flex flex-col justify-between p-6 rounded-3xl bg-white dark:bg-[#1C1E23] border border-stone-200/80 dark:border-white/10 shadow-2xs hover:shadow-md hover:border-stone-400 dark:hover:border-white/30 transition-all duration-200 cursor-pointer"
              >
                <div className="space-y-4">
                  {/* Górny pasek karty: Ikona i Odznaka */}
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-white/10 flex items-center justify-center text-stone-800 dark:text-stone-100 group-hover:scale-105 group-hover:bg-stone-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-stone-950 transition-all">
                      <Icon className="w-6 h-6" aria-hidden="true" />
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${card.badgeColor}`}>
                      {card.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-stone-900 dark:text-white tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 mt-2 leading-relaxed">
                      {card.description}
                    </p>
                  </div>

                  {/* Tagi cech */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {card.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-stone-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Dolny przycisk CTA */}
                <div className="pt-5 mt-4 border-t border-stone-100 dark:border-white/10 flex items-center justify-between text-xs font-bold text-stone-800 dark:text-stone-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  <span>{card.ctaLabel}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

    </div>
  );
}
