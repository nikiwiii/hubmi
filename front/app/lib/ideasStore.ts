import { Idea, getCategoryThemeAndShape } from './types';

export const INITIAL_IDEAS: Idea[] = [
  {
    id: "idea-test-1",
    title: "Mobilny Asystent Bezpiecznego Domu Seniora",
    subtitle: "Audyt ergonomiczny i likwidacja barier w mieszkaniach osób 65+",
    authorId: "user-1",
    authorName: "Barbara Nowak",
    authorEmail: "barbara.nowak@malopolska.pl",
    category: "Zdrowie i Bezpieczeństwo",
    summary: "Mobilny zespół doradców montujący listwy antypoślizgowe, poręcze i oświetlenie zmierzchowe w domach seniorów.",
    description: "Innowacyjny model wsparcia domowego dla seniorów o ograniczonej sprawności ruchowej w subregionie tarnowskim. Zespół wolontariuszy i monterów wykonuje bezpłatny audyt bezpieczeństwa i w 60 minut usuwa niebezpieczne progi, montuje uchwyty łazienkowe oraz czujniki ruchu.",
    targetAudience: "Samotni seniorzy 65+, osoby z problemami motorycznymi i ich opiekunowie",
    keyBenefits: [
      "Redukcja ryzyka upadków w domu o 70%",
      "Bezpłatny montaż w 1 godzinę",
      "Wsparcie psychiczne i rozmowa z wolontariuszem"
    ],
    likes: 34,
    dislikes: 1,
    testersCount: 14,
    testersList: ["barbara.nowak@malopolska.pl", "tester@rops.krakow.pl"],
    colorTheme: "lavender",
    geometricShape: "cloud",
    status: "testing",
    createdAt: "2026-09-15",
    commentsCount: 6,
    lookingForPartner: true,
    partnerTypes: ["NGO / Stowarzyszenie", "Gmina wiejska"]
  },
  {
    id: "idea-test-2",
    title: "Sąsiedzka Lodówka i Bank Dzielenia Żywnością",
    subtitle: "Punkt zero-waste i wzajemnej pomocy społecznej",
    authorId: "user-2",
    authorName: "Tomasz Lewandowski",
    authorEmail: "tomek.lewandowski@krakow.org",
    category: "Społeczność & Życie",
    summary: "Całodobowa przeszklona lodówka społeczna ratująca żywność przed zmarnowaniem i wspierająca osoby w kryzysie.",
    description: "Prototyp bezpiecznego punktu wymiany żywności przy lokalnym domu kultury. Każdy może zostawić nadwyżki pełnowartościowej żywności z krótką datą przydatności, a osoby potrzebujące mogą bezpłatnie i anonimowo z niej skorzystać.",
    targetAudience: "Mieszkańcy osiedli miejsko-wiejskich, rodziny wielodzietne, osoby w trudnej sytuacji",
    keyBenefits: [
      "Ochrona żywności przed wyrzuceniem",
      "Anonimowe wsparcie bez stygmatyzacji",
      "Budowa zaufania w społeczności sąsiedzkiej"
    ],
    likes: 48,
    dislikes: 2,
    testersCount: 21,
    testersList: ["tomek.lewandowski@krakow.org"],
    colorTheme: "yellow",
    geometricShape: "donut",
    status: "testing",
    createdAt: "2026-09-20",
    commentsCount: 9,
    lookingForPartner: true,
    partnerTypes: ["Lokalny biznes spożywczy", "CUS / OPS"]
  },
  {
    id: "idea-test-3",
    title: "Kawiarenka Naprawcza 'Złota Rączka Pokoleń'",
    subtitle: "Międzypokoleniowe warsztaty naprawy sprzętu i renowacji",
    authorId: "user-3",
    authorName: "Janusz Krawczyk",
    authorEmail: "janusz.majster@interia.pl",
    category: "Rzemiosło i Pasje",
    summary: "Seniorzy-rzemieślnicy uczą młodzież naprawy drobnego AGD, rowerów i mebli przy kawie i cieście.",
    description: "Cotygodniowe otwarte spotkania w remizie strażackiej lub domu kultury, gdzie starsi mistrzowie rzemiosła wspólnie z młodzieżą naprawiają zepsute przedmioty przyniesione przez mieszkańców. Przeciwdziała samotności na emeryturze i buduje szacunek do przedmiotów.",
    targetAudience: "Seniorzy z umiejętnościami technicznymi, młodzież szkolna, lokalne rodziny",
    keyBenefits: [
      "Przekaz unikalnych umiejętności rzemieślniczych",
      "Przeciwdziałanie samotności i wykluczeniu osób 60+",
      "Ekologiczny styl życia i oszczędności dla portfela"
    ],
    likes: 62,
    dislikes: 0,
    testersCount: 18,
    testersList: ["janusz.majster@interia.pl"],
    colorTheme: "lilac",
    geometricShape: "crescent",
    status: "testing",
    createdAt: "2026-09-25",
    commentsCount: 12,
    lookingForPartner: false,
    partnerTypes: []
  }
];

