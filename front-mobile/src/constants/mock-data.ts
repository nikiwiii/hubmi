export type UserRole = 'admin' | 'creator' | 'tester';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarBg: string;
  createdAt: string;
  status: 'active' | 'blocked';
  bio?: string;
}

export type ColorTheme = 'yellow' | 'slate' | 'lavender' | 'sage' | 'lilac' | 'pink' | 'cyan';
export type ShapeType = 'donut' | 'v-shape' | 'cloud' | 'crescent' | 'wave' | 'diamond' | 'sun';

export interface Idea {
  id: string;
  title: string;
  subtitle: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  category: string;
  summary: string;
  description: string;
  targetAudience: string;
  keyBenefits: string[];
  likes: number;
  dislikes: number;
  userVote?: 'like' | 'dislike' | null;
  testersCount: number;
  testersList: string[];
  colorTheme: ColorTheme;
  geometricShape: ShapeType;
  status: 'active' | 'draft' | 'testing' | 'archived';
  createdAt: string;
  commentsCount: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  text: string;
  timestamp: string;
}

export interface ChatContact {
  id: string;
  name: string;
  role: string;
  avatarBg: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  isOnline: boolean;
}

export const CURRENT_USER: User = {
  id: 'user-anna-2',
  email: 'anna.kowalska@hubmi.pl',
  name: 'Anna Kowalska',
  role: 'creator',
  avatarBg: '#EFE5C6',
  createdAt: '2026-01-10',
  status: 'active',
  bio: 'Pasjonatka lokalnych inicjatyw sąsiedzkich i zrównoważonego rozwoju.',
};

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
    description: 'Wielu z nas trzyma w garażu kosiarkę, nożyce do żywopłotu czy glebogryzarkę, których używa 3 razy w roku. Dzięki prostej aplikacji sąsiedzi z najbliższej okolicy mogą rezerwować sprzęt za symboliczną opłatą lub w zamian za pomoc przy pracach ogrodowych.',
    targetAudience: 'Właściciele domów, działkowcy i majsterkowicze 40+, którzy cenią współpracę i oszczędność.',
    keyBenefits: [
      'Oszczędność pieniędzy i miejsca w garażu',
      'Integracja lokalnej społeczności',
      'Pomoc przy cięższych pracach fizycznych',
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
    commentsCount: 18,
  },
  {
    id: 'idea-2',
    title: 'Klub Mądrości i Rozmów Życiowych',
    subtitle: 'Krótkie spotkania tematyczne przy kawie',
    authorId: 'user-lois-5',
    authorName: 'Lois Marshall',
    authorEmail: 'lois.m@hubmi.pl',
    category: 'Społeczność',
    summary: 'Kameralne, moderowane rozmowy audio i stacjonarne na ważne tematy życiowe, pasje i wspomnienia.',
    description: 'Miejsce spotkań dla osób ceniących głębokie, spokojne rozmowy bez politycznych kłótni. Spotkania odbywają się w małych grupach 4-6 osób w wybrane czwartkowe wieczory, z przewodnim pytaniem przygotowanym przez moderatora.',
    targetAudience: 'Osoby 45+ szukające wartościowych relacji, ciekawych dyskusji i nowych przyjaciół.',
    keyBenefits: [
      'Głębokie relacje zamiast powierzchownych mediów społecznościowych',
      'Spokojna atmosfera i moderacja',
      'Format bez stresu technicznego',
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
    commentsCount: 31,
  },
  {
    id: 'idea-3',
    title: 'Głosowy Asystent Leków z Potwierdzeniem',
    subtitle: 'Spokój dla Ciebie i Twojej rodziny',
    authorId: 'user-henrietta-6',
    authorName: 'Henrietta Blake',
    authorEmail: 'henrietta.b@hubmi.pl',
    category: 'Zdrowie',
    summary: 'Aplikacja przypominająca o lekach głosem lektora z jednym dużym przyciskiem "Wzięte".',
    description: 'Zamiast małych piskliwych powiadomień w telefonie, aplikacja odtwarza spokojny komunikat głosowy. Użytkownik dotyka ekranu w dowolnym miejscu, by potwierdzić. Jeśli nie potwierdzi w 30 minut, wysyłany jest SMS do bliskiej osoby.',
    targetAudience: 'Dojrzali dorośli dbający o regularne przyjmowanie leków oraz ich dorośli opiekunowie.',
    keyBenefits: [
      'Komunikaty głosowe po polsku w naturalnym tempie',
      'Duży czytelny ekran bez drobnego druku',
      'Poczucie spokoju dla najbliższych',
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
    commentsCount: 42,
  },
  {
    id: 'idea-4',
    title: 'Podróże Kamperem poza Sezonem',
    subtitle: 'Sprawdzone trasy krajoznawcze dla 40+',
    authorId: 'user-jan-3',
    authorName: 'Jan Wiśniewski',
    authorEmail: 'jan.wisniewski@hubmi.pl',
    category: 'Podróże',
    summary: 'Baza urokliwych, bezpiecznych miejsc kempingowych w Polsce ze zweryfikowanymi opiniami rówieśników.',
    description: 'Zwiedzanie bez tłumów, w maju i wrześniu. Aplikacja prezentuje miejsca przyjazne dla vanów i kamperów z rzetelnymi informacjami o podłączeniu do prądu, cichej okolicy, bliskości lasów i jezior oraz jakości dróg dojazdowych.',
    targetAudience: 'Pary i single 40+ podróżujący kamperem lub planujący wynajem vana po raz pierwszy.',
    keyBenefits: [
      'Brak hałaśliwych imprezowych kempingów',
      'Wskazówki nawigacyjne dostosowane do większych aut',
      'Społeczność wzajemnego wsparcia na trasie',
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
    commentsCount: 22,
  },
  {
    id: 'idea-5',
    title: 'Warsztaty Renowacji Mebli Vintage',
    subtitle: 'Daj drugie życie starym fotelom i komodom',
    authorId: 'user-josie-7',
    authorName: 'Josie McBride',
    authorEmail: 'josie.m@hubmi.pl',
    category: 'Rzemiosło',
    summary: 'Lokalne weekendowe warsztaty tapicerskie i stolarskie, gdzie pod okiem mistrza ratujemy meble z duszą.',
    description: 'Ocalmy piękne meble z lat 60. i 70.! Uczymy się zdejmować stary lakier, bejcować, wymieniać sprężyny i gąbki tapicerskie oraz dobierać trwałe tkaniny.',
    targetAudience: 'Miłośnicy estetyki retro, majsterkowania i relaksującej pracy manualnej.',
    keyBenefits: [
      'Praktyczne umiejętności stolarskie i tapicerskie',
      'Ekologia i przedłużanie życia mebli',
      'Świetny relaks z dala od ekranów komputera',
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
    commentsCount: 27,
  },
  {
    id: 'idea-6',
    title: 'Prosta Księgowość bez Żargonu',
    subtitle: 'Dla jednoosobowych działalności i twórców',
    authorId: 'user-admin-1',
    authorName: 'Marek Nowak',
    authorEmail: 'admin@hubmi.pl',
    category: 'Praca',
    summary: 'Czytelny kalkulator podatkowy i wystawianie faktur z wyjaśnieniami ludzkim językiem.',
    description: 'Koniec z zastanawianiem się nad skomplikowanymi kodami GTU i tajemniczymi formularzami. Aplikacja mówi wprost: ile zostaje Ci na czysto w kieszeni.',
    targetAudience: 'Osoby prowadzące małą działalność gospodarczą, rzemieślnicy i wolni strzelcy 40+.',
    keyBenefits: [
      'Zero zawiłego języka urzędowego',
      'Wystawianie faktury w 3 proste kliknięcia',
      'Automatyczne przypomnienia SMS o terminach podatków',
    ],
    likes: 92,
    dislikes: 8,
    userVote: null,
    testersCount: 34,
    testersList: [],
    colorTheme: 'pink',
    geometricShape: 'donut',
    status: 'archived',
    createdAt: '2026-01-20',
    commentsCount: 14,
  },
];

export const INITIAL_CONTACTS: ChatContact[] = [
  {
    id: 'user-anna-2',
    name: 'Anna Kowalska',
    role: 'Twórczyni Sąsiedzkiej Narzędziowni',
    avatarBg: '#EFE5C6',
    lastMessage: 'Cześć! Wiertarka udarowa jest wolna w tę sobotę.',
    lastMessageTime: '12:35',
    unreadCount: 1,
    isOnline: true,
  },
  {
    id: 'user-lois-5',
    name: 'Lois Marshall',
    role: 'Klub Mądrości',
    avatarBg: '#EAE7DF',
    lastMessage: 'Zapraszamy na spotkanie w czwartek o 18:00!',
    lastMessageTime: 'Wczoraj',
    unreadCount: 0,
    isOnline: false,
  },
  {
    id: 'user-henrietta-6',
    name: 'Henrietta Blake',
    role: 'Asystent Leków',
    avatarBg: '#DDE2E5',
    lastMessage: 'Dziękuję za zgłoszenie do testów wersji głosowej!',
    lastMessageTime: '2 dni temu',
    unreadCount: 0,
    isOnline: true,
  },
  {
    id: 'user-jan-3',
    name: 'Jan Wiśniewski',
    role: 'Podróże Kamperem',
    avatarBg: '#E8DED1',
    lastMessage: 'Dodałem nową trasę w okolicach Drawska.',
    lastMessageTime: '3 dni temu',
    unreadCount: 0,
    isOnline: false,
  },
];

export const CATEGORIES = [
  'Wszystkie',
  'Dom i Ogród',
  'Społeczność',
  'Zdrowie',
  'Podróże',
  'Rzemiosło',
  'Praca',
];
