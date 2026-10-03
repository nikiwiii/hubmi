import { Idea } from './types';

export const INITIAL_IDEAS: Idea[] = [
  {
    id: 'idea-1',
    title: 'Sąsiedzka Narzędziownia & Pomoc',
    subtitle: 'Wypożyczalnia sprzętu i wsparcie w ogrodzie',
    authorId: 'user-anna-2',
    authorName: 'Anna Kowalska',
    authorEmail: 'anna.kowalska@hubmi.pl',
    category: 'Dom i Ogród',
    summary: 'Platforma do dzielenia się wiertarkami, kosiarkami i poradami sąsiedzkimi bez konieczności kupowania drogiego sprzętu.',
    description: 'Wielu z nas trzyma w garażu kosiarkę, nożyce do żywopłotu czy glebogryzarkę, których używa 3 razy w roku. Dzięki prostej aplikacji sąsiedzi z najbliższej okolicy mogą rezerwować sprzęt za symboliczną opłatą lub w zamian za pomoc przy pracach ogrodowych. Interfejs oparty na dużych przyciskach i prostym kalendarzu.',
    targetAudience: 'Właściciele domów, działkowcy i majsterkowicze 40+, którzy cenią współpracę i oszczędność.',
    keyBenefits: [
      'Oszczędność pieniędzy i miejsca w garażu',
      'Integracja lokalnej społeczności',
      'Pomoc przy cięższych pracach fizycznych',
      'Brak skomplikowanych formularzy i umów'
    ],
    likes: 84,
    dislikes: 3,
    userVote: 'like',
    testersCount: 29,
    testersList: ['jan.wisniewski@hubmi.pl', 'anna.kowalska@hubmi.pl'],
    colorTheme: 'slate',
    geometricShape: 'v-shape',
    status: 'active',
    createdAt: '2026-02-14',
    commentsCount: 18
  },
  {
    id: 'idea-2',
    title: 'Klub Mądrości i Rozmów Życiowych',
    subtitle: 'Krótkie spotkania tematyczne przy kawie',
    authorId: 'user-lois-5',
    authorName: 'Lois Marshall',
    authorEmail: 'lois.m@hubmi.pl',
    category: 'Społeczność & Rozwój',
    summary: 'Kameralne, moderowane rozmowy audio i stacjonarne na ważne tematy życiowe, pasje i wspomnienia.',
    description: 'Miejsce spotkań dla osób ceniących głębokie, spokojne rozmowy bez politycznych kłótni. Spotkania odbywają się w małych grupach 4-6 osób w wybrane czwartkowe wieczory, z przewodnim pytaniem przygotowanym przez moderatora.',
    targetAudience: 'Osoby 45+ szukające wartościowych relacji, ciekawych dyskusji i nowych przyjaciół.',
    keyBenefits: [
      'Głębokie relacje zamiast powierzchownych mediów społecznościowych',
      'Spokojna atmosfera i moderacja',
      'Format bez stresu technicznego'
    ],
    likes: 142,
    dislikes: 5,
    userVote: null,
    testersCount: 47,
    testersList: ['elzbieta.dabrowska@hubmi.pl'],
    colorTheme: 'yellow',
    geometricShape: 'donut',
    status: 'active',
    createdAt: '2026-02-20',
    commentsCount: 31
  },
  {
    id: 'idea-3',
    title: 'Głosowy Asystent Leków z Potwierdzeniem',
    subtitle: 'Spokój dla Ciebie i Twojej rodziny',
    authorId: 'user-henrietta-6',
    authorName: 'Henrietta Blake',
    authorEmail: 'henrietta.b@hubmi.pl',
    category: 'Zdrowie & Bezpieczeństwo',
    summary: 'Aplikacja przypominająca o lekach głosem lektora z jednym dużym przyciskiem "Wzięte".',
    description: 'Zamiast małych piskliwych powiadomień w telefonie, aplikacja odtwarza spokojny komunikat głosowy ("Pani Mario, pora na witaminę D i tabletkę na serce po obiedzie"). Użytkownik dotyka ekranu w dowolnym miejscu, by potwierdzić. Jeśli nie potwierdzi w 30 minut, wysyłany jest SMS do bliskiej osoby.',
    targetAudience: 'Dojrzali dorośli dbający o regularne przyjmowanie leków oraz ich dorośli opiekunowie.',
    keyBenefits: [
      'Komunikaty głosowe po polsku w naturalnym tempie',
      'Duży czytelny ekran bez drobnego druku',
      'Poczucie spokoju dla najbliższych'
    ],
    likes: 198,
    dislikes: 2,
    userVote: 'like',
    testersCount: 68,
    testersList: ['anna.kowalska@hubmi.pl'],
    colorTheme: 'lavender',
    geometricShape: 'cloud',
    status: 'testing',
    createdAt: '2026-03-01',
    commentsCount: 42
  },
  {
    id: 'idea-4',
    title: 'Podróże Kamperem poza Sezonem',
    subtitle: 'Sprawdzone trasy krajoznawcze dla 40+',
    authorId: 'user-jan-3',
    authorName: 'Jan Wiśniewski',
    authorEmail: 'jan.wisniewski@hubmi.pl',
    category: 'Podróże & Pasje',
    summary: 'Baza urokliwych, bezpiecznych miejsc kempingowych w Polsce i Europie ze zweryfikowanymi opiniami rówieśników.',
    description: 'Zwiedzanie bez tłumów, w maju i wrześniu. Aplikacja prezentuje miejsca przyjazne dla vanów i kamperów z rzetelnymi informacjami o podłączeniu do prądu, cichej okolicy, bliskości lasów i jezior oraz jakości dróg dojazdowych.',
    targetAudience: 'Pary i single 40+ podróżujący kamperem lub planujący wynajem vana po raz pierwszy.',
    keyBenefits: [
      'Brak hałaśliwych imprezowych kempingów',
      'Wskazówki nawigacyjne dostosowane do większych aut',
      'Społeczność wzajemnego wsparcia na trasie'
    ],
    likes: 115,
    dislikes: 4,
    userVote: null,
    testersCount: 38,
    testersList: ['jan.wisniewski@hubmi.pl'],
    colorTheme: 'sage',
    geometricShape: 'v-shape',
    status: 'active',
    createdAt: '2026-03-10',
    commentsCount: 22
  },
  {
    id: 'idea-5',
    title: 'Warsztaty Renowacji Mebli Vintage',
    subtitle: 'Daj drugie życie starym fotelom i komodom',
    authorId: 'user-josie-7',
    authorName: 'Josie McBride',
    authorEmail: 'josie.m@hubmi.pl',
    category: 'Rzemiosło & Pasje',
    summary: 'Lokalne weekendowe warsztaty tapicerskie i stolarskie, gdzie pod okiem mistrza ratujemy meble z duszą.',
    description: 'Ocalmy piękne meble z lat 60. i 70.! Uczymy się zdejmować stary lakier, bejcować, wymieniać sprężyny i gąbki tapicerskie oraz dobierać trwałe tkaniny. Każdy uczestnik przynosi własny mały mebel (np. krzesło Chierowskiego) i wychodzi z odnowionym skarbem.',
    targetAudience: 'Miłośnicy estetyki retro, majsterkowania i relaksującej pracy manualnej.',
    keyBenefits: [
      'Praktyczne umiejętności stolarskie i tapicerskie',
      'Ekologia i przedłużanie życia mebli',
      'Świetny relaks z dala od ekranów komputera'
    ],
    likes: 167,
    dislikes: 1,
    userVote: null,
    testersCount: 52,
    testersList: [],
    colorTheme: 'lilac',
    geometricShape: 'crescent',
    status: 'active',
    createdAt: '2026-03-18',
    commentsCount: 27
  },
  {
    id: 'idea-6',
    title: 'Prosta Księgowość bez Żargonu',
    subtitle: 'Dla jednoosobowych działalności i twórców',
    authorId: 'user-admin-1',
    authorName: 'Marek Nowak',
    authorEmail: 'admin@hubmi.pl',
    category: 'Praca & Biznes',
    summary: 'Czytelny kalkulator podatkowy i wystawianie faktur z wyjaśnieniami ludzkim językiem.',
    description: 'Koniec z zastanawianiem się nad skomplikowanymi kodami GTU i tajemniczymi formularzami. Aplikacja mówi wprost: ile zostaje Ci na czysto w kieszeni, do kiedy trzeba zrobić przelew do ZUS i czy opłaca się wziąć dany wydatek w koszty.',
    targetAudience: 'Osoby prowadzące małą działalność gospodarczą, rzemieślnicy i wolni strzelcy 40+.',
    keyBenefits: [
      'Zero zawiłego języka urzędowego',
      'Wystawianie faktury w 3 proste kliknięcia',
      'Automatyczne przypomnienia SMS o terminach podatków'
    ],
    likes: 92,
    dislikes: 8,
    userVote: null,
    testersCount: 34,
    testersList: [],
    colorTheme: 'pink',
    geometricShape: 'wave',
    status: 'active',
    createdAt: '2026-03-22',
    commentsCount: 14
  }
];

