const fs = require('fs');
const file = './front/app/lib/researchData.ts';
let content = fs.readFileSync(file, 'utf8');

const mergedConfig = `  urbanization_rate: {
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
  }`;

const startMarker = '  urbanization_rate: {';
const endMarker = 'let dynamicRawData: RawResearchData';

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.error('Markers not found!', { startIdx, endIdx });
  process.exit(1);
}

const before = content.slice(0, startIdx);
const after = content.slice(endIdx);

const newContent = before + mergedConfig + '\n};\n\n' + after;
fs.writeFileSync(file, newContent, 'utf8');
console.log('Successfully resolved researchData.ts conflicts!');
