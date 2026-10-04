'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ArrowRight,
  BookOpen,
  Search,
  Handshake,
  FileText,
  Eye,
  CheckCircle2,
  Compass,
  RotateCcw
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export interface TutorialStep {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  targetUrl: string;
  targetButtonLabel: string;
  badge: string;
  accentColor: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'knowledge',
    title: 'Diagnoza Potrzeb & Wskaźniki Regionalne',
    subtitle: 'Krok 1: Sprawdź stan faktyczny Małopolski',
    description:
      'Poznaj 17 kluczowych diagnoz społecznych ROPS Kraków w szeregach czasowych 2014–2024. Oglądaj interaktywne kartogramy 22 powiatów, porównuj trendy i korzystaj z wyszukiwarki RAG, która podpowiada uzasadnienia problemowe do projektów.',
    targetUrl: '/knowledge',
    targetButtonLabel: 'Otwórz Raporty i Kartogramy',
    badge: '17 wskaźników • 22 powiaty',
    accentColor: '#3B82F6',
  },
  {
    id: 'matching',
    title: 'Inteligentny Asystent Innowacji AI',
    subtitle: 'Krok 2: Dobierz innowację do wyzwania',
    description:
      'Opisz problem swojej gminy lub instytucji naturalnym językiem. Asystent analizuje bazę innowacji ROPS i błyskawicznie rekomenduje sprawdzone rozwiązania przetestowane w innych małopolskich samorządach.',
    targetUrl: '/matching',
    targetButtonLabel: 'Uruchom Asystenta AI',
    badge: 'Matching AI • Baza ROPS',
    accentColor: '#8B5CF6',
  },
  {
    id: 'middleman',
    title: 'Generator Usług Społecznych (Middleman)',
    subtitle: 'Krok 3: Przekształć pomysł w standard wdrożenia',
    description:
      'Gotowe innowacje przekształcisz w ustandaryzowaną Kartę Usługi Społecznej dla Centrum Usług Społecznych (CUS) lub OPS. Narzędzie automatycznie generuje harmonogram, kalkulację kosztów i profil kadrowy.',
    targetUrl: '/middleman',
    targetButtonLabel: 'Przejdź do Generatora Usług',
    badge: 'Standard CUS • Budżet',
    accentColor: '#10B981',
  },
  {
    id: 'propose_grants',
    title: 'Kreator Wniosków Grantowych & Zgłoszeń',
    subtitle: 'Krok 4: Pozyskaj finansowanie na projekt',
    description:
      'Zgłoś własny pomysł na innowację lub skorzystaj z generatora wniosków o dofinansowanie grantowe. Wypełniaj formularze z pomocą asystenta pól i eksportuj oficjalne dokumenty aplikacyjne do formatu PDF.',
    targetUrl: '/propose',
    targetButtonLabel: 'Zaproponuj Innowację',
    badge: 'Generator PDF • Finansowanie',
    accentColor: '#F59E0B',
  },
  {
    id: 'accessibility',
    title: 'Dostępność Cyfrowa Bez Wykluczeń',
    subtitle: 'Krok 5: Pełna inkluzywność WCAG 2.2 AA / AAA',
    description:
      'Platforma MiNNO została zaprojektowana z myślą o osobach ze szczególnymi potrzebami: dedykowany tryb ciemny, odrębny tryb wysokiego kontrastu (żółto-czarny), skalowanie tekstu do 200%, nawigacja klawiaturą oraz dźwięki potwierdzeń.',
    targetUrl: '/testing',
    targetButtonLabel: 'Otwórz Tester Dostępności',
    badge: '100% WCAG 2.2 AA / AAA',
    accentColor: '#EC4899',
  },
];

/* =========================================================================
   ANIMOWANE GRAFIKI WEKTOROWE PISANE KODEM (SVG + CSS KEYFRAMES)
   ========================================================================= */

