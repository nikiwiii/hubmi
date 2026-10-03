import rawData from './visualize_data.json';
import { POWIATY_DATA, PowiatItem } from './malopolskaMapData';

export interface RawResearchEntry {
  name: string;
  unit: string;
  description: string;
  years: string[];
  dane_powiaty: Record<string, Record<string, number>>;
}

export type RawResearchData = Record<string, RawResearchEntry>;

export const RAW_NAME_TO_POWIAT_ID: Record<string, string> = {
  'powiat bocheński': 'bochenski',
  'powiat brzeski': 'brzeski',
  'powiat chrzanowski': 'chrzanowski',
  'powiat dąbrowski': 'dabrowski',
  'powiat gorlicki': 'gorlicki',
  'powiat krakowski': 'krakowski',
  'powiat limanowski': 'limanowski',
  'powiat m. Kraków': 'krakow',
  'powiat m. Nowy Sącz': 'nowy-sacz',
  'powiat m. Tarnów': 'tarnow',
  'powiat miechowski': 'miechowski',
  'powiat myślenicki': 'myslenicki',
  'powiat nowosądecki': 'nowosadecki',
  'powiat nowotarski': 'nowotarski',
  'powiat olkuski': 'olkuski',
  'powiat oświęcimski': 'oswiecimski',
  'powiat proszowicki': 'proszowicki',
  'powiat suski': 'suski',
  'powiat tarnowski': 'tarnowski',
  'powiat tatrzański': 'tatrzanski',
  'powiat wadowicki': 'wadowicki',
  'powiat wielicki': 'wielicki'
};

export interface ResearchTheme {
  accent: string;
  chartColor: string;
  chartSecondary: string;
  badgeBg: string;
  badgeText: string;
  cardBorder: string;
  gradient: string;
  colorScale: [string, string, string]; // min, mid, max
}

export interface ResearchInfo {
  id: string;
  key: string;
  titlePl: string;
  titleEn: string;
  unit: string;
  descriptionPl: string;
  descriptionEn: string;
  category: string;
  iconName: 'users' | 'briefcase' | 'banknote' | 'heart' | 'activity';
  years: string[];
  theme: ResearchTheme;
  summary: {
    startYear: string;
    endYear: string;
    startAvg: number;
    endAvg: number;
    deltaAvg: number;
    topCounty: { id: string; name: string; value: number };
    lowCounty: { id: string; name: string; value: number };
  };
}

export interface PowiatYearValue {
  powiatId: string;
  powiatName: string;
  seat: string;
  isCity: boolean;
  subregion: string;
  subregionKey: string;
  value: number;
}

export interface PowiatTimeSeries {
  powiatId: string;
  powiatName: string;
  seat: string;
  isCity: boolean;
  subregion: string;
  subregionKey: string;
  history: { year: string; value: number }[];
  startValue: number;
  endValue: number;
  delta: number;
  deltaPercent: number;
  minValue: number;
  maxValue: number;
  latestRank: number;
}

const RESEARCH_CONFIGS: Record<
  string,
  {
    titlePl: string;
    titleEn: string;
    category: string;
    descriptionPl: string;
    iconName: 'users' | 'briefcase' | 'banknote' | 'heart' | 'activity';
    theme: ResearchTheme;
  }
