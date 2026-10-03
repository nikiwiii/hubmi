import rawData from './visualize_data.json';
import {
  KnowledgeRagResponse,
  KnowledgeRagDetectedPowiat,
  KnowledgeRagMatchedReport,
  KnowledgeRagChartData,
  KnowledgeRagMatchedInnovation,
  MatchedExpert
} from './types';

const POWIATY_MAPPING_CLIENT: Record<string, { id: string; name: string; display_name: string; is_city: boolean; keywords: string[] }> = {
  krakowski: {
    id: "krakowski",
    name: "powiat krakowski",
    display_name: "Powiat Krakowski",
    is_city: false,
    keywords: ["krakowski", "krakowskim", "krakowskiego", "krakowskie", "powiecie krakowskim", "powiatu krakowskiego", "ziemski krakowski"]
  },
  krakow: {
    id: "krakow",
    name: "powiat m. Kraków",
    display_name: "Kraków (miasto)",
    is_city: true,
    keywords: ["krakow", "kraków", "krakowie", "krakowa", "m. kraków", "miasto kraków", "w krakowie"]
  },
  bochenski: {
    id: "bochenski",
    name: "powiat bocheński",
    display_name: "Powiat Bocheński",
    is_city: false,
    keywords: ["bocheński", "bochenski", "bochnia", "bochni", "bocheńskim"]
  },
  brzeski: {
    id: "brzeski",
    name: "powiat brzeski",
    display_name: "Powiat Brzeski",
    is_city: false,
    keywords: ["brzeski", "brzesku", "brzeskim", "brzesko"]
  },
  chrzanowski: {
    id: "chrzanowski",
    name: "powiat chrzanowski",
    display_name: "Powiat Chrzanowski",
    is_city: false,
    keywords: ["chrzanowski", "chrzanowie", "chrzanowskim", "chrzanów"]
  },
  dabrowski: {
    id: "dabrowski",
    name: "powiat dąbrowski",
    display_name: "Powiat Dąbrowski",
    is_city: false,
    keywords: ["dąbrowski", "dabrowski", "dąbrowie", "dabrowskim", "dąbrowa tarnowska"]
  },
  gorlicki: {
    id: "gorlicki",
    name: "powiat gorlicki",
    display_name: "Powiat Gorlicki",
    is_city: false,
    keywords: ["gorlicki", "gorlicach", "gorlickim", "gorlice"]
  },
  limanowski: {
    id: "limanowski",
    name: "powiat limanowski",
    display_name: "Powiat Limanowski",
    is_city: false,
    keywords: ["limanowski", "limanowej", "limanowskim", "limanowa"]
  },
  "nowy-sacz": {
    id: "nowy-sacz",
    name: "powiat m. Nowy Sącz",
    display_name: "Nowy Sącz (miasto)",
    is_city: true,
    keywords: ["nowy sącz", "nowym sączu", "nowego sącza", "nowy sacz", "m. nowy sącz"]
  },
  nowosadecki: {
    id: "nowosadecki",
    name: "powiat nowosądecki",
    display_name: "Powiat Nowosądecki",
    is_city: false,
    keywords: ["nowosądecki", "nowosadecki", "nowosądeckim"]
  },
  nowotarski: {
    id: "nowotarski",
    name: "powiat nowotarski",
    display_name: "Powiat Nowotarski",
    is_city: false,
    keywords: ["nowotarski", "nowym targu", "nowotarskim", "nowy targ"]
  },
  miechowski: {
    id: "miechowski",
    name: "powiat miechowski",
    display_name: "Powiat Miechowski",
    is_city: false,
    keywords: ["miechowski", "miechowie", "miechowskim", "miechów"]
  },
  myslenicki: {
    id: "myslenicki",
    name: "powiat myślenicki",
    display_name: "Powiat Myślenicki",
    is_city: false,
    keywords: ["myślenicki", "myslenicki", "myślenicach", "myślenickim", "myślenice"]
  },
  olkuski: {
    id: "olkuski",
    name: "powiat olkuski",
    display_name: "Powiat Olkuski",
    is_city: false,
    keywords: ["olkuski", "olkuszu", "olkuskim", "olkusz"]
  },
  oswiecimski: {
    id: "oswiecimski",
    name: "powiat oświęcimski",
    display_name: "Powiat Oświęcimski",
    is_city: false,
    keywords: ["oświęcimski", "oswiecimski", "oświęcimiu", "oświęcimskim", "oświęcim"]
  },
  proszowicki: {
    id: "proszowicki",
    name: "powiat proszowicki",
    display_name: "Powiat Proszowicki",
    is_city: false,
    keywords: ["proszowicki", "proszowicach", "proszowickim", "proszowice"]
  },
  suski: {
    id: "suski",
    name: "powiat suski",
    display_name: "Powiat Suski",
    is_city: false,
    keywords: ["suski", "suskim", "sucha beskidzka"]
  },
  tarnow: {
    id: "tarnow",
    name: "powiat m. Tarnów",
    display_name: "Tarnów (miasto)",
    is_city: true,
    keywords: ["tarnów", "tarnowie", "tarnowa", "tarnow", "m. tarnów", "w tarnowie"]
  },
  tarnowski: {
    id: "tarnowski",
    name: "powiat tarnowski",
    display_name: "Powiat Tarnowski",
    is_city: false,
    keywords: ["tarnowski", "tarnowskim", "tarnowskiego", "powiecie tarnowskim"]
  },
  tatrzanski: {
    id: "tatrzanski",
    name: "powiat tatrzański",
    display_name: "Powiat Tatrzański",
    is_city: false,
    keywords: ["tatrzański", "tatrzanski", "zakopane", "zakopanem", "tatrzańskim", "podhale"]
  },
  wadowicki: {
    id: "wadowicki",
    name: "powiat wadowicki",
    display_name: "Powiat Wadowicki",
    is_city: false,
    keywords: ["wadowicki", "wadowicach", "wadowickim", "wadowice"]
  },
  wielicki: {
    id: "wielicki",
    name: "powiat wielicki",
    display_name: "Powiat Wielicki",
    is_city: false,
    keywords: ["wielicki", "wieliczce", "wielickim", "wieliczka"]
  }
};