function GraphicKnowledge() {
  return (
    <div className="relative w-full h-full flex items-center justify-center p-4 select-none overflow-hidden">
      <svg
        viewBox="0 0 360 240"
        className="w-full h-full max-h-56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Animowana mapa powiatów Małopolski z radarem i wskaźnikami danych"
      >
        <defs>
          <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
            <stop offset="70%" stopColor="#3B82F6" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="barGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#60A5FA" />
          </linearGradient>
        </defs>

        {/* Siatka tła */}
        <g stroke="currentColor" strokeOpacity="0.08" strokeWidth="1">
          <line x1="20" y1="40" x2="340" y2="40" />
          <line x1="20" y1="80" x2="340" y2="80" />
          <line x1="20" y1="120" x2="340" y2="120" />
          <line x1="20" y1="160" x2="340" y2="160" />
          <line x1="20" y1="200" x2="340" y2="200" />
          <line x1="80" y1="20" x2="80" y2="220" />
          <line x1="160" y1="20" x2="160" y2="220" />
          <line x1="240" y1="20" x2="240" y2="220" />
          <line x1="320" y1="20" x2="320" y2="220" />
        </g>

        {/* Fale radaru rozchodzące się ze środka regionu */}
        <circle cx="170" cy="115" r="30" fill="url(#radarGlow)" className="animate-ping" style={{ animationDuration: '3s' }} />
        <circle cx="170" cy="115" r="65" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="4 4" strokeOpacity="0.5" className="animate-spin" style={{ animationDuration: '24s' }} />
        <circle cx="170" cy="115" r="95" stroke="#3B82F6" strokeWidth="1" strokeOpacity="0.25" />

        {/* Zarys konturu Małopolski (uproszczony wektor geometryczny) */}
        <path
          d="M75,100 L110,65 L160,55 L220,60 L275,85 L290,130 L260,175 L210,195 L150,185 L105,175 L65,135 Z"
          fill="#3B82F6"
          fillOpacity="0.12"
          stroke="#3B82F6"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Granice wewnętrzne subregionów */}
        <path d="M110,65 L170,115 L210,195" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="3 3" strokeOpacity="0.6" />
        <path d="M170,115 L275,85" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="3 3" strokeOpacity="0.6" />
        <path d="M170,115 L105,175" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="3 3" strokeOpacity="0.6" />

        {/* Pulsujące punkty powiatowe */}
        {/* Kraków */}
        <g transform="translate(170, 115)">
          <circle r="9" fill="#2563EB" fillOpacity="0.3" className="animate-ping" style={{ animationDuration: '2s' }} />
          <circle r="5" fill="#2563EB" stroke="#ffffff" strokeWidth="2" />
        </g>
        {/* Tarnów */}
        <g transform="translate(245, 95)">
          <circle r="7" fill="#60A5FA" fillOpacity="0.3" className="animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
          <circle r="4" fill="#3B82F6" stroke="#ffffff" strokeWidth="1.5" />
        </g>
        {/* Nowy Sącz */}
        <g transform="translate(230, 155)">
          <circle r="7" fill="#60A5FA" fillOpacity="0.3" className="animate-ping" style={{ animationDuration: '2.2s', animationDelay: '0.8s' }} />
          <circle r="4" fill="#3B82F6" stroke="#ffffff" strokeWidth="1.5" />
        </g>
        {/* Chrzanów / Oświęcim */}
        <g transform="translate(95, 115)">
          <circle r="4" fill="#3B82F6" stroke="#ffffff" strokeWidth="1.5" />
        </g>
        {/* Nowy Targ / Tatry */}
        <g transform="translate(160, 175)">
          <circle r="4" fill="#3B82F6" stroke="#ffffff" strokeWidth="1.5" />
        </g>

        {/* Dynamiczne słupki wykresów w prawym dolnym rogu */}
        <g transform="translate(265, 150)">
          <rect x="0" y="25" width="8" height="35" rx="3" fill="url(#barGrad)" className="animate-pulse" style={{ animationDuration: '1.8s' }} />
          <rect x="12" y="10" width="8" height="50" rx="3" fill="url(#barGrad)" className="animate-pulse" style={{ animationDuration: '2.3s', animationDelay: '0.3s' }} />
          <rect x="24" y="2" width="8" height="58" rx="3" fill="url(#barGrad)" className="animate-pulse" style={{ animationDuration: '1.5s', animationDelay: '0.6s' }} />
          <rect x="36" y="18" width="8" height="42" rx="3" fill="url(#barGrad)" className="animate-pulse" style={{ animationDuration: '2.1s', animationDelay: '0.9s' }} />
        </g>

        {/* Ruchoma linia skanera laserowego */}
        <line x1="20" y1="30" x2="340" y2="30" stroke="#60A5FA" strokeWidth="1.5" strokeOpacity="0.7">
          <animate attributeName="y1" values="30;210;30" dur="4s" repeatCount="indefinite" />
          <animate attributeName="y2" values="30;210;30" dur="4s" repeatCount="indefinite" />
        </line>

        {/* Pływająca etykieta wskaźnika */}
        <g transform="translate(20, 20)">
          <rect width="120" height="26" rx="8" fill="#1E293B" fillOpacity="0.9" stroke="#3B82F6" strokeWidth="1" />
          <text x="12" y="17" fill="#60A5FA" fontSize="10" fontWeight="bold">Dostępność: 74,5%</text>
        </g>
      </svg>
    </div>
  );
}