const STORAGE_IDEAS_KEY = 'hubmi_ideas_v2';

export function getIdeas(): Idea[] {
  if (typeof window === 'undefined') return INITIAL_IDEAS;
  try {
    const stored = localStorage.getItem(STORAGE_IDEAS_KEY);
    if (!stored) {
      return INITIAL_IDEAS;
    }
    const parsed: Idea[] = JSON.parse(stored);
    return parsed.map(item => {
      const { theme, shape } = getCategoryThemeAndShape(item.category);
      return {
        ...item,
        colorTheme: theme,
        geometricShape: shape
      };
    });
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

export function voteIdea(id: string, type: 'like' | 'dislike', currentList?: Idea[]): Idea[] {
  const current = currentList && currentList.length > 0 ? currentList : getIdeas();
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

export function toggleTestingParticipation(id: string, userEmail: string, currentList?: Idea[]): { ideas: Idea[]; isTester: boolean } {
  const current = currentList && currentList.length > 0 ? currentList : getIdeas();
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

export function addIdea(newIdea: Omit<Idea, 'id' | 'createdAt' | 'likes' | 'dislikes' | 'testersCount' | 'testersList' | 'commentsCount'>, currentList?: Idea[]): Idea {
  const current = currentList && currentList.length > 0 ? currentList : getIdeas();
  const { theme, shape } = getCategoryThemeAndShape(newIdea.category);
  const idea: Idea = {
    ...newIdea,
    colorTheme: theme,
    geometricShape: shape,
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

export function updateIdea(id: string, updates: Partial<Idea>, currentList?: Idea[]): Idea[] {
  const current = currentList && currentList.length > 0 ? currentList : getIdeas();
  const updated = current.map(item => (item.id === id ? { ...item, ...updates } : item));
  saveIdeas(updated);
  return updated;
}

export function deleteIdea(id: string, currentList?: Idea[]): Idea[] {
  const current = currentList && currentList.length > 0 ? currentList : getIdeas();
  const updated = current.filter(item => item.id !== id);
  saveIdeas(updated);
  return updated;
}

export function isUserIdeaAuthor(idea: Idea, user: any): boolean {
  if (!user || !idea) return false;
  if (user.id && idea.authorId && String(user.id) === String(idea.authorId)) return true;
  if (
    user.email &&
    idea.authorEmail &&
    user.email.toLowerCase() === idea.authorEmail.toLowerCase()
  ) {
    return true;
  }
  if (
    user.name &&
    idea.authorName &&
    user.name.trim().toLowerCase() === idea.authorName.trim().toLowerCase()
  ) {
    return true;
  }
  return false;
}

export function isUserAdmin(user: any): boolean {
  if (!user) return false;
  return Boolean(user.role === 'admin' || user.isAdmin === true || user.role === 'administrator');
}

export function canUserDeleteIdea(idea: Idea, user: any): boolean {
  if (!user || !idea) return false;
  if (isUserAdmin(user)) return true;
  return isUserIdeaAuthor(idea, user);
}