const STORAGE_IDEAS_KEY = 'hubmi_ideas_v1';

export function getIdeas(): Idea[] {
  if (typeof window === 'undefined') return INITIAL_IDEAS;
  try {
    const stored = localStorage.getItem(STORAGE_IDEAS_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_IDEAS_KEY, JSON.stringify(INITIAL_IDEAS));
      return INITIAL_IDEAS;
    }
    return JSON.parse(stored);
  } catch {
    return INITIAL_IDEAS;
  }
}

export function saveIdeas(ideas: Idea[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_IDEAS_KEY, JSON.stringify(ideas));
  } catch (e) {
    console.error('Failed to save ideas', e);
  }
}

export function voteIdea(id: string, type: 'like' | 'dislike'): Idea[] {
  const current = getIdeas();
  const updated = current.map(item => {
    if (item.id !== id) return item;
    
    let likes = item.likes;
    let dislikes = item.dislikes;
    let userVote: 'like' | 'dislike' | null = type;

    if (item.userVote === type) {
      // Toggle off
      userVote = null;
      if (type === 'like') likes = Math.max(0, likes - 1);
      if (type === 'dislike') dislikes = Math.max(0, dislikes - 1);
    } else {
      // If switching from opposite
      if (item.userVote === 'like') likes = Math.max(0, likes - 1);
      if (item.userVote === 'dislike') dislikes = Math.max(0, dislikes - 1);
      
      if (type === 'like') likes += 1;
      if (type === 'dislike') dislikes += 1;
    }

    return {
      ...item,
      likes,
      dislikes,
      userVote
    };
  });

  saveIdeas(updated);
  return updated;
}