function GraphicMatching() {
  return (
    <div className="relative w-full h-full flex items-center justify-center p-4 select-none overflow-hidden">
      <svg
        viewBox="0 0 360 240"
        className="w-full h-full max-h-56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Animowana sieć neuronowa asystenta AI łącząca wyzwania z innowacjami"
      >
        <defs>
          <radialGradient id="aiCoreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#A855F7" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#7E22CE" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#7E22CE" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Orbitujące pierścienie wokół rdzenia AI */}
        <circle cx="180" cy="120" r="50" stroke="#C084FC" strokeWidth="1" strokeDasharray="6 4" className="animate-spin" style={{ animationDuration: '18s' }} />
        <circle cx="180" cy="120" r="75" stroke="#A855F7" strokeWidth="1.5" strokeDasharray="8 6" className="animate-spin" style={{ animationDuration: '28s', animationDirection: 'reverse' }} />

        {/* Linie synaps łączące węzły z pulsującym efektem dashoffset */}
        <line x1="180" y1="120" x2="60" y2="60" stroke="#A855F7" strokeWidth="2" strokeDasharray="5 5" className="animate-pulse" />
        <line x1="180" y1="120" x2="70" y2="180" stroke="#A855F7" strokeWidth="2" strokeDasharray="5 5" className="animate-pulse" style={{ animationDelay: '0.4s' }} />
        <line x1="180" y1="120" x2="300" y2="70" stroke="#C084FC" strokeWidth="2" strokeDasharray="5 5" className="animate-pulse" style={{ animationDelay: '0.8s' }} />
        <line x1="180" y1="120" x2="290" y2="180" stroke="#C084FC" strokeWidth="2" strokeDasharray="5 5" className="animate-pulse" style={{ animationDelay: '1.2s' }} />
        <line x1="60" y1="60" x2="70" y2="180" stroke="#7E22CE" strokeWidth="1" strokeOpacity="0.4" />
        <line x1="300" y1="70" x2="290" y2="180" stroke="#7E22CE" strokeWidth="1" strokeOpacity="0.4" />

        {/* Węzły wejściowe po lewej (Wyzwania / Zapytania) */}
        <g transform="translate(60, 60)">
          <rect x="-45" y="-18" width="90" height="36" rx="10" fill="#2E1065" stroke="#A855F7" strokeWidth="1.5" />
          <text x="0" y="4" fill="#E9D5FF" fontSize="10" fontWeight="bold" textAnchor="middle">Wyzwanie CUS</text>
        </g>

        <g transform="translate(70, 180)">
          <rect x="-45" y="-18" width="90" height="36" rx="10" fill="#2E1065" stroke="#A855F7" strokeWidth="1.5" />
          <text x="0" y="4" fill="#E9D5FF" fontSize="10" fontWeight="bold" textAnchor="middle">Seniorzy 65+</text>
        </g>

        {/* Centralny rdzeń AI */}
        <circle cx="180" cy="120" r="38" fill="url(#aiCoreGlow)" />
        <circle cx="180" cy="120" r="22" fill="#7E22CE" stroke="#F3E8FF" strokeWidth="2" />
        {/* Ikona Sparkles w środku */}
        <path d="M180,108 L183,117 L192,120 L183,123 L180,132 L177,123 L168,120 L177,117 Z" fill="#FFFFFF" />

        {/* Węzły wynikowe po prawej (Dopasowane innowacje ROPS) */}
        <g transform="translate(300, 70)">
          <rect x="-50" y="-18" width="100" height="36" rx="10" fill="#14532D" stroke="#4ADE80" strokeWidth="1.5" />
          <text x="0" y="4" fill="#DCFCE7" fontSize="10" fontWeight="bold" textAnchor="middle">Innowacja: 98%</text>
        </g>

        <g transform="translate(290, 180)">
          <rect x="-50" y="-18" width="100" height="36" rx="10" fill="#1E1B4B" stroke="#818CF8" strokeWidth="1.5" />
          <text x="0" y="4" fill="#E0E7FF" fontSize="10" fontWeight="bold" textAnchor="middle">Karta Usługi</text>
        </g>

        {/* Pływające cząsteczki wiedzy */}
        <circle cx="130" cy="85" r="3" fill="#E9D5FF" className="animate-ping" style={{ animationDuration: '3s' }} />
        <circle cx="230" cy="90" r="3" fill="#86EFAC" className="animate-ping" style={{ animationDuration: '2.6s', animationDelay: '1s' }} />
        <circle cx="235" cy="155" r="3" fill="#A5B4FC" className="animate-ping" style={{ animationDuration: '3.2s', animationDelay: '0.5s' }} />
      </svg>
    </div>
  );
}

