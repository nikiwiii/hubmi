import { useState, useEffect } from 'react';
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
  pastelBg: string;
  border: string;
  text: string;
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
    unitPl?: string;
    category: string;
    descriptionPl: string;
    iconName: 'users' | 'briefcase' | 'banknote' | 'heart' | 'activity';
    theme: ResearchTheme;
  }
> = {
  working_age_population: {
    titlePl: 'Ludność w wieku produkcyjnym',
    titleEn: 'Working-age population',
    unitPl: '%',
    category: 'Demografia',
    descriptionPl:
      'Udział osób w wieku produkcyjnym w ogólnej populacji. Odzwierciedla potencjał gospodarczy i dynamikę demograficzną regionu.',
    iconName: 'users',
    theme: {
      accent: '#698B99',
      chartColor: '#698B99',
      chartSecondary: '#CEE0E6',
      badgeBg: 'bg-[#CEE0E6] text-[#1A282E] border-[#B9D2DB]',
      badgeText: 'text-[#1A282E]',
      cardBorder: 'border-[#B9D2DB] hover:border-[#698B99]',
      gradient: 'from-[#698B99] to-[#4D6F7C]',
      colorScale: ['#EAF3F6', '#87A6B4', '#3E5D6B'],
      pastelBg: '#CEE0E6',
      border: '#B9D2DB',
      text: '#1A282E'
    }
  },
  unemployed_longer_than_1_year: {
    titlePl: 'Bezrobotni powyżej 1 roku',
    titleEn: 'Unemployed for more than 1 year',
    unitPl: '%',
    category: 'Rynek Pracy',
    descriptionPl:
      'Udział osób bezrobotnych powyżej 12 miesięcy. Miernik bezrobocia długotrwałego i dezaktywizacji zawodowej.',
    iconName: 'briefcase',
    theme: {
      accent: '#A6737E',
      chartColor: '#A6737E',
      chartSecondary: '#EAD4D9',
      badgeBg: 'bg-[#EAD4D9] text-[#311E22] border-[#DFC1C8]',
      badgeText: 'text-[#311E22]',
      cardBorder: 'border-[#DFC1C8] hover:border-[#A6737E]',
      gradient: 'from-[#A6737E] to-[#8A5661]',
      colorScale: ['#F8ECEF', '#C4919C', '#6E3C47'],
      pastelBg: '#EAD4D9',
      border: '#DFC1C8',
      text: '#311E22'
    }
  },
  cash_social_assistance_benefits: {
    titlePl: 'Pieniężne świadczenia z pomocy społecznej',
    titleEn: 'Cash social assistance benefits',
    unitPl: '%',
    category: 'Pomoc Społeczna',
    descriptionPl:
      'Udział świadczeń finansowych w całości pomocy społecznej. Wskazuje skalę bezpośredniego wsparcia dochodowego rodzin.',
    iconName: 'banknote',
    theme: {
      accent: '#B8A663',
      chartColor: '#B8A663',
      chartSecondary: '#EFE5C6',
      badgeBg: 'bg-[#EFE5C6] text-[#2A271E] border-[#DFD3AE]',
      badgeText: 'text-[#2A271E]',
      cardBorder: 'border-[#DFD3AE] hover:border-[#B8A663]',
      gradient: 'from-[#B8A663] to-[#968545]',
      colorScale: ['#FAF3D7', '#D1C083', '#7A6B32'],
      pastelBg: '#EFE5C6',
      border: '#DFD3AE',
      text: '#2A271E'
    }
  },
  foster_families_count: {
    titlePl: 'Liczba rodzin zastępczych',
    titleEn: 'Number of foster families',
    unitPl: 'rodzin',
    category: 'Piecza Zastępcza',
    descriptionPl:
      'Liczba aktywnych rodzin zastępczych. Obrazuje rozwój rodzicielstwa zastępczego i deinstytucjonalizacji opieki.',
    iconName: 'heart',
    theme: {
      accent: '#8E77A3',
      chartColor: '#8E77A3',
      chartSecondary: '#DCD0E6',
      badgeBg: 'bg-[#DCD0E6] text-[#291D33] border-[#CCBCDB]',
      badgeText: 'text-[#291D33]',
      cardBorder: 'border-[#CCBCDB] hover:border-[#8E77A3]',
      gradient: 'from-[#8E77A3] to-[#705A85]',
      colorScale: ['#F3ECF7', '#AB96BF', '#56416A'],
      pastelBg: '#DCD0E6',
      border: '#CCBCDB',
      text: '#291D33'
    }
  },
  average_hospital_stay: {
    titlePl: 'Średni czas pobytu w szpitalu',
    titleEn: 'Average hospital stay duration',
    unitPl: 'dni',
    category: 'Zdrowie',
    descriptionPl:
      'Przeciętna długość pobytu pacjenta na oddziale szpitalnym (w dniach). Wskaźnik rotacji łóżek i modelu leczenia.',
    iconName: 'activity',
    theme: {
      accent: '#7C89B8',
      chartColor: '#7C89B8',
      chartSecondary: '#D2D8EE',
      badgeBg: 'bg-[#D2D8EE] text-[#1D2235] border-[#C1C9E4]',
      badgeText: 'text-[#1D2235]',
      cardBorder: 'border-[#C1C9E4] hover:border-[#7C89B8]',
      gradient: 'from-[#7C89B8] to-[#5E6B99]',
      colorScale: ['#ECF0FA', '#9AA6D1', '#445182'],
      pastelBg: '#D2D8EE',
      border: '#C1C9E4',
      text: '#1D2235'
    }
  },
  urbanization_rate: {
    titlePl: 'Wskaźnik urbanizacji',
    titleEn: 'Urbanization rate',
    unitPl: '%',
    category: 'Demografia',
    descriptionPl:
      'Udział ludności zamieszkującej tereny miejskie w ogólnej populacji powiatu. Miernik rozwoju ośrodków miejskich.',
    iconName: 'users',
    theme: {
      accent: '#5E8B84',
      chartColor: '#5E8B84',
      chartSecondary: '#D1E6E2',
      badgeBg: 'bg-[#D1E6E2] text-[#18332F] border-[#BED6D1]',
      badgeText: 'text-[#18332F]',
      cardBorder: 'border-[#BED6D1] hover:border-[#5E8B84]',
      gradient: 'from-[#5E8B84] to-[#436761]',
      colorScale: ['#EDF6F4', '#8AB5AE', '#32524C'],
      pastelBg: '#D1E6E2',
      border: '#BED6D1',
      text: '#18332F'
    }
  },
  kindergarten_availability: {
    titlePl: 'Dostępność miejsc w przedszkolach',
    titleEn: 'Kindergarten availability',
    unitPl: 'dzieci/miejsce',
    category: 'Edukacja',
    descriptionPl:
      'Liczba dzieci w wieku 3–5 lat przypadająca na 1 miejsce w przedszkolach. Obrazuje dostępność edukacji przedszkolnej.',
    iconName: 'heart',
    theme: {
      accent: '#BF8A52',
      chartColor: '#BF8A52',
      chartSecondary: '#F2E4D2',
      badgeBg: 'bg-[#F2E4D2] text-[#3B2610] border-[#E2D0BA]',
      badgeText: 'text-[#3B2610]',
      cardBorder: 'border-[#E2D0BA] hover:border-[#BF8A52]',
      gradient: 'from-[#BF8A52] to-[#996937]',
      colorScale: ['#FAF4EC', '#D6AA79', '#784E20'],
      pastelBg: '#F2E4D2',
      border: '#E2D0BA',
      text: '#3B2610'
    }
  },
  pharmacy_availability: {
    titlePl: 'Dostępność aptek ogólnodostępnych',
    titleEn: 'Pharmacy availability',
    unitPl: 'osób/aptekę',
    category: 'Zdrowie',
    descriptionPl:
      'Liczba mieszkańców przypadająca na jedną aptekę. Mierzy nasycenie podstawową infrastrukturą farmaceutyczną.',
    iconName: 'activity',
    theme: {
      accent: '#649479',
      chartColor: '#649479',
      chartSecondary: '#D3E6DB',
      badgeBg: 'bg-[#D3E6DB] text-[#1A3324] border-[#BDD6C7]',
      badgeText: 'text-[#1A3324]',
      cardBorder: 'border-[#BDD6C7] hover:border-[#649479]',
      gradient: 'from-[#649479] to-[#497059]',
      colorScale: ['#EEF6F1', '#8EBAA1', '#345742'],
      pastelBg: '#D3E6DB',
      border: '#BDD6C7',
      text: '#1A3324'
    }
  },
  cancer_incidence: {
    titlePl: 'Zachorowalność na nowotwory',
    titleEn: 'Cancer incidence',
    unitPl: 'na 1000',
    category: 'Zdrowie',
    descriptionPl:
      'Liczba pacjentów z rozpoznaniem nowotworowym (19+) pod opieką lekarza POZ w przeliczeniu na 1000 mieszkańców.',
    iconName: 'activity',
    theme: {
      accent: '#B06371',
      chartColor: '#B06371',
      chartSecondary: '#EED3D8',
      badgeBg: 'bg-[#EED3D8] text-[#36171E] border-[#DEC0C6]',
      badgeText: 'text-[#36171E]',
      cardBorder: 'border-[#DEC0C6] hover:border-[#B06371]',
      gradient: 'from-[#B06371] to-[#8C4653]',
      colorScale: ['#F9EDEF', '#CF8794', '#6E2C38'],
      pastelBg: '#EED3D8',
      border: '#DEC0C6',
      text: '#36171E'
    }
  },
  care_and_education_centers: {
    titlePl: 'Placówki opiekuńczo-wychowawcze',
    titleEn: 'Care and education centers',
    unitPl: 'placówek',
    category: 'Piecza Zastępcza',
    descriptionPl:
      'Liczba stacjonarnych placówek opiekuńczo-wychowawczych realizujących opiekę całodobową nad dziećmi i młodzieżą.',
    iconName: 'heart',
    theme: {
      accent: '#946EA3',
      chartColor: '#946EA3',
      chartSecondary: '#E5D6EC',
      badgeBg: 'bg-[#E5D6EC] text-[#2C1935] border-[#D4C0DE]',
      badgeText: 'text-[#2C1935]',
      cardBorder: 'border-[#D4C0DE] hover:border-[#946EA3]',
      gradient: 'from-[#946EA3] to-[#734F82]',
      colorScale: ['#F6EEF9', '#B594C2', '#583666'],
      pastelBg: '#E5D6EC',
      border: '#D4C0DE',
      text: '#2C1935'
    }
  },
  residents_per_social_worker: {
    titlePl: 'Mieszkańcy na pracownika socjalnego',
    titleEn: 'Residents per social worker',
    unitPl: 'osób/pracownika',
    category: 'Pomoc Społeczna',
    descriptionPl:
      'Liczba mieszkańców przypadająca na jednego zatrudnionego pracownika socjalnego w jednostkach pomocy społecznej.',
    iconName: 'briefcase',
    theme: {
      accent: '#5E7D9E',
      chartColor: '#5E7D9E',
      chartSecondary: '#D0DFEE',
      badgeBg: 'bg-[#D0DFEE] text-[#192735] border-[#BCCEE0]',
      badgeText: 'text-[#192735]',
      cardBorder: 'border-[#BCCEE0] hover:border-[#5E7D9E]',
      gradient: 'from-[#5E7D9E] to-[#435F7E]',
      colorScale: ['#EDF3F9', '#8AA9C9', '#324C69'],
      pastelBg: '#D0DFEE',
      border: '#BCCEE0',
      text: '#192735'
    }
  },
  large_families_share: {
    titlePl: 'Udział rodzin wielodzietnych',
    titleEn: 'Share of large families',
    unitPl: '%',
    category: 'Demografia',
    descriptionPl:
      'Odsetek rodzin z trojgiem lub więcej dzieci na utrzymaniu do 24 lat w ogólnej liczbie rodzin z dziećmi (NSP).',
    iconName: 'users',
    theme: {
      accent: '#8C8855',
      chartColor: '#8C8855',
      chartSecondary: '#E5E3CE',
      badgeBg: 'bg-[#E5E3CE] text-[#282715] border-[#D5D3B8]',
      badgeText: 'text-[#282715]',
      cardBorder: 'border-[#D5D3B8] hover:border-[#8C8855]',
      gradient: 'from-[#8C8855] to-[#6E6A3B]',
      colorScale: ['#F6F5ED', '#B3B083', '#524E25'],
      pastelBg: '#E5E3CE',
      border: '#D5D3B8',
      text: '#282715'
    }
  },
  municipal_budget_expenditures: {
    titlePl: 'Wydatki budżetów gmin per capita',
    titleEn: 'Total municipal budget expenditures',
    unitPl: 'zł/mieszkańca',
    category: 'Finanse',
    descriptionPl:
      'Wydatki budżetowe gmin i miast na prawach powiatu w przeliczeniu na 1 mieszkańca. Obrazuje skalę nakładów lokalnych.',
    iconName: 'banknote',
    theme: {
      accent: '#A89251',
      chartColor: '#A89251',
      chartSecondary: '#ECE5CE',
      badgeBg: 'bg-[#ECE5CE] text-[#2F2712] border-[#DCD3B5]',
      badgeText: 'text-[#2F2712]',
      cardBorder: 'border-[#DCD3B5] hover:border-[#A89251]',
      gradient: 'from-[#A89251] to-[#867236]',
      colorScale: ['#F7F4EA', '#C8B57B', '#675522'],
      pastelBg: '#ECE5CE',
      border: '#DCD3B5',
      text: '#2F2712'
    }
  },
  museum_availability: {
    titlePl: 'Dostępność muzeów i instytucji',
    titleEn: 'Museum availability',
    unitPl: 'osób/muzeum',
    category: 'Kultura',
    descriptionPl:
      'Liczba mieszkańców przypadająca na jedno muzeum lub oddział muzealny. Miernik nasycenia ofertą dziedzictwa kultury.',
    iconName: 'activity',
    theme: {
      accent: '#9E7464',
      chartColor: '#9E7464',
      chartSecondary: '#ECD8D0',
      badgeBg: 'bg-[#ECD8D0] text-[#331E18] border-[#DEC5BC]',
      badgeText: 'text-[#331E18]',
      cardBorder: 'border-[#DEC5BC] hover:border-[#9E7464]',
      gradient: 'from-[#9E7464] to-[#7E5646]',
      colorScale: ['#F8F0EC', '#C29B8C', '#613E30'],
      pastelBg: '#ECD8D0',
      border: '#DEC5BC',
      text: '#331E18'
    }
  }
};