> = {
  working_age_population: {
    titlePl: 'Ludność w wieku produkcyjnym',
    titleEn: 'Working-age population',
    category: 'Demografia & Rynek Pracy',
    descriptionPl:
      'Udział osób w wieku produkcyjnym w ogólnej populacji (kobiety 18–59 lat, mężczyźni 18–64 lata). Odzwierciedla potencjał gospodarczy i dynamikę starzenia się społeczności.',
    iconName: 'users',
    theme: {
      accent: '#2563EB',
      chartColor: '#2563EB',
      chartSecondary: '#93C5FD',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
      badgeText: 'text-blue-700',
      cardBorder: 'border-blue-100 hover:border-blue-300',
      gradient: 'from-blue-600 to-indigo-700',
      colorScale: ['#EFF6FF', '#60A5FA', '#1E40AF']
    }
  },
  unemployed_longer_than_1_year: {
    titlePl: 'Bezrobotni powyżej 1 roku',
    titleEn: 'Unemployed for more than 1 year',
    category: 'Rynek Pracy & Wykluczenie',
    descriptionPl:
      'Udział osób zarejestrowanych jako bezrobotne przez okres dłuższy niż 12 miesięcy. Kluczowy miernik bezrobocia strukturalnego i stopnia dezaktywizacji zawodowej.',
    iconName: 'briefcase',
    theme: {
      accent: '#D97706',
      chartColor: '#D97706',
      chartSecondary: '#FCD34D',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
      badgeText: 'text-amber-700',
      cardBorder: 'border-amber-100 hover:border-amber-300',
      gradient: 'from-amber-600 to-orange-700',
      colorScale: ['#FFFBEB', '#FBBF24', '#B45309']
    }
  },
  cash_social_assistance_benefits: {
    titlePl: 'Pieniężne świadczenia z pomocy społecznej',
    titleEn: 'Cash social assistance benefits',
    category: 'Wsparcie Społeczne & Świadczenia',
    descriptionPl:
      'Udział świadczeń finansowych w całości przyznanej pomocy społecznej. Wskazuje skalę ubóstwa dochodowego oraz model wsparcia rodzin w kryzysie.',
    iconName: 'banknote',
    theme: {
      accent: '#059669',
      chartColor: '#059669',
      chartSecondary: '#6EE7B7',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      badgeText: 'text-emerald-700',
      cardBorder: 'border-emerald-100 hover:border-emerald-300',
      gradient: 'from-emerald-600 to-teal-700',
      colorScale: ['#ECFDF5', '#34D399', '#047857']
    }
  },
  foster_families_count: {
    titlePl: 'Liczba rodzin zastępczych',
    titleEn: 'Number of foster families',
    category: 'Piecza Zastępcza & Dziecko',
    descriptionPl:
      'Liczba aktywnych rodzin zastępczych spokrewnionych, niezawodowych i zawodowych. Pokazuje rozwój rodzicielstwa zastępczego i deinstytucjonalizacji opieki nad dziećmi.',
    iconName: 'heart',
    theme: {
      accent: '#7C3AED',
      chartColor: '#7C3AED',
      chartSecondary: '#C4B5FD',
      badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
      badgeText: 'text-purple-700',
      cardBorder: 'border-purple-100 hover:border-purple-300',
      gradient: 'from-purple-600 to-pink-600',
      colorScale: ['#F5F3FF', '#A78BFA', '#5B21B6']
    }
  },
  average_hospital_stay: {
    titlePl: 'Średni czas pobytu w szpitalu',
    titleEn: 'Average hospital stay duration',
    category: 'Ochrona Zdrowia & Lecznictwo',
    descriptionPl:
      'Przeciętna długość pobytu pacjenta na oddziale szpitalnym (w dniach). Wskaźnik efektywności szpitali, natężenia leczenia zabiegowego oraz rotacji łóżek.',
    iconName: 'activity',
    theme: {
      accent: '#E11D48',
      chartColor: '#E11D48',
      chartSecondary: '#FDA4AF',
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
      badgeText: 'text-rose-700',
      cardBorder: 'border-rose-100 hover:border-rose-300',
      gradient: 'from-rose-600 to-red-700',
      colorScale: ['#FFF1F2', '#FB7185', '#BE123C']
    }
  }
};

const typedRawData = rawData as unknown as RawResearchData;

// Pobranie listy wszystkich typów badań
export function getAllResearches(): ResearchInfo[] {
  const keys = Object.keys(typedRawData);

  return keys.map((key) => {
    const raw = typedRawData[key];
    const cfg = RESEARCH_CONFIGS[key] || {
      titlePl: raw.name,
      titleEn: raw.name,
      category: 'Badanie Społeczne',
      descriptionPl: raw.description,
      iconName: 'activity' as const,
      theme: {
        accent: '#2563EB',
        chartColor: '#2563EB',
        chartSecondary: '#93C5FD',
        badgeBg: 'bg-stone-100 text-stone-700 border-stone-200',
        badgeText: 'text-stone-700',
        cardBorder: 'border-stone-200 hover:border-stone-400',
        gradient: 'from-stone-700 to-stone-900',
        colorScale: ['#F5F5F4', '#A8A29E', '#292524']
      }
    };

    const years = raw.years;
    const startYear = years[0];
    const endYear = years[years.length - 1];

    // Oblicz średnie regionalne i skrajne powiaty
    let startSum = 0;
    let endSum = 0;
    let count = 0;

    const endYearValues: { id: string; name: string; value: number }[] = [];

    Object.entries(raw.dane_powiaty).forEach(([pName, yearValues]) => {
      const pid = RAW_NAME_TO_POWIAT_ID[pName];
      const startV = yearValues[startYear] ?? 0;
      const endV = yearValues[endYear] ?? 0;
      startSum += startV;
      endSum += endV;
      count += 1;

      if (pid) {
        const found = POWIATY_DATA.find((p) => p.id === pid);
        endYearValues.push({
          id: pid,
          name: found ? found.name : pName,
          value: endV
        });
      }
    });

    const startAvg = count > 0 ? Number((startSum / count).toFixed(2)) : 0;
    const endAvg = count > 0 ? Number((endSum / count).toFixed(2)) : 0;
    const deltaAvg = Number((endAvg - startAvg).toFixed(2));

    endYearValues.sort((a, b) => b.value - a.value);

    const topCounty = endYearValues[0] || { id: '', name: '', value: 0 };
    const lowCounty = endYearValues[endYearValues.length - 1] || { id: '', name: '', value: 0 };

    return {
      id: key,
      key,
      titlePl: cfg.titlePl,
      titleEn: raw.name,
      unit: raw.unit,
      descriptionPl: cfg.descriptionPl,
      descriptionEn: raw.description,
      category: cfg.category,
      iconName: cfg.iconName,
      years,
      theme: cfg.theme,
      summary: {
        startYear,
        endYear,
        startAvg,
        endAvg,
        deltaAvg,
        topCounty,
        lowCounty
      }
    };
  });
}