function GraphicMiddleman() {
  return (
    <div className="relative w-full h-full flex items-center justify-center p-4 select-none overflow-hidden">
      <svg
        viewBox="0 0 360 240"
        className="w-full h-full max-h-56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Animowana transformacja innowacji społecznej w gotowy standard usługi CUS"
      >
        <defs>
          <linearGradient id="gearGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>

        {/* Koło zębate 1 (duże po lewej) */}
        <g transform="translate(130, 120)" className="animate-spin" style={{ animationDuration: '14s' }}>
          <circle r="36" fill="url(#gearGrad)" fillOpacity="0.2" stroke="#10B981" strokeWidth="2.5" />
          <circle r="14" fill="#064E3B" stroke="#10B981" strokeWidth="2" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <rect
              key={deg}
              x="-4"
              y="-44"
              width="8"
              height="10"
              rx="2"
              fill="#10B981"
              transform={`rotate(${deg})`}
            />
          ))}
        </g>

        {/* Koło zębate 2 (mniejsze po prawej, przeciwbieżne) */}
        <g transform="translate(195, 85)" className="animate-spin" style={{ animationDuration: '10s', animationDirection: 'reverse' }}>
          <circle r="26" fill="url(#gearGrad)" fillOpacity="0.25" stroke="#34D399" strokeWidth="2" />
          <circle r="9" fill="#064E3B" stroke="#34D399" strokeWidth="1.5" />
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <rect
              key={deg}
              x="-3"
              y="-32"
              width="6"
              height="8"
              rx="1.5"
              fill="#34D399"
              transform={`rotate(${deg})`}
            />
          ))}
        </g>

        {/* Żarówka z pomysłem po lewej */}
        <g transform="translate(45, 120)">
          <rect x="-35" y="-45" width="70" height="90" rx="14" fill="#1C1917" stroke="#F59E0B" strokeWidth="2" />
          <circle cx="0" cy="-12" r="14" fill="#F59E0B" fillOpacity="0.3" className="animate-pulse" />
          <path d="M-8,-12 C-8,-18 8,-18 8,-12 C8,-6 4,-4 4,0 L-4,0 C-4,-4 -8,-6 -8,-12 Z" fill="#FBBF24" />
          <rect x="-4" y="2" width="8" height="4" fill="#D97706" rx="1" />
          <text x="0" y="28" fill="#FBBF24" fontSize="9" fontWeight="bold" textAnchor="middle">INNOWACJA</text>
        </g>

        {/* Strzałka transformacji */}
        <path d="M225,120 L245,120 M240,113 L248,120 L240,127" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {/* Gotowa Karta Usługi CUS po prawej */}
        <g transform="translate(295, 120)">
          <rect x="-40" y="-55" width="80" height="110" rx="10" fill="#064E3B" stroke="#34D399" strokeWidth="2" />
          {/* Linie dokumentu */}
          <line x1="-28" y1="-35" x2="20" y2="-35" stroke="#A7F3D0" strokeWidth="3" strokeLinecap="round" />
          <line x1="-28" y1="-22" x2="10" y2="-22" stroke="#6EE7B7" strokeWidth="2" strokeLinecap="round" />
          <line x1="-28" y1="-12" x2="22" y2="-12" stroke="#6EE7B7" strokeWidth="2" strokeLinecap="round" />
          <line x1="-28" y1="-2" x2="5" y2="-2" stroke="#6EE7B7" strokeWidth="2" strokeLinecap="round" />

          {/* Znaczniki akceptacji (checkmarks) */}
          <circle cx="-18" cy="18" r="6" fill="#10B981" />
          <path d="M-21,18 L-19,20 L-15,16" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

          <circle cx="3" cy="18" r="6" fill="#10B981" />
          <path d="M0,18 L2,20 L6,16" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Pieczęć CUS */}
          <rect x="-30" y="32" width="60" height="16" rx="4" fill="#047857" stroke="#6EE7B7" strokeWidth="1" />
          <text x="0" y="43" fill="#D1FAE5" fontSize="7.5" fontWeight="bold" textAnchor="middle">STANDARD CUS</text>
        </g>
      </svg>
    </div>
  );
}

