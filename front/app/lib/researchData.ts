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
      'Udział ludności miejskiej w ogólnej populacji powiatu. Miernik stopnia zurbanizowania i koncentracji ludności.',
    iconName: 'users',
    theme: {
      accent: '#5A9EA6',
      chartColor: '#5A9EA6',
      chartSecondary: '#D0E6E9',
      badgeBg: 'bg-[#D0E6E9] text-[#162B2E] border-[#BAD6DA]',
      badgeText: 'text-[#162B2E]',
      cardBorder: 'border-[#BAD6DA] hover:border-[#5A9EA6]',
      gradient: 'from-[#5A9EA6] to-[#3E747B]',
      colorScale: ['#EEF7F8', '#86BCC3', '#2C565C'],
      pastelBg: '#D0E6E9',
      border: '#BAD6DA',
      text: '#162B2E'
    }
  },
  kindergarten_availability: {
    titlePl: 'Dostępność miejsc w przedszkolach',
    titleEn: 'Kindergarten availability',
    unitPl: 'dzieci/miejsce',
    category: 'Edukacja i Opieka',
    descriptionPl:
      'Liczba dzieci w wieku 3–5 lat przypadających na jedno miejsce w placówkach wychowania przedszkolnego.',
    iconName: 'heart',
    theme: {
      accent: '#D97757',
      chartColor: '#D97757',
      chartSecondary: '#F8DCDB',
      badgeBg: 'bg-[#F8DCDB] text-[#3B1914] border-[#ECC4C2]',
      badgeText: 'text-[#3B1914]',
      cardBorder: 'border-[#ECC4C2] hover:border-[#D97757]',
      gradient: 'from-[#D97757] to-[#B35235]',
      colorScale: ['#FDF2F0', '#E59C85', '#8C3820'],
      pastelBg: '#F8DCDB',
      border: '#ECC4C2',
      text: '#3B1914'
    }
  },
  pharmacy_availability: {
    titlePl: 'Dostępność aptek',
    titleEn: 'Pharmacy availability',
    unitPl: 'mieszkańców/aptekę',
    category: 'Zdrowie',
    descriptionPl:
      'Liczba mieszkańców przypadających na jedną ogólnodostępną aptekę lub punkt apteczny. Wskaźnik dostępności leków i infrastruktury farmaceutycznej.',
    iconName: 'activity',
    theme: {
      accent: '#539E82',
      chartColor: '#539E82',
      chartSecondary: '#CFE9DE',
      badgeBg: 'bg-[#CFE9DE] text-[#132B21] border-[#B7DBCB]',
      badgeText: 'text-[#132B21]',
      cardBorder: 'border-[#B7DBCB] hover:border-[#539E82]',
      gradient: 'from-[#539E82] to-[#37765E]',
      colorScale: ['#EFF8F4', '#7FBAA3', '#255442'],
      pastelBg: '#CFE9DE',
      border: '#B7DBCB',
      text: '#132B21'
    }
  },
  cancer_incidence: {
    titlePl: 'Zapadalność na nowotwory',
    titleEn: 'Cancer incidence',
    unitPl: 'na 1 000 osób',
    category: 'Zdrowie',
    descriptionPl:
      'Liczba pacjentów w wieku 19+ ze zdiagnozowanym nowotworem pod stałą opieką POZ na 1 000 mieszkańców.',
    iconName: 'activity',
    theme: {
      accent: '#B85D75',
      chartColor: '#B85D75',
      chartSecondary: '#F1D5DC',
      badgeBg: 'bg-[#F1D5DC] text-[#36131C] border-[#E3BCC7]',
      badgeText: 'text-[#36131C]',
      cardBorder: 'border-[#E3BCC7] hover:border-[#B85D75]',
      gradient: 'from-[#B85D75] to-[#913D53]',
      colorScale: ['#FBF0F3', '#CD879A', '#722437'],
      pastelBg: '#F1D5DC',
      border: '#E3BCC7',
      text: '#36131C'
    }
  },
  care_and_education_centers: {
    titlePl: 'Placówki opiekuńczo-wychowawcze',
    titleEn: 'Care and education centers',
    unitPl: 'placówek',
    category: 'Piecza Zastępcza',
    descriptionPl:
      'Liczba całodobowych instytucjonalnych placówek opiekuńczo-wychowawczych wspierających dzieci i młodzież pozbawione opieki rodzicielskiej.',
    iconName: 'heart',
    theme: {
      accent: '#9B749E',
      chartColor: '#9B749E',
      chartSecondary: '#E5D6E7',
      badgeBg: 'bg-[#E5D6E7] text-[#2C192E] border-[#D4BFD7]',
      badgeText: 'text-[#2C192E]',
      cardBorder: 'border-[#D4BFD7] hover:border-[#9B749E]',
      gradient: 'from-[#9B749E] to-[#78537B]',
      colorScale: ['#F7F1F7', '#B697B9', '#57365A'],
      pastelBg: '#E5D6E7',
      border: '#D4BFD7',
      text: '#2C192E'
    }
  },
  residents_per_social_worker: {
    titlePl: 'Mieszkańcy na pracownika socjalnego',
    titleEn: 'Residents per social worker',
    unitPl: 'mieszkańców/pracownika',
    category: 'Pomoc Społeczna',
    descriptionPl:
      'Liczba mieszkańców przypadających na jednego pracownika socjalnego zatrudnionego w ośrodku pomocy społecznej.',
    iconName: 'users',
    theme: {
      accent: '#88985B',
      chartColor: '#88985B',
      chartSecondary: '#E2E9CE',
      badgeBg: 'bg-[#E2E9CE] text-[#222813] border-[#CDD8B3]',
      badgeText: 'text-[#222813]',
      cardBorder: 'border-[#CDD8B3] hover:border-[#88985B]',
      gradient: 'from-[#88985B] to-[#67753F]',
      colorScale: ['#F5F8EF', '#A6B580', '#4A552A'],
      pastelBg: '#E2E9CE',
      border: '#CDD8B3',
      text: '#222813'
    }
  },
  large_families_share: {
    titlePl: 'Udział rodzin wielodzietnych',
    titleEn: 'Share of large families',
    unitPl: '%',
    category: 'Rodzina',
    descriptionPl:
      'Udział rodzin z 3 lub większą liczbą dzieci na utrzymaniu do 24 roku życia we wszystkich rodzinach z dziećmi (NSP).',
    iconName: 'users',
    theme: {
      accent: '#BF8456',
      chartColor: '#BF8456',
      chartSecondary: '#F3DFC8',
      badgeBg: 'bg-[#F3DFC8] text-[#381F0E] border-[#E4C8A6]',
      badgeText: 'text-[#381F0E]',
      cardBorder: 'border-[#E4C8A6] hover:border-[#BF8456]',
      gradient: 'from-[#BF8456] to-[#996035]',
      colorScale: ['#FAF3EA', '#CEA37D', '#74421E'],
      pastelBg: '#F3DFC8',
      border: '#E4C8A6',
      text: '#381F0E'
    }
  },
  municipal_budget_expenditures: {
    titlePl: 'Wydatki budżetów gmin na mieszkańca',
    titleEn: 'Total municipal budget expenditures',
    unitPl: 'zł/mieszkańca',
    category: 'Finanse Samorządowe',
    descriptionPl:
      'Łączne wydatki budżetów gmin i miast na prawach powiatu w przeliczeniu na 1 mieszkańca (w zł).',
    iconName: 'banknote',
    theme: {
      accent: '#628198',
      chartColor: '#628198',
      chartSecondary: '#D0DFEA',
      badgeBg: 'bg-[#D0DFEA] text-[#16232D] border-[#B7CAD7]',
      badgeText: 'text-[#16232D]',
      cardBorder: 'border-[#B7CAD7] hover:border-[#628198]',
      gradient: 'from-[#628198] to-[#456176]',
      colorScale: ['#EEF4F8', '#8AA5BA', '#2F485B'],
      pastelBg: '#D0DFEA',
      border: '#B7CAD7',
      text: '#16232D'
    }
  },
  museum_availability: {
    titlePl: 'Dostępność muzeów',
    titleEn: 'Museum availability',
    unitPl: 'mieszkańców/muzeum',
    category: 'Kultura i Czas Wolny',
    descriptionPl:
      'Liczba mieszkańców przypadających na jedno muzeum lub oddział muzealny w powiecie.',
    iconName: 'briefcase',
    theme: {
      accent: '#9B795D',
      chartColor: '#9B795D',
      chartSecondary: '#E8DCCF',
      badgeBg: 'bg-[#E8DCCF] text-[#2C1F15] border-[#D4C3B1]',
      badgeText: 'text-[#2C1F15]',
      cardBorder: 'border-[#D4C3B1] hover:border-[#9B795D]',
      gradient: 'from-[#9B795D] to-[#78573D]',
      colorScale: ['#F7F3EE', '#B59981', '#573B24'],
      pastelBg: '#E8DCCF',
      border: '#D4C3B1',
      text: '#2C1F15'
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