let dynamicRawData: RawResearchData = { ...(rawData as unknown as RawResearchData) };

if (typeof window !== 'undefined') {
  try {
    const cached = localStorage.getItem('hubmi_cached_indicators_v2');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && typeof parsed === 'object') {
        dynamicRawData = { ...dynamicRawData, ...parsed };
      }
    }
  } catch (e) {
    // Ignore cache parse error
  }
}

type ResearchDataListener = () => void;
const listeners = new Set<ResearchDataListener>();

export function subscribeToResearchData(listener: ResearchDataListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

let isFetchingLive = false;

export async function fetchLiveResearchData(): Promise<boolean> {
  if (isFetchingLive) return false;
  isFetchingLive = true;
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const res = await fetch(`${apiUrl}/api/indicators`, {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    });
    if (!res.ok) {
      isFetchingLive = false;
      return false;
    }
    const json = await res.json();
    if (json.success && json.data && typeof json.data === 'object' && Object.keys(json.data).length > 0) {
      dynamicRawData = { ...dynamicRawData, ...json.data };
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('hubmi_cached_indicators_v2', JSON.stringify(dynamicRawData));
        } catch (e) {}
      }
      listeners.forEach((fn) => {
        try {
          fn();
        } catch (e) {}
      });
      isFetchingLive = false;
      return true;
    }
  } catch (err) {
    // Fallback silently to current data
  }
  isFetchingLive = false;
  return false;
}