function GraphicGrants() {
  return (
    <div className="relative w-full h-full flex items-center justify-center p-4 select-none overflow-hidden">
      <svg
        viewBox="0 0 360 240"
        className="w-full h-full max-h-56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Animowany generator wniosków grantowych z dokumentem PDF i startującą rakietą"
      >
        <defs>
          <linearGradient id="grantGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
        </defs>

        {/* Dokument aplikacyjny A4 w centrum */}
        <g transform="translate(130, 115)">
          <rect x="-55" y="-75" width="110" height="150" rx="12" fill="#1E1E24" stroke="#F59E0B" strokeWidth="2.5" />
          {/* Zagięty róg */}
          <path d="M35,-75 L55,-55 L35,-55 Z" fill="#D97706" />

          {/* Nagłówek wniosku */}
          <rect x="-40" y="-60" width="60" height="8" rx="3" fill="#FCD34D" />
          <rect x="-40" y="-45" width="80" height="4" rx="2" fill="#78716C" />
          <rect x="-40" y="-35" width="70" height="4" rx="2" fill="#78716C" />
          <rect x="-40" y="-25" width="75" height="4" rx="2" fill="#78716C" />

          {/* Sekcja budżetu z ramką */}
          <rect x="-42" y="-12" width="84" height="34" rx="6" fill="#292524" stroke="#F59E0B" strokeWidth="1" strokeDasharray="3 3" />
          <text x="-32" y="0" fill="#FDE68A" fontSize="8" fontWeight="bold">Dofinansowanie: 100 000 zł</text>
          <text x="-32" y="14" fill="#A8A29E" fontSize="7">Wkład własny: 0% (EFS+)</text>

          {/* Podpis z animowanym piórem */}
          <path d="M-30,42 Q-15,35 0,42 T20,38 T35,44" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" className="animate-pulse" />
          <text x="-40" y="56" fill="#78716C" fontSize="7">Podpis elektroniczny PAdES</text>

          {/* Pływający laser skanujący dokument */}
          <line x1="-50" y1="-70" x2="50" y2="-70" stroke="#FBBF24" strokeWidth="2" strokeOpacity="0.8">
            <animate attributeName="y1" values="-70;65;-70" dur="3s" repeatCount="indefinite" />
            <animate attributeName="y2" values="-70;65;-70" dur="3s" repeatCount="indefinite" />
          </line>
        </g>

        {/* Startująca rakieta / pędzący samolot papierowy po prawej */}
        <g transform="translate(275, 100)">
          {/* Smuga ognia / gwiazd */}
          <path d="M-25,35 L-45,65 M-10,35 L-20,70" stroke="#F59E0B" strokeWidth="2" strokeDasharray="3 3" className="animate-pulse" />
          <polygon points="0,-35 22,25 0,15 -22,25" fill="#F59E0B" stroke="#FDE68A" strokeWidth="2" />
          <circle cx="0" cy="-5" r="5" fill="#1C1917" stroke="#FDE68A" strokeWidth="1.5" />
          <text x="0" y="45" fill="#FDE68A" fontSize="9" fontWeight="bold" textAnchor="middle">GRANT 2024</text>
        </g>

        {/* Cząsteczki / Monety */}
        <circle cx="50" cy="80" r="14" fill="#F59E0B" fillOpacity="0.2" stroke="#F59E0B" strokeWidth="1.5" className="animate-bounce" style={{ animationDuration: '2.5s' }} />
        <text x="50" y="84" fill="#FDE68A" fontSize="11" fontWeight="bold" textAnchor="middle">zł</text>

        <circle cx="65" cy="160" r="12" fill="#F59E0B" fillOpacity="0.2" stroke="#F59E0B" strokeWidth="1.5" className="animate-bounce" style={{ animationDuration: '3s', animationDelay: '0.4s' }} />
        <text x="65" y="164" fill="#FDE68A" fontSize="10" fontWeight="bold" textAnchor="middle">PDF</text>
      </svg>
    </div>
  );
}

