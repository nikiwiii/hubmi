import rawData from './visualize_data.json';
import {
  KnowledgeRagResponse,
  KnowledgeRagDetectedPowiat,
  KnowledgeRagMatchedReport,
  KnowledgeRagChartData,
  KnowledgeRagMatchedInnovation
} from './types';

const POWIATY_MAPPING_CLIENT: Record<string, { id: string; name: string; display_name: string; is_city: boolean; keywords: string[] }> = {
  krakowski: {
    id: "krakowski",
    name: "powiat krakowski",
    display_name: "Powiat Krakowski",
    is_city: false,
    keywords: ["krakowski", "krakowskim", "krakowskiego", "krakowskie", "powiecie krakowskim", "ziemski krakowski"]
  },
  krakow: {
    id: "krakow",
    name: "powiat m. Kraków",
    display_name: "Kraków (miasto)",
    is_city: true,
    keywords: ["krakow", "kraków", "krakowie", "krakowa", "m. kraków", "miasto kraków"]
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
    keywords: ["tarnów", "tarnowie", "tarnowa", "tarnow", "m. tarnów"]
  },
  tarnowski: {
    id: "tarnowski",
    name: "powiat tarnowski",
    display_name: "Powiat Tarnowski",
    is_city: false,
    keywords: ["tarnowski", "tarnowskim", "tarnowskiego"]
  },
  tatrzanski: {
    id: "tatrzanski",
    name: "powiat tatrzański",
    display_name: "Powiat Tatrzański",
    is_city: false,
    keywords: ["tatrzański", "tatrzanski", "zakopane", "zakopanem", "tatrzańskim"]
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

const FALLBACK_INNOVATIONS: KnowledgeRagMatchedInnovation[] = [
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
];

export function executeClientKnowledgeRag(query: string, preferredPowiatId?: string): KnowledgeRagResponse {
  const qLower = query.toLowerCase();

  // 1. Wykryj powiat
  let detectedPowiat: KnowledgeRagDetectedPowiat = {
    id: "krakowski",
    name: "powiat krakowski",
    display_name: "Powiat Krakowski",
    is_city: false
  };

  if (preferredPowiatId && POWIATY_MAPPING_CLIENT[preferredPowiatId]) {
    detectedPowiat = POWIATY_MAPPING_CLIENT[preferredPowiatId];
  } else {
    for (const [pId, pInfo] of Object.entries(POWIATY_MAPPING_CLIENT)) {
      if (pInfo.keywords.some((kw) => qLower.includes(kw))) {
        detectedPowiat = pInfo;
        break;
      }
    }
  }

  // 2. Określ wskaźniki na podstawie tematu
  const data = rawData as any;
  const isDisability = ["wózk", "wozk", "niepełn", "inwalid", "ruch", "barier", "dostępn"].some((kw) => qLower.includes(kw));

  let indicatorKeys = [
    "severe_disability_share",
    "disability_support_share",
    "total_disability_share",
    "residents_per_social_worker"
  ];

  if (!isDisability) {
    if (["senior", "starsz", "emeryt"].some((kw) => qLower.includes(kw))) {
      indicatorKeys = ["disability_support_share", "average_hospital_stay", "residents_per_social_worker", "cash_social_assistance_benefits"];
    } else if (["prac", "bezroboc"].some((kw) => qLower.includes(kw))) {
      indicatorKeys = ["unemployed_longer_than_1_year", "working_age_population", "cash_social_assistance_benefits"];
    } else if (["zdrow", "szpital"].some((kw) => qLower.includes(kw))) {
      indicatorKeys = ["average_hospital_stay", "cancer_incidence", "pharmacy_availability"];
    } else if (["rodzin", "dziec", "zastępc"].some((kw) => qLower.includes(kw))) {
      indicatorKeys = ["foster_families_count", "care_and_education_centers", "kindergarten_availability"];
    }
  }

  const matchedReports: KnowledgeRagMatchedReport[] = [];

  for (const k of indicatorKeys) {
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
      category: isDisability ? "Niepełnosprawność" : "Polityka Społeczna",
      unit,
      description: ind.description || "",
      latest_year: latestYear,
      latest_value: latestVal,
      first_value: firstVal,
      delta,
      region_avg: regionAvg,
      rank,
      total_powiats: Object.keys(danePowiaty).length || 22,
      reason: isDisability
        ? "Diagnoza sytuacji osób z niepełnosprawnościami oraz ograniczeniami ruchowymi."
        : "Powiązany wskaźnik społeczny dla wybranego obszaru.",
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
    report_id: primaryReport?.id || "disability_support_share",
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

Na podstawie badań **Regionalnego Ośrodka Polityki Społecznej w Krakowie** oraz danych spisowych GUS dla **${detectedPowiat.display_name}**:

${matchedReports.map((r) => `- **${r.title}**: w ${detectedPowiat.display_name} wskaźnik wynosi **${r.latest_value} ${r.unit}** (stan na rok ${r.latest_year}), przy średniej wojewódzkiej **${r.region_avg} ${r.unit}**. Zajmuje to **${r.rank}. miejsce** w Małopolsce (zmiana od ${r.time_series[0]?.year || 'początku okresu'}: ${r.delta > 0 ? '+' : ''}${r.delta} ${r.unit}).`).join('\n')}

#### ♿ Wnioski dla osób poruszających się na wózkach i z niepełnosprawnościami:
1. **Wysokie zapotrzebowanie na usługi asystenckie**: Wskaźnik pomocy z powodu niepełnosprawności w **${detectedPowiat.display_name}** wynosi **${pVal} ${pUnit}** (średnia regionu: ${pAvg} ${pUnit}), co świadczy o istotnej potrzebie wsparcia środowiskowego.
2. **Likwidacja barier architektonicznych**: Szczególnie w gminach wiejskich i podmiejskich powiatu krakowskiego kluczowe jest wdrażanie modułowych ramp (np. Puzzle's Ramp) oraz transportu adaptowanego door-to-door.
3. **Dobre praktyki**: W panelu poniżej wskazano innowacje społeczne ROPS Kraków gotowe do wdrożenia na terenie powiatu.`;

  return {
    success: true,
    query,
    detected_powiat: detectedPowiat,
    detected_topics: isDisability ? ["Niepełnosprawność i Dostępność", "Pomoc Społeczna"] : ["Diagnozy Społeczne"],
    ai_synthesis: aiSynthesis,
    primary_report: primaryReport,
    matched_reports: matchedReports,
    chart_data: chartData,
    matched_innovations: FALLBACK_INNOVATIONS,
    matched_expert: {
      name: "inż. Paweł Zieliński",
      title: "Koordynator Dostępności i Likwidacji Barier",
      department: "Ośrodek Dostępności Przestrzennej ROPS Kraków",
      specialization: "Likwidacja barier architektonicznych, audyty dostępności, innowacje transportowe dla osób na wózkach",
      chat_topic: "Dostępność i wózki w powiecie krakowskim",
      chat_url: "/chat?topic=Dostepnosc-i-wozki-powiat-krakowski"
    }
  };
}