// Pobranie konkretnego badania wg ID
export function getResearchById(id: string): ResearchInfo | null {
  const all = getAllResearches();
  return all.find((r) => r.id === id) || null;
}

// Pobranie wartości dla danego roku dla wszystkich powiatów (do mapy i rankingu)
export function getYearPowiatValues(researchId: string, year: string): PowiatYearValue[] {
  const raw = typedRawData[researchId];
  if (!raw) return [];

  const results: PowiatYearValue[] = [];

  POWIATY_DATA.forEach((powiat) => {
    // Odnajdź nazwę w raw data
    const rawKey = Object.keys(RAW_NAME_TO_POWIAT_ID).find(
      (k) => RAW_NAME_TO_POWIAT_ID[k] === powiat.id
    );

    const rawValues = rawKey ? raw.dane_powiaty[rawKey] : undefined;
    const val = rawValues && rawValues[year] !== undefined ? rawValues[year] : 0;

    results.push({
      powiatId: powiat.id,
      powiatName: powiat.name,
      seat: powiat.seat,
      isCity: powiat.isCity,
      subregion: powiat.subregion,
      subregionKey: powiat.subregionKey,
      value: val
    });
  });

  return results;
}

// Pobranie serii czasowej dla każdego powiatu (do wykresów)
export function getAllPowiatTimeSeries(researchId: string): PowiatTimeSeries[] {
  const raw = typedRawData[researchId];
  if (!raw) return [];

  const years = raw.years;
  const lastYear = years[years.length - 1];

  const seriesList = POWIATY_DATA.map((powiat) => {
    const rawKey = Object.keys(RAW_NAME_TO_POWIAT_ID).find(
      (k) => RAW_NAME_TO_POWIAT_ID[k] === powiat.id
    );

    const yearDataMap = rawKey ? raw.dane_powiaty[rawKey] : {};

    const history = years.map((y) => ({
      year: y,
      value: yearDataMap && yearDataMap[y] !== undefined ? yearDataMap[y] : 0
    }));

    const startValue = history[0]?.value ?? 0;
    const endValue = history[history.length - 1]?.value ?? 0;
    const delta = Number((endValue - startValue).toFixed(2));
    const deltaPercent =
      startValue !== 0 ? Number((((endValue - startValue) / startValue) * 100).toFixed(1)) : 0;

    const values = history.map((h) => h.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    return {
      powiatId: powiat.id,
      powiatName: powiat.name,
      seat: powiat.seat,
      isCity: powiat.isCity,
      subregion: powiat.subregion,
      subregionKey: powiat.subregionKey,
      history,
      startValue,
      endValue,
      delta,
      deltaPercent,
      minValue,
      maxValue,
      latestRank: 0
    };
  });

  // Ustal rankingi dla ostatniego roku
  const sorted = [...seriesList].sort((a, b) => b.endValue - a.endValue);
  sorted.forEach((item, idx) => {
    item.latestRank = idx + 1;
  });

  return seriesList;
}

// Pobranie średniej Małopolski jako serii czasowej
export function getRegionalAverageTimeSeries(
  researchId: string
): { year: string; value: number }[] {
  const raw = typedRawData[researchId];
  if (!raw) return [];

  return raw.years.map((year) => {
    let sum = 0;
    let count = 0;
    Object.values(raw.dane_powiaty).forEach((pData) => {
      if (pData[year] !== undefined) {
        sum += pData[year];
        count += 1;
      }
    });
    return {
      year,
      value: count > 0 ? Number((sum / count).toFixed(2)) : 0
    };
  });
}

// Interpolacja koloru dla wartości w przedziale [min, max]
export function interpolateColor(
  value: number,
  min: number,
  max: number,
  colorScale: [string, string, string]
): string {
  if (min === max) return colorScale[1];
  const ratio = Math.max(0, Math.min(1, (value - min) / (max - min)));

  // Pomocniczy parser hex
  const parseHex = (hex: string) => {
    const c = hex.replace('#', '');
    return [
      parseInt(c.substring(0, 2), 16),
      parseInt(c.substring(2, 4), 16),
      parseInt(c.substring(4, 6), 16)
    ];
  };

  let c1: number[];
  let c2: number[];
  let localRatio: number;

  if (ratio < 0.5) {
    c1 = parseHex(colorScale[0]);
    c2 = parseHex(colorScale[1]);
    localRatio = ratio * 2;
  } else {
    c1 = parseHex(colorScale[1]);
    c2 = parseHex(colorScale[2]);
    localRatio = (ratio - 0.5) * 2;
  }

  const r = Math.round(c1[0] + (c2[0] - c1[0]) * localRatio);
  const g = Math.round(c1[1] + (c2[1] - c1[1]) * localRatio);
  const b = Math.round(c1[2] + (c2[2] - c1[2]) * localRatio);

  return `rgb(${r}, ${g}, ${b})`;
}