interface TopicProfile {
  category: string;
  indicators: string[];
  innovations: KnowledgeRagMatchedInnovation[];
  expert: MatchedExpert;
  conclusionTitle: string;
  points: string[];
}

const TOPIC_PROFILES: Record<string, TopicProfile> = {
  disability: {
    category: "Niepełnosprawność i Dostępność",
    indicators: ["severe_disability_share", "disability_support_share", "total_disability_share", "residents_per_social_worker"],
    innovations: [
      {
        id: "ev-modul-wozki",
        title: "EV moduł do wózków inwalidzkich",
        description: "Modułowy napęd elektryczny montowany do tradycyjnych wózków inwalidzkich, zwiększający samodzielność użytkowników na terenach podmiejskich i górzystych.",
        addressed_problems: "Bariery w przemieszczaniu się, ograniczona mobilność, wykluczenie komunikacyjne.",
        funding_info: "Grant Małopolskiego Inkubatora Innowacji Społecznych ROPS Kraków",
        score: 95
      },
      {
        id: "puzzles-ramp",
        title: "Puzzle's Ramp - Modułowe rampy podjazdowe",
        description: "Lekkie i adaptowalne segmentowe podjazdy dla osób na wózkach inwalidzkich do szybkiego niwelowania progów i schodów w budynkach użyteczności publicznej.",
        addressed_problems: "Bariery architektoniczne, niedostępne wejścia do urzędów i przychodni.",
        funding_info: "Dofinansowanie ze środków PFRON i funduszy regionalnych",
        score: 90
      },
      {
        id: "zakupy-na-jednym-wozku",
        title: "Zakupy na jednym wózku z dzieckiem z niepełnosprawnością ruchową",
        description: "System zintegrowanych koszy i mocowań sklepowych ułatwiający codzienne zakupy opiekunom osób i dzieci poruszających się na wózkach.",
        addressed_problems: "Codzienne trudności w załatwianiu spraw życiowych, brak ergonomicznych rozwiązań w przestrzeniach handlowych.",
        funding_info: "Program Innowacji Społecznych ROPS Kraków",
        score: 85
      },
      {
        id: "dostepny-transport",
        title: "Dostępny transport publiczny i door-to-door",
        description: "Model organizacji lokalnych przewozów na żądanie dla mieszkańców z ograniczeniami ruchowymi i osób na wózkach w gminach wiejsko-miejskich.",
        addressed_problems: "Brak dostosowanego transportu zbiorowego w mniejszych miejscowościach powiatu.",
        funding_info: "Środki samorządowe i programy wyrównywania różnic regionalnych",
        score: 80
      }
    ],
    expert: {
      name: "inż. Paweł Zieliński",
      title: "Koordynator Dostępności i Likwidacji Barier",
      department: "Ośrodek Dostępności Przestrzennej ROPS Kraków",
      specialization: "Likwidacja barier architektonicznych, audyty dostępności, innowacje transportowe dla osób na wózkach",
      chat_topic: "Dostępność i wózki inwalidzkie",
      chat_url: "/chat?topic=Dostepnosc-i-likwidacja-barier"
    },
    conclusionTitle: "Wnioski w zakresie niepełnosprawności i likwidacji barier",
    points: [
      "Wysoki odsetek osób ze znacznym stopniem niepełnosprawności wymaga rozwoju usług asystenckich oraz opieki wytchnieniowej dla rodzin.",
      "Kluczowym wyzwaniem w gminach powiatu pozostają bariery w transporcie publicznym i brak modułowych podjazdów do placówek publicznych.",
      "Zaleca się replikację innowacji ROPS Kraków z zakresu transportu door-to-door oraz adaptacji wózków inwalidzkich."
    ]
  },
  work: {
    category: "Rynek Pracy i Aktywizacja",
    indicators: ["unemployed_longer_than_1_year", "working_age_population", "cash_social_assistance_benefits", "municipal_budget_expenditures"],
    innovations: [
      {
        id: "niewypaleni",
        title: "NIEwypaleni - powrót do aktywności zawodowej",
        description: "Program mentoringu i przeciwdziałania wypaleniu oraz długotrwałej bierności zawodowej w społecznościach lokalnych.",
        addressed_problems: "Dezaktywizacja zawodowa, utrata motywacji, wykluczenie z rynku pracy.",
        funding_info: "Europejski Fundusz Społeczny / ROPS Kraków",
        score: 94
      },
      {
        id: "drogowskazy-ajkum",
        title: "Drogowskazy AJKUM",
        description: "Narzędzie doradztwa zawodowego i ścieżek edukacyjnych dla osób poszukujących nowych kwalifikacji w małych ośrodkach.",
        addressed_problems: "Niedopasowanie kompetencji do lokalnego rynku pracy.",
        funding_info: "Granty innowacji społecznych Małopolski",
        score: 88
      },
      {
        id: "moduly-niezaleznosci",
        title: "Moduły niezależności",
        description: "Treningi samodzielności ekonomicznej i przedsiębiorczości społecznej dla osób zagrożonych ubóstwem.",
        addressed_problems: "Trwałe uzależnienie od zasiłków pomocy społecznej.",
        funding_info: "Środki regionalne polityki społecznej",
        score: 82
      }
    ],
    expert: {
      name: "mgr Tomasz Lewandowski",
      title: "Konsultant ds. Ekonomii Społecznej i Pracy",
      department: "Małopolskie Obserwatorium Polityki Społecznej",
      specialization: "Centra integracji społecznej, spółdzielnie socjalne, zatrudnienie wspierane",
      chat_topic: "Rynek pracy i ekonomia społeczna",
      chat_url: "/chat?topic=Rynek-pracy-i-aktywizacja"
    },
    conclusionTitle: "Wnioski w zakresie rynku pracy i zatrudnienia",
    points: [
      "Wskaźnik długotrwałego bezrobocia wskazuje na potrzebę ukierunkowanych programów reintegracji zawodowej i podnoszenia kwalifikacji.",
      "Istotne jest łączenie świadczeń socjalnych z kontraktami socjalnymi i stażami w podmiotach ekonomii społecznej.",
      "Rekomendowane jest tworzenie lokalnych spółdzielni socjalnych i centrów integracji społecznej."
    ]
  },
  seniors: {
    category: "Seniorzy i Polityka Senioralna",
    indicators: ["disability_support_share", "average_hospital_stay", "residents_per_social_worker", "cash_social_assistance_benefits"],
    innovations: [
      {
        id: "inteligentny-organizer",
        title: "Inteligentny organizer do leków",
        description: "Automatyczny dyspenser leków z powiadomieniami głosowymi i SMS dla samotnych seniorów.",
        addressed_problems: "Pomyłki w zażywaniu leków, brak codziennego nadzoru opiekuńczego.",
        funding_info: "Innowacje Senioralne ROPS Kraków",
        score: 92
      },
      {
        id: "to-nie-koniec-swiata",
        title: "To nie koniec świata - to początek świata",
        description: "Model klubów integracji międzypokoleniowej i aktywizacji osób w wieku poprodukcyjnym.",
        addressed_problems: "Samotność i izolacja osób starszych na obszarach wiejskich.",
        funding_info: "Dotacje Województwa Małopolskiego",
        score: 89
      },
      {
        id: "czas-na-aktywnosc",
        title: "Czas na aktywność!",
        description: "Zajęcia ruchowe i rehabilitacyjne organizowane w remizach i świetlicach wiejskich dla seniorów.",
        addressed_problems: "Ograniczony dostęp do rehabilitacji geriatrycznej poza miastami.",
        funding_info: "Regionalne programy zdrowotne",
        score: 84
      }
    ],
    expert: {
      name: "mgr Anna Kowalska",
      title: "Starszy Doradca ds. Usług Społecznych i Senioralnych",
      department: "Dział Rozwoju Usług Społecznych ROPS Kraków",
      specialization: "Opieka wytchnieniowa, integracja seniorów, asystentura osobista",
      chat_topic: "Wsparcie seniorów i usługi opiekuńcze",
      chat_url: "/chat?topic=Seniorzy-i-uslugi-opiekuncze"
    },
    conclusionTitle: "Wnioski w obszarze wsparcia seniorów",
    points: [
      "Starzenie się populacji wymaga rozwijania dziennych domów pobytu i opieki wytchnieniowej dla opiekunów faktycznych.",
      "Wysokie zapotrzebowanie na usługi opiekuńcze w miejscu zamieszkania wymaga wzmocnienia kadr pracowników socjalnych.",
      "Warto wdrażać innowacyjne rozwiązania teleopieki i automatyzacji podawania leków."
    ]
  },
  health: {
    category: "Zdrowie i Opieka Medyczna",
    indicators: ["average_hospital_stay", "cancer_incidence", "pharmacy_availability", "disability_support_share"],
    innovations: [
      {
        id: "telerehabilitacja",
        title: "Telerehabilitacja oddechowa i ruchowa",
        description: "Platforma zdalnego monitorowania i ćwiczeń usprawniających po hospitalizacji bez konieczności dojazdu do szpitala.",
        addressed_problems: "Kolejki do sanatoriów, długie pobyty w szpitalu, utrudniony dojazd z peryferii.",
        funding_info: "Innowacje Zdrowotne ROPS",
        score: 93
      },
      {
        id: "pelnia-zdrowia",
        title: "Pełnia zdrowia - mobilne punkty profilaktyki",
        description: "Cykl badań przesiewowych i wczesnego wykrywania chorób onkologicznych w małych gminach.",
        addressed_problems: "Niska zgłaszalność na badania profilaktyczne, wysoka zachorowalność.",
        funding_info: "Środki regionalne ochrony zdrowia",
        score: 87
      }
    ],
    expert: {
      name: "mgr Michał Wiśniewski",
      title: "Konsultant ds. Mobilności i Usług Wiejskich",
      department: "Dział Innowacji Regionalnych ROPS Kraków",
      specialization: "Dostępność placówek zdrowotnych, transport chorych na badania",
      chat_topic: "Zdrowie i profilaktyka",
      chat_url: "/chat?topic=Zdrowie-i-profilaktyka"
    },
    conclusionTitle: "Wnioski w zakresie ochrony zdrowia",
    points: [
      "Dłuższy średni pobyt w szpitalu wskazuje na potrzebę rozbudowy bazy opieki poszpitalnej i hospicyjnej w powiecie.",
      "Konieczne jest rozwijanie profilaktyki onkologicznej i dostępności aptek całodobowych.",
      "Telemedycyna i mobilne punkty diagnostyczne stanowią skuteczną odpowiedź na nierówności w dostępie do opieki."
    ]
  },
  family: {
    category: "Rodzina i Piecza Zastępcza",
    indicators: ["foster_families_count", "care_and_education_centers", "kindergarten_availability", "large_families_share"],
    innovations: [
      {
        id: "patryk-i-kropka",
        title: "Patryk i Kropka - terapeutyczne wsparcie dzieci w pieczy",
        description: "Metodyka bajkoterapii i wsparcia emocjonalnego dla dzieci w rodzinach zastępczych.",
        addressed_problems: "Trauma rozłąki, trudności adaptacyjne dzieci w pieczy zastępczej.",
        funding_info: "Fundusz Innowacji Społecznych ROPS",
        score: 91
      },
      {
        id: "bawita",
        title: "BaWita - rodzinne kluby wsparcia",
        description: "Przestrzenie integracji rodziców małych dzieci z warsztatami kompetencji wychowawczych.",
        addressed_problems: "Izolacja matek, brak miejsc w przedszkolach i żłobkach.",
        funding_info: "Granty regionalne",
        score: 86
      }
    ],
    expert: {
      name: "mgr Magdalena Wójcik",
      title: "Ekspert ds. Pieczy Zastępczej i Wsparcia Rodzin",
      department: "Zespół Deinstytucjonalizacji Pieczy ROPS Kraków",
      specialization: "Rodzicielstwo zastępcze, wsparcie kryzysowe, placówki opiekuńcze",
      chat_topic: "Wsparcie rodzin i piecza zastępcza",
      chat_url: "/chat?topic=Piecza-zastepcza-i-rodziny"
    },
    conclusionTitle: "Wnioski w zakresie wsparcia rodzin i pieczy",
    points: [
      "Rozwój rodzicielstwa zastępczego pozwala na stopniowe odchodzenie od instytucjonalnych domów dziecka.",
      "Zwiększenie dostępności miejsc w przedszkolach jest kluczowe dla powrotu rodziców na rynek pracy.",
      "Należy wspierać rodziny wielodzietne poprzez lokalne karty rodziny i ulgi samorządowe."
    ]
  }
};