// React hooks for automatic reactive updates
export function useResearches() {
  const [data, setData] = useState<ResearchInfo[]>(() => getAllResearches());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setData(getAllResearches());

    const unsubscribe = subscribeToResearchData(() => {
      setData(getAllResearches());
    });

    setIsLoading(true);
    fetchLiveResearchData().finally(() => {
      setIsLoading(false);
      setData(getAllResearches());
    });

    return unsubscribe;
  }, []);

  return { researches: data, isLoading, refresh: fetchLiveResearchData };
}

export function useResearch(id: string) {
  const [research, setResearch] = useState<ResearchInfo | null>(() => getResearchById(id));
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setResearch(getResearchById(id));

    const unsubscribe = subscribeToResearchData(() => {
      setResearch(getResearchById(id));
    });

    setIsLoading(true);
    fetchLiveResearchData().finally(() => {
      setIsLoading(false);
      setResearch(getResearchById(id));
    });

    return unsubscribe;
  }, [id]);

  return { research, isLoading };
}

// Pobranie listy wszystkich typów badań
export function getAllResearches(): ResearchInfo[] {
  const keys = Object.keys(dynamicRawData);

  return keys.map((key) => {
    const raw = dynamicRawData[key];
    const cfg = RESEARCH_CONFIGS[key] || {
      titlePl: raw.name,
      titleEn: raw.name,
      category: 'Badanie Społeczne',
      descriptionPl: raw.description,
      iconName: 'activity' as const,
      theme: {
        accent: '#86887F',
        chartColor: '#86887F',
        chartSecondary: '#D7D8D1',
        badgeBg: 'bg-[#D7D8D1] text-[#242522] border-[#C6C7BD]',
        badgeText: 'text-[#242522]',
        cardBorder: 'border-[#C6C7BD] hover:border-[#86887F]',
        gradient: 'from-[#86887F] to-[#565752]',
        colorScale: ['#EDECE6', '#9CA096', '#4F524A'] as [string, string, string],
        pastelBg: '#D7D8D1',
        border: '#C6C7BD',
        text: '#242522'
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

    const polishUnit = cfg.unitPl || (raw.unit === 'count' ? 'rodzin' : raw.unit === 'days' ? 'dni' : raw.unit);

    return {
      id: key,
      key,
      titlePl: cfg.titlePl,
      titleEn: raw.name,
      unit: polishUnit,
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
  const raw = dynamicRawData[researchId];
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
  const raw = dynamicRawData[researchId];
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
  const raw = dynamicRawData[researchId];
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