function GraphicAccessibility() {
  return (
    <div className="relative w-full h-full flex items-center justify-center p-4 select-none overflow-hidden">
      <svg
        viewBox="0 0 360 240"
        className="w-full h-full max-h-56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Animacja dostępności cyfrowej WCAG 2.2: kontrast, audio, powiększanie fontu i nawigacja klawiaturą"
      >
        <defs>
          <linearGradient id="wcagGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#F43F5E" />
          </linearGradient>
        </defs>

        {/* Lewa strona: Ramka wysokiego kontrastu (czarno-żółta) */}
        <g transform="translate(85, 115)">
          <rect x="-65" y="-60" width="130" height="120" rx="14" fill="#000000" stroke="#FACC15" strokeWidth="3" />
          <text x="0" y="-32" fill="#FACC15" fontSize="11" fontWeight="bold" textAnchor="middle">KONTRAST AAA</text>

          {/* Przycisk o wysokim kontraście */}
          <rect x="-50" y="-18" width="100" height="30" rx="8" fill="#000000" stroke="#FACC15" strokeWidth="2.5" />
          <text x="0" y="1" fill="#FACC15" fontSize="10" fontWeight="bold" textAnchor="middle">FOKUS TAB</text>

          {/* Ramka focus visible */}
          <rect x="-55" y="-23" width="110" height="40" rx="12" fill="none" stroke="#FACC15" strokeWidth="2" strokeDasharray="4 4" className="animate-pulse" />

          {/* Skalowanie czcionki A -> A+ -> A++ */}
          <g transform="translate(0, 38)">
            <text x="-32" y="0" fill="#FFFFFF" fontSize="10" fontWeight="bold">A</text>
            <text x="-5" y="0" fill="#FACC15" fontSize="14" fontWeight="bold">A+</text>
            <text x="22" y="0" fill="#FACC15" fontSize="18" fontWeight="black">A++</text>
          </g>
        </g>

        {/* Prawa strona: Korektor fal dźwiękowych (syntezator / audio feedback) */}
        <g transform="translate(260, 115)">
          <rect x="-65" y="-60" width="130" height="120" rx="14" fill="#1E1E24" stroke="#EC4899" strokeWidth="2" />
          <text x="0" y="-35" fill="#F472B6" fontSize="11" fontWeight="bold" textAnchor="middle">AUDIO & SYNTEZA</text>

          {/* Skaczące słupki dźwięku */}
          {[-40, -25, -10, 5, 20, 35].map((xPos, idx) => (
            <rect
              key={idx}
              x={xPos}
              y={-10}
              width="8"
              height="35"
              rx="4"
              fill="url(#wcagGrad)"
              className="animate-pulse"
              style={{ animationDuration: `${1 + (idx % 3) * 0.4}s`, animationDelay: `${idx * 0.15}s` }}
            />
          ))}

          {/* Fale dźwiękowe rozchodzące się na boki */}
          <path d="M-25,32 Q0,20 25,32 T50,32" stroke="#FB7185" strokeWidth="2" strokeLinecap="round" fill="none" className="animate-pulse" />
          <text x="0" y="48" fill="#9CA3AF" fontSize="8" textAnchor="middle">Czytniki ekranu NVDA/JAWS</text>
        </g>

        {/* Połączenie centralne z odznaką WCAG 2.2 */}
        <circle cx="172" cy="115" r="24" fill="#831843" stroke="#F43F5E" strokeWidth="2" />
        <CheckCircle2 className="w-6 h-6 text-white" />
        <text x="172" y="119" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle">WCAG</text>
        <text x="172" y="152" fill="#F43F5E" fontSize="9" fontWeight="bold" textAnchor="middle">2.2 AA/AAA</text>
      </svg>
    </div>
  );
}

