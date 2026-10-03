import { KnowledgeResource } from './types';

export const INITIAL_KNOWLEDGE_RESOURCES: KnowledgeResource[] = [
  // 1. WYBRANE WYZWANIA SPOŁECZNE MAŁOPOLSKI (MAPA & DIAGNOZY)
  {
    id: 'res-ch-1',
    title: 'Starzenie się ludności i Srebrna Gospodarka',
    subtitle: 'Wyzwanie demograficzne i opiekuńcze w Małopolsce',
    type: 'challenge',
    categoryLabel: 'Wyzwania Małopolski',
    theme: 'yellow',
    shape: 'donut',
    keyMetric: '23,8%',
    metricLabel: 'mieszkańców Małopolski ma 60 lat lub więcej',
    summary: 'Szybkie tempo zmian demograficznych wymaga przebudowy usług opiekuńczych i aktywizacji osób po 40. i 60. roku życia w małych gminach.',
    content: 'Z danych Małopolskiego Obserwatorium Polityki Społecznej ROPS wynika, że w ciągu najbliższych 10 lat udział osób dojrzałych i starszych w populacji regionu przekroczy 28%. Największym wyzwaniem jest samotność osób starszych na terenach wiejskich oraz niewystarczająca liczba dziennych domów pobytu i opieki wytchnieniowej dla opiekunów. Kluczem są proste innowacje sąsiedzkie i samopomocowe.',
    tags: ['Demografia', 'Seniorzy', 'Sąsiedztwo', 'Opieka'],
    source: 'Mapa Wyzwań Społecznych ROPS Kraków 2025/2026',
    date: '2026-01-20',
    readTime: '4 min czytania',
    statusBadge: 'Kluczowy priorytet regionu'
  },
  {
    id: 'res-ch-2',
    title: 'Dostępność przestrzeni i wykluczenie mobilnościowe',
    subtitle: 'Likwidacja barier architektonicznych i komunikacyjnych',
    type: 'challenge',
    categoryLabel: 'Wyzwania Małopolski',
    theme: 'sage',
    shape: 'v-shape',
    keyMetric: '41%',
    metricLabel: 'obiektów w małych gminach wymaga adaptacji',
    summary: 'Bariery schodowe, brak wind i wykluczenie transportowe uniemożliwiają osobom dojrzałym pełny udział w życiu społecznym.',
    content: 'W wielu małopolskich powiatach podgórskich osoby o ograniczonej sprawności ruchowej mają trudności z dotarciem do przychodni, apteki czy domu kultury. Diagnoza ROPS wskazuje na potrzebę rozwiązań transportu na żądanie (door-to-door) oraz tanich systemów asystenckich integrujących lokalne społeczności.',
    tags: ['Dostępność', 'Transport', 'Infrastruktura', 'Gminy'],
    source: 'Raport Dostępności MOPS / ROPS Kraków',
    date: '2026-02-05',
    readTime: '5 min czytania',
    statusBadge: 'Pilne działanie'
  },
  {
    id: 'res-ch-3',
    title: 'Wsparcie dobrostanu i więzi międzypokoleniowych',
    subtitle: 'Przeciwdziałanie izolacji społecznej',
    type: 'challenge',
    categoryLabel: 'Wyzwania Małopolski',
    theme: 'pink',
    shape: 'diamond',
    keyMetric: '+32%',
    metricLabel: 'wzrost poczucia izolacji w średnich miastach',
    summary: 'Rozpad tradycyjnych więzi sąsiedzkich rodzi potrzebę tworzenia kameralnych miejsc spotkań przy pasjach i rzemiośle.',
    content: 'Osoby po 45. roku życia, zwłaszcza po usamodzielnieniu się dzieci lub przejściu na wcześniejszą emeryturę, często doświadczają poczucia utraty celu i osamotnienia. Innowacje integrujące pokolenia (np. wspólne kawiarnie, warsztaty majsterkowania) przynoszą wymierne korzyści terapeutyczne.',
    tags: ['Relacje', 'Zdrowie psychiczne', 'Aktywność', 'Pasje'],
    source: 'Analizy Społeczne ROPS Kraków',
    date: '2026-02-18',
    readTime: '3 min czytania',
    statusBadge: 'Obszar wsparcia'
  },

  // 2. BIBLIOTEKA SPRAWDZONYCH INNOWACJI SPOŁECZNYCH (WIDEO & MODELE)
  {
    id: 'res-inn-1',
    title: 'Mobilny Asystent Bezpiecznego Domu',
    subtitle: 'Testowana innowacja techniczno-społeczna',
    type: 'innovation',
    categoryLabel: 'Biblioteka Innowacji',
    theme: 'lavender',
    shape: 'cloud',
    summary: 'Mobilny zespół doradców, który w 1 godzinę bezpłatnie adaptuje mieszkanie do potrzeb osoby 40+ i seniora.',
    content: 'Projekt przetestowany w subregionie tarnowskim i krakowskim. Polega na bezpłatnym audycie ergonomicznym: montażu kontrastowych listew antypoślizgowych, oświetlenia z czujnikiem ruchu, uchwytów prysznicowych i usunięciu niebezpiecznych progów. Innowacja redukuje ryzyko upadków w domu o ponad 70%.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    videoDuration: '3:45 min',
    tags: ['Bezpieczeństwo', 'Mieszkanie', 'Innowacja przetestowana'],
    source: 'Małopolski Inkubator Innowacji Społecznych ROPS',
    date: '2026-01-14',
    readTime: 'Wideo + 3 min',
    statusBadge: 'Gotowa do skalowania'
  },
  {
    id: 'res-inn-2',
    title: 'Sąsiedzka Spółdzielnia Sprzętu Rehabilitacyjnego',
    subtitle: 'Model cyrkularny dla lokalnych społeczności',
    type: 'innovation',
    categoryLabel: 'Biblioteka Innowacji',
    theme: 'sage',
    shape: 'v-shape',
    summary: 'Lokalna platforma wypożyczania kul, balkoników, wózków i łóżek bez zbędnej biurokracji.',
    content: 'Zamiast kupować drogi sprzęt na kilka tygodni rekonwalescencji po zabiegu lub urazie, mieszkańcy zgłaszają posiadany, nieużywany sprzęt do wspólnego gminnego magazynu. Sprzęt jest dezynfekowany, sprawdzany technicznie i bezpłatnie udostępniany sąsiadom.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    videoDuration: '4:10 min',
    tags: ['Ekologia', 'Wypożyczalnia', 'Zdrowie', 'Sąsiedzi'],
    source: 'Inkubator Dostępności ROPS Kraków',
    date: '2026-02-12',
    readTime: 'Wideo + 4 min',
    statusBadge: 'Wdrożona w 8 gminach'
  },
  {
    id: 'res-inn-3',
    title: 'Klub Mądrości Życiowej i Wymiany Pasji',
    subtitle: 'Model międzypokoleniowych mikromasterclassów',
    type: 'innovation',
    categoryLabel: 'Biblioteka Innowacji',
    theme: 'lilac',
    shape: 'crescent',
    summary: 'Kameralne spotkania w bibliotekach i domach kultury, gdzie dojrzali mieszkańcy uczą młodzież zanikających zawodów.',
    content: 'Innowacja oparta na godności i docenieniu doświadczenia. Stolarstwo, tapicerstwo, introligatorstwo, renowacja mebli czy tradycyjne przetwórstwo stają się pretekstem do nawiązania głębokich relacji między pokoleniami.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    videoDuration: '5:00 min',
    tags: ['Edukacja', 'Kultura', 'Rzemiosło', 'Integracja'],
    source: 'Włącznik Innowacji Społecznych ROPS',
    date: '2026-02-28',
    readTime: 'Wideo + 3 min',
    statusBadge: 'Nagrodzona innowacja'
  },

  // 3. MATERIAŁY EDUKACYJNE I PODRĘCZNIKI
  {
    id: 'res-edu-1',
    title: 'Podręcznik Innowatora: Od Pomysłu do Grantu',
    subtitle: 'Praktyczny przewodnik po inkubacji w ROPS Kraków',
    type: 'education',
    categoryLabel: 'Materiały Edukacyjne',
    theme: 'cyan',
    shape: 'wave',
    summary: 'Kompleksowy poradnik tłumaczący prostym językiem, jak zgłosić pomysł i otrzymać dofinansowanie na testy.',
    content: 'Poradnik wyjaśnia: (1) Czym różni się innowacja społeczna od zwykłego projektu, (2) Jak precyzyjnie zdefiniować grupę docelową (szczególnie 40+ i osoby starsze), (3) Jak przeprowadzić test prototypu z realnymi użytkownikami i wyciągnąć wnioski bez skomplikowanych narzędzi badawczych.',
    tags: ['Granty', 'Inkubator', 'Podręcznik', 'Poradnik'],
    source: 'Wydawnictwo ROPS Kraków (FERS / EFS+)',
    date: '2026-03-01',
    readTime: '8 min lektury',
    statusBadge: 'Plik PDF / Do pobrania'
  },
  {
    id: 'res-edu-2',
    title: 'Standardy Dostępności dla Osób 40+ i Seniorów',
    subtitle: 'Projektowanie usług i stron internetowych bez barier',
    type: 'education',
    categoryLabel: 'Materiały Edukacyjne',
    theme: 'pink',
    shape: 'diamond',
    summary: 'Praktyczny dekalog prostego języka, czytelnej typografii, dużych pól dotykowych i logiki interfejsu.',
    content: 'Zbiór zasad: unikanie drobnego druku poniżej 16px, wysoki kontrast (WCAG AAA), eliminacja skomplikowanych gestów na ekranach smartfonów, cierpliwe komunikaty błędów bez żargonu programistycznego oraz wsparcie lektora głosowego.',
    tags: ['Dostępność', 'WCAG', 'Ergonomia', 'Projektowanie'],
    source: 'Zespół ds. Dostępności ROPS Kraków',
    date: '2026-03-15',
    readTime: '6 min lektury',
    statusBadge: 'Standard regionalny'
  }
];

const STORAGE_KNOWLEDGE_KEY = 'hubmi_knowledge_v1';

export function getKnowledgeResources(): KnowledgeResource[] {
  if (typeof window === 'undefined') return INITIAL_KNOWLEDGE_RESOURCES;
  try {
    const stored = localStorage.getItem(STORAGE_KNOWLEDGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KNOWLEDGE_KEY, JSON.stringify(INITIAL_KNOWLEDGE_RESOURCES));
      return INITIAL_KNOWLEDGE_RESOURCES;
    }
    return JSON.parse(stored);
  } catch {
    return INITIAL_KNOWLEDGE_RESOURCES;
  }
}