export function toggleTestingParticipation(id: string, userEmail: string): { ideas: Idea[]; isTester: boolean } {
  const current = getIdeas();
  let isTester = false;

  const updated = current.map(item => {
    if (item.id !== id) return item;

    const exists = item.testersList.includes(userEmail);
    let newList: string[];
    let count = item.testersCount;

    if (exists) {
      newList = item.testersList.filter(e => e !== userEmail);
      count = Math.max(0, count - 1);
      isTester = false;
    } else {
      newList = [...item.testersList, userEmail];
      count += 1;
      isTester = true;
    }

    return {
      ...item,
      testersCount: count,
      testersList: newList
    };
  });

  saveIdeas(updated);
  return { ideas: updated, isTester };
}

export function addIdea(newIdea: Omit<Idea, 'id' | 'createdAt' | 'likes' | 'dislikes' | 'testersCount' | 'testersList' | 'commentsCount'>): Idea {
  const current = getIdeas();
  const idea: Idea = {
    ...newIdea,
    id: `idea-${Date.now()}`,
    createdAt: new Date().toISOString().split('T')[0],
    likes: 0,
    dislikes: 0,
    testersCount: 0,
    testersList: [],
    commentsCount: 0
  };

  const updated = [idea, ...current];
  saveIdeas(updated);
  return idea;
}

export function updateIdea(id: string, updates: Partial<Idea>): Idea[] {
  const current = getIdeas();
  const updated = current.map(item => (item.id === id ? { ...item, ...updates } : item));
  saveIdeas(updated);
  return updated;
}

export function deleteIdea(id: string): Idea[] {
  const current = getIdeas();
  const updated = current.filter(item => item.id !== id);
  saveIdeas(updated);
  return updated;
}