/* =========================================================================
   GŁÓWNY KOMPONENT SAMOUCZKA (MODAL WALKTHROUGH)
   ========================================================================= */

export const PlatformTutorialModal: React.FC = () => {
  const router = useRouter();
  const { isTutorialOpen, closeTutorial, isSoundEnabled } = useApp();
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);

  const step = TUTORIAL_STEPS[currentStepIdx];
  const isFirst = currentStepIdx === 0;
  const isLast = currentStepIdx === TUTORIAL_STEPS.length - 1;

  // Obsługa klawiszy klawiatury (ESC, strzałki)
  useEffect(() => {
    if (!isTutorialOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeTutorial();
      } else if (e.key === 'ArrowRight' && !isLast) {
        handleNext();
      } else if (e.key === 'ArrowLeft' && !isFirst) {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTutorialOpen, currentStepIdx, isLast, isFirst]);

  if (!isTutorialOpen) return null;

  const playStepSound = () => {
    if (!isSoundEnabled || typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520 + currentStepIdx * 60, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.16);
    } catch (e) {
      // Audio fallback silent
    }
  };

  const handleNext = () => {
    if (!isLast) {
      setCurrentStepIdx((prev) => prev + 1);
      playStepSound();
    } else {
      closeTutorial();
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentStepIdx((prev) => prev - 1);
      playStepSound();
    }
  };

  const handleNavigateToFeature = () => {
    closeTutorial();
    router.push(step.targetUrl);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-dialog-title"
      aria-describedby="tutorial-dialog-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-4xl bg-white dark:bg-[#1C1E23] rounded-3xl border border-stone-200/90 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pasek górny: Numer kroku, wskaźniki i przycisk zamknięcia */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200/80 dark:border-white/10 bg-stone-50/70 dark:bg-[#24272F]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-stone-900 text-white dark:bg-white dark:text-stone-950 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
              <span>Samouczek MiNNO</span>
            </span>

            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
              Krok {currentStepIdx + 1} z {TUTORIAL_STEPS.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Wskaźniki postępu (kropki) */}
            <div className="hidden sm:flex items-center gap-1.5 mr-2">
              {TUTORIAL_STEPS.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setCurrentStepIdx(idx);
                    playStepSound();
                  }}
                  title={s.title}
                  aria-label={`Przejdź do kroku ${idx + 1}: ${s.title}`}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    idx === currentStepIdx
                      ? 'w-7 bg-stone-900 dark:bg-white'
                      : 'w-2 bg-stone-300 dark:bg-stone-700 hover:bg-stone-400'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={closeTutorial}
              aria-label="Zamknij samouczek"
              className="p-1.5 rounded-xl border border-stone-200/80 dark:border-white/10 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Zawartość główna: Dzielona na dynamiczną animację SVG i opis kroku */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-y-auto">
          {/* Kolumna Lewa: Animowana grafika wektorowa pisana kodem */}
          <div className="md:col-span-6 bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 p-4 sm:p-6 flex flex-col items-center justify-center min-h-[240px] sm:min-h-[290px] relative">
            {currentStepIdx === 0 && <GraphicKnowledge />}
            {currentStepIdx === 1 && <GraphicMatching />}
            {currentStepIdx === 2 && <GraphicMiddleman />}
            {currentStepIdx === 3 && <GraphicGrants />}
            {currentStepIdx === 4 && <GraphicAccessibility />}

            {/* Dolny pasek grafiki z pigułką cechy */}
            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] text-stone-400">
              <span className="font-semibold text-stone-300 bg-white/10 px-2.5 py-0.5 rounded-md backdrop-blur-xs">
                {step.badge}
              </span>
              <span className="text-[10px] opacity-75">Wizualizacja SVG w czasie rzeczywistym</span>
            </div>
          </div>

          {/* Kolumna Prawa: Tytuły, opis, wskazówki i akcje */}
          <div className="md:col-span-6 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                {step.subtitle}
              </div>

              <h2
                id="tutorial-dialog-title"
                className="text-2xl sm:text-3xl font-black text-stone-950 dark:text-white tracking-tight leading-tight"
              >
                {step.title}
              </h2>

              <p
                id="tutorial-dialog-desc"
                className="text-sm sm:text-base text-stone-700 dark:text-stone-300 leading-relaxed font-normal"
              >
                {step.description}
              </p>
            </div>

            {/* Bezpośredni przycisk wypróbowania modułu */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleNavigateToFeature}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-white/10 dark:hover:bg-white/20 text-stone-900 dark:text-white text-xs font-bold transition-all cursor-pointer group border border-stone-200/60 dark:border-white/10"
              >
                <span>{step.targetButtonLabel}</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* Pasek dolny: Przyciski nawigacyjne (Wstecz / Dalej / Zakończ) */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-stone-200/80 dark:border-white/10 bg-stone-50/70 dark:bg-[#24272F]">
          <button
            type="button"
            disabled={isFirst}
            onClick={handlePrev}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-stone-300 dark:border-white/10 text-stone-700 dark:text-stone-300 hover:bg-white dark:hover:bg-white/10 text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            <span>Poprzedni krok</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={closeTutorial}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white transition-colors cursor-pointer"
            >
              Pomiń
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white dark:bg-white dark:text-stone-950 dark:hover:bg-stone-100 text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              <span>{isLast ? 'Zakończ samouczek' : 'Następny krok'}</span>
              {!isLast && <ChevronRight className="w-4 h-4" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