export function executeClientKnowledgeRag(query: string, preferredPowiatId?: string): KnowledgeRagResponse {
  const qLower = query.toLowerCase();

  // 1. NAJPIERW wykryj powiat z treści zapytania
  let detectedPowiat: KnowledgeRagDetectedPowiat = {
    id: "krakowski",
    name: "powiat krakowski",
    display_name: "Powiat Krakowski",
    is_city: false
  };

  let foundInQuery = false;
  // Najpierw specyficzne frazy
  if (qLower.includes("powiat krakow") || qLower.includes("powiecie krakow") || qLower.includes("ziemski krakow")) {
    detectedPowiat = POWIATY_MAPPING_CLIENT["krakowski"];
    foundInQuery = true;
  } else if (qLower.includes("nowy sacz") || qLower.includes("nowym saczu")) {
    detectedPowiat = qLower.includes("powiat nowosad") ? POWIATY_MAPPING_CLIENT["nowosadecki"] : POWIATY_MAPPING_CLIENT["nowy-sacz"];
    foundInQuery = true;
  } else if (qLower.includes("powiat tarnow") || qLower.includes("powiecie tarnow")) {
    detectedPowiat = POWIATY_MAPPING_CLIENT["tarnowski"];
    foundInQuery = true;
  } else {
    for (const [pId, pInfo] of Object.entries(POWIATY_MAPPING_CLIENT)) {
      if (pInfo.keywords.some((kw) => qLower.includes(kw))) {
        detectedPowiat = pInfo;
        foundInQuery = true;
        break;
      }
    }
  }

  // Jeśli w zapytaniu nie ma powiatu, a użytkownik wybrał dropdown, użyj dropdownu
  if (!foundInQuery && preferredPowiatId && POWIATY_MAPPING_CLIENT[preferredPowiatId]) {
    detectedPowiat = POWIATY_MAPPING_CLIENT[preferredPowiatId];
  }

  // 2. Określ tematykę zapytania
  let profile = TOPIC_PROFILES.disability;
  if (["prac", "bezroboc", "zatrudn", "zarob", "ubostw", "staz"].some((kw) => qLower.includes(kw))) {
    profile = TOPIC_PROFILES.work;
  } else if (["senior", "starsz", "emeryt", "starosc"].some((kw) => qLower.includes(kw))) {
    profile = TOPIC_PROFILES.seniors;
  } else if (["szpital", "zdrow", "rak", "nowotwor", "lecz", "aptek"].some((kw) => qLower.includes(kw))) {
    profile = TOPIC_PROFILES.health;
  } else if (["rodzin", "dziec", "zastepc", "piecz", "przedszkol", "wielodziet"].some((kw) => qLower.includes(kw))) {
    profile = TOPIC_PROFILES.family;
  } else if (["wozk", "niepelnosprawn", "inwalid", "ruch", "barier", "dostepn"].some((kw) => qLower.includes(kw))) {
    profile = TOPIC_PROFILES.disability;
  }

  const data = rawData as any;
  const matchedReports: KnowledgeRagMatchedReport[] = [];

  for (const k of profile.indicators) {
    const ind = data[k];
    if (!ind) continue;

    const years: string[] = ind.years || [];
    const unit: string = ind.unit || "%";
    const danePowiaty: Record<string, Record<string, number>> = ind.dane_powiaty || {};
    const powSeries = danePowiaty[detectedPowiat.name] || {};

    const latestYear = years[years.length - 1] || "2024";
    const firstYear = years[0] || "2014";
    const latestVal = powSeries[latestYear] ?? 0;
    const firstVal = powSeries[firstYear] ?? 0;
    const delta = Math.round((latestVal - firstVal) * 100) / 100;

    const allLatest = Object.values(danePowiaty).map((d) => d[latestYear]).filter((v) => typeof v === "number");
    const regionAvg = allLatest.length ? Math.round((allLatest.reduce((a, b) => a + b, 0) / allLatest.length) * 100) / 100 : 0;

    const sortedPowiaty = Object.entries(danePowiaty)
      .map(([name, d]) => ({ name, val: d[latestYear] ?? 0 }))
      .sort((a, b) => b.val - a.val);
    const rank = sortedPowiaty.findIndex((p) => p.name === detectedPowiat.name) + 1 || 1;

    const timeSeries = years.map((y) => ({
      year: y,
      value: powSeries[y] ?? 0
    }));

    matchedReports.push({
      id: k,
      title: ind.name || k,
      category: profile.category,
      unit,
      description: ind.description || "",
      latest_year: latestYear,
      latest_value: latestVal,
      first_value: firstVal,
      delta,
      region_avg: regionAvg,
      rank,
      total_powiats: Object.keys(danePowiaty).length || 22,
      reason: `Diagnoza powiązana z tematem: ${profile.category}`,
      time_series: timeSeries
    });
  }

  const primaryReport = matchedReports.find((r) => r.time_series.length > 1) || matchedReports[0] || null;

  // Chart data
  let trendSeries: { year: string; powiatValue: number; regionAvg: number }[] = [];
  let comparisonBars: { powiatId: string; name: string; value: number }[] = [];

  if (primaryReport) {
    const ind = data[primaryReport.id] || {};
    const years: string[] = ind.years || [];
    const daneP: Record<string, Record<string, number>> = ind.dane_powiaty || {};
    const powSeries = daneP[detectedPowiat.name] || {};

    trendSeries = years.map((y) => {
      const valsY = Object.values(daneP).map((d) => d[y]).filter((v) => typeof v === "number");
      const avgY = valsY.length ? Math.round((valsY.reduce((a, b) => a + b, 0) / valsY.length) * 100) / 100 : 0;
      return {
        year: y,
        powiatValue: powSeries[y] ?? 0,
        regionAvg: avgY
      };
    });

    comparisonBars = Object.entries(daneP)
      .map(([pname, d]) => {
        const val = d[primaryReport.latest_year] ?? 0;
        const mappedId = Object.entries(POWIATY_MAPPING_CLIENT).find(([_, info]) => info.name === pname)?.[0] || pname;
        return {
          powiatId: mappedId,
          name: pname.replace("powiat ", "").replace("m. ", "m. "),
          value: Math.round(val * 100) / 100
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }

  const chartData: KnowledgeRagChartData = {
    report_id: primaryReport?.id || "unemployed_longer_than_1_year",
    report_title: primaryReport?.title || "Diagnoza Społeczna",
    unit: primaryReport?.unit || "%",
    latest_year: primaryReport?.latest_year || "2024",
    trend_series: trendSeries,
    comparison_bars: comparisonBars
  };

  const primary = primaryReport;
  const pVal = primary ? primary.latest_value : 0;
  const pUnit = primary ? primary.unit : "%";
  const pAvg = primary ? primary.region_avg : 0;
  const pRank = primary ? primary.rank : 1;

  const aiSynthesis = `### Diagnoza sytuacji w: ${detectedPowiat.display_name}

Na podstawie badań **Regionalnego Ośrodka Polityki Społecznej w Krakowie** oraz oficjalnych danych statystycznych dla **${detectedPowiat.display_name}**:

${matchedReports.map((r) => `- **${r.title}**: w ${detectedPowiat.display_name} wynosi **${r.latest_value} ${r.unit}** (rok ${r.latest_year}), przy średniej regionalnej **${r.region_avg} ${r.unit}**. Zajmuje to **${r.rank}. miejsce** w Małopolsce (zmiana: ${r.delta > 0 ? '+' : ''}${r.delta} ${r.unit}).`).join('\n')}

#### 🔍 ${profile.conclusionTitle}:
${profile.points.map((p, idx) => `${idx + 1}. **${p.split(' ')[0]}**: ${p}`).join('\n')}
Wskaźnik wiodący (*${primary?.title}*) w **${detectedPowiat.display_name}** wynosi **${pVal} ${pUnit}** (średnia Małopolski: **${pAvg} ${pUnit}**), co plasuje powiat na **${pRank}. pozycji** w województwie.`;

  return {
    success: true,
    query,
    detected_powiat: detectedPowiat,
    detected_topics: [profile.category],
    ai_synthesis: aiSynthesis,
    primary_report: primaryReport,
    matched_reports: matchedReports,
    chart_data: chartData,
    matched_innovations: profile.innovations,
    matched_expert: profile.expert
  };
}
