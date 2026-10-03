import { Idea, getCategoryThemeAndShape } from './types';

export const INITIAL_IDEAS: Idea[] = [];

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
