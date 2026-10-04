'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Idea,
  ScreenId,
  InnovationRecord,
  InstitutionProfile,
  ServiceCardResponse,
} from '../lib/types';
import { setCurrentUser as setStoredCurrentUser } from '../lib/auth';
import {
  getIdeas,
  saveIdeas,
  addIdea as storeAddIdea,
  updateIdea as storeUpdateIdea,
} from '../lib/ideasStore';
import { EMPTY_PROFILE } from '../lib/middleman';
import {
  getStoredInnovations,
  saveStoredInnovations,
  filterInnovations,
  getStoredMiddlemanDraft,
  saveStoredMiddlemanDraft,
  clearStoredMiddlemanDraft,
} from '../lib/innovationsStore';
import {
  fetchIdeasFromBackend,
  createIdeaOnBackend,
  deleteIdeaOnBackend,
  updateIdeaStatusBackend,
  toggleIdeaReaction,
  fetchCurrentProfile,
  setAuthToken,
  getAuthToken,
  searchInnovations,
} from '../lib/api';

export type MiddlemanStep = 'pick' | 'view' | 'profile' | 'result';

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  ideas: Idea[];
  isLoadingIdeas: boolean;
  isLoadingUser: boolean;
  isLargeFont: boolean;
  toggleFontSize: () => void;
  fontSizeLevel: 'normal' | 'large' | 'huge';
  setFontSizeLevel: (level: 'normal' | 'large' | 'huge') => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  isHighContrast: boolean;
  toggleHighContrast: () => void;
  isSoundEnabled: boolean;
  toggleSound: () => void;
  vote: (id: string, type: 'like' | 'dislike') => Promise<void>;
  toggleTesting: (id: string) => Promise<void>;
  addIdea: (ideaData: any) => Promise<Idea>;
  addPublishedIdea: (idea: Idea) => void;
  deleteIdea: (id: string) => Promise<void>;
  updateIdeaStatus: (id: string, status: 'active' | 'testing' | 'archived' | 'pending' | 'rejected') => Promise<void>;
  navigate: (screen: ScreenId | string) => void;
  selectIdea: (idea: Idea) => void;
  openChatWithAuthor: (authorId: string) => void;
  refreshIdeas: () => Promise<void>;

  // Innowacje (ROPS Kraków)
  innovations: InnovationRecord[];
  isLoadingInnovations: boolean;
  innovationsError: string | null;
  loadInnovations: (forceRefresh?: boolean) => Promise<InnovationRecord[]>;
  searchLocalInnovations: (query: string) => InnovationRecord[];

  // Middleman (Innowacja -> Usługa)
  middlemanStep: MiddlemanStep;
  setMiddlemanStep: (step: MiddlemanStep) => void;
  selectedInnovation: InnovationRecord | null;
  setSelectedInnovation: (inn: InnovationRecord | null) => void;
  institutionProfile: InstitutionProfile;
  setInstitutionProfile: React.Dispatch<React.SetStateAction<InstitutionProfile>>;
  serviceCardResult: ServiceCardResponse | null;
  setServiceCardResult: (result: ServiceCardResponse | null) => void;
  pickerQuery: string;
  setPickerQuery: (query: string) => void;
  pickerPage: number;
  setPickerPage: (page: number) => void;
  middlemanRefineText: string;
  setMiddlemanRefineText: (text: string) => void;
  resetMiddleman: () => void;

  // Asystent Innowacji (Matching chat history)
  matchingMessages: any[];
  setMatchingMessages: React.Dispatch<React.SetStateAction<any[]>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  // null on the first render so the server HTML matches the client. The session is read after mount.
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoadingIdeas, setIsLoadingIdeas] = useState(true);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  // Accessibility states
  const [fontSizeLevel, setFontSizeLevelState] = useState<'normal' | 'large' | 'huge'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('minno_font_size_level');
      if (saved === 'large' || saved === 'huge') return saved;
    }
    return 'normal';
  });
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('minno_dark_mode') === 'true';
    }
    return false;
  });
  const [isHighContrast, setIsHighContrast] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('minno_high_contrast') === 'true';
    }
    return false;
  });
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('minno_sound_enabled') !== 'false';
    }
    return true;
  });

  const isLargeFont = fontSizeLevel !== 'normal';

  const setFontSizeLevel = (level: 'normal' | 'large' | 'huge') => {
    setFontSizeLevelState(level);
    if (typeof window !== 'undefined') {
      localStorage.setItem('minno_font_size_level', level);
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('minno_dark_mode', String(next));
      }
      return next;
    });
  };

  const toggleHighContrast = () => {
    setIsHighContrast((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('minno_high_contrast', String(next));
      }
      return next;
    });
  };


  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (isHighContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  }, [isHighContrast]);

  const toggleSound = () => {
    setIsSoundEnabled((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('minno_sound_enabled', String(next));
      }
      return next;
    });
  };

  // Innowacje (centralna baza danych i pamięć podręczna)
  const [innovations, setInnovations] = useState<InnovationRecord[]>(() => {
    return getStoredInnovations();
  });
  const [isLoadingInnovations, setIsLoadingInnovations] = useState(false);
  const [innovationsError, setInnovationsError] = useState<string | null>(null);

  // Middleman (Innowacja -> Usługa) stan z pamięcią podręczną
  const initialDraft = getStoredMiddlemanDraft();
  const [middlemanStep, setMiddlemanStepState] = useState<MiddlemanStep>(
    initialDraft?.step || 'pick'
  );
  const [selectedInnovation, setSelectedInnovationState] = useState<InnovationRecord | null>(
    initialDraft?.selectedInnovation || null
  );
  const [institutionProfile, setInstitutionProfile] = useState<InstitutionProfile>(
    initialDraft?.profile || EMPTY_PROFILE
  );
  const [serviceCardResult, setServiceCardResultState] = useState<ServiceCardResponse | null>(
    initialDraft?.result || null
  );
  const [pickerQuery, setPickerQueryState] = useState<string>(
    initialDraft?.pickerQuery || ''
  );
  const [pickerPage, setPickerPageState] = useState<number>(
    initialDraft?.pickerPage || 1
  );
  const [middlemanRefineText, setMiddlemanRefineTextState] = useState<string>(
    initialDraft?.refineText || ''
  );

  // Matching Chat Turn history
  const [matchingMessages, setMatchingMessages] = useState<any[]>([]);

  // Synchronizacja szkicu middleman z pamięcią podręczną
  useEffect(() => {
    saveStoredMiddlemanDraft({
      step: middlemanStep,
      selectedInnovation,
      profile: institutionProfile,
      result: serviceCardResult,
      pickerQuery,
      pickerPage,
      refineText: middlemanRefineText,
    });
  }, [
    middlemanStep,
    selectedInnovation,
    institutionProfile,
    serviceCardResult,
    pickerQuery,
    pickerPage,
    middlemanRefineText,
  ]);

  const loadInnovations = async (forceRefresh = false): Promise<InnovationRecord[]> => {
    if (!forceRefresh && innovations.length > 0) {
      return innovations;
    }
    setIsLoadingInnovations(true);
    setInnovationsError(null);
    try {
      const data = await searchInnovations('');
      if (data && data.length > 0) {
        setInnovations(data);
        saveStoredInnovations(data);
        return data;
      }
      return innovations;
    } catch (err: any) {
      const msg = err?.message || 'Nie udało się pobrać bazy innowacji.';
      setInnovationsError(msg);
      return innovations;
    } finally {
      setIsLoadingInnovations(false);
    }
  };

  const searchLocalInnovations = (query: string): InnovationRecord[] => {
    return filterInnovations(innovations, query);
  };

  const resetMiddleman = () => {
    setMiddlemanStepState('pick');
    setSelectedInnovationState(null);
    setInstitutionProfile(EMPTY_PROFILE);
    setServiceCardResultState(null);
    setMiddlemanRefineTextState('');
    clearStoredMiddlemanDraft();
  };

  const loadIdeas = async () => {
    setIsLoadingIdeas(true);
    try {
      const backendIdeas = await fetchIdeasFromBackend();
      if (backendIdeas && backendIdeas.length > 0) {
        setIdeas(backendIdeas);
        saveIdeas(backendIdeas);
      } else {
        const local = getIdeas();
        setIdeas(local);
      }
    } catch (e) {
      console.warn('Failed to load ideas from backend:', e);
      setIdeas(getIdeas());
    } finally {
      setIsLoadingIdeas(false);
    }
  };

  useEffect(() => {
    // 1. Sprawdź profil z backendu (sesja JWT)
    const loadUser = async () => {
      setIsLoadingUser(true);
      try {
        const token = getAuthToken();
        if (!token) {
          // Brak aktywnego tokenu JWT -> użytkownik niezalogowany
          setCurrentUserState(null);
          setStoredCurrentUser(null);
          return;
        }

        const profile = await fetchCurrentProfile();
        if (profile) {
          setCurrentUserState(profile);
          setStoredCurrentUser(profile);
        } else {
          // Jeśli token jest nieważny (401 wyczyścił token w apiFetch)
          if (!getAuthToken()) {
            setCurrentUserState(null);
            setStoredCurrentUser(null);
          }
        }
      } catch (err) {
        console.warn('Błąd weryfikacji profilu użytkownika:', err);
      } finally {
        setIsLoadingUser(false);
      }
    };

    loadUser();

    // 2. Pobierz pomysły z backendu FastAPI lub lokalnie
    loadIdeas();

    // 3. Pobierz innowacje do globalnego stanu (aby były natychmiast dostępne na wszystkich ekranach)
    loadInnovations();
  }, []);

  const handleSetCurrentUser = (user: User | null) => {
    setCurrentUserState(user);
    setStoredCurrentUser(user);
    if (!user) {
      setAuthToken(null);
    }
  };

  const handleVote = async (id: string, type: 'like' | 'dislike') => {
    if (!currentUser) {
      router.push('/auth');
      return;
    }

    // Optymistyczna zmiana lokalna na aktualnym stanie w React
    setIdeas((prev) => {
      const next = prev.map((item) => {
        if (item.id !== id) return item;

        let likes = item.likes;
        let dislikes = item.dislikes;
        let userVote: 'like' | 'dislike' | null = type;

        if (item.userVote === type) {
          // Cofnięcie polubienia / głosu (toggle off)
          userVote = null;
          if (type === 'like') likes = Math.max(0, likes - 1);
          if (type === 'dislike') dislikes = Math.max(0, dislikes - 1);
        } else {
          // Zmiana z przeciwnego
          if (item.userVote === 'like') likes = Math.max(0, likes - 1);
          if (item.userVote === 'dislike') dislikes = Math.max(0, dislikes - 1);

          if (type === 'like') likes += 1;
          if (type === 'dislike') dislikes += 1;
        }

        return {
          ...item,
          likes,
          dislikes,
          userVote,
        };
      });
      saveIdeas(next);
      return next;
    });

    // Synchronizacja z backendem
    try {
      const res = await toggleIdeaReaction(id, type);
      setIdeas((prev) => {
        const next = prev.map((item) =>
          item.id === id
            ? {
                ...item,
                likes: res.likes,
                dislikes: res.dislikes,
                userVote: res.active ? type : null,
              }
            : item
        );
        saveIdeas(next);
        return next;
      });
    } catch (e) {
      console.warn('Backend vote note:', e);
    }
  };

  const handleToggleTesting = async (id: string) => {
    if (!currentUser) {
      router.push('/auth');
      return;
    }

    const email = currentUser.email;
    setIdeas((prev) => {
      const next = prev.map((item) => {
        if (item.id !== id) return item;

        const exists = item.testersList.includes(email);
        const newList = exists
          ? item.testersList.filter((e) => e !== email)
          : [...item.testersList, email];
        const count = exists ? Math.max(0, item.testersCount - 1) : item.testersCount + 1;

        return {
          ...item,
          testersCount: count,
          testersList: newList,
        };
      });
      saveIdeas(next);
      return next;
    });

    try {
      const res = await toggleIdeaReaction(id, 'volunteer');
      setIdeas((prev) => {
        const next = prev.map((item) =>
          item.id === id
            ? {
                ...item,
                testersCount: res.volunteers,
                testersList: res.active
                  ? Array.from(new Set([...item.testersList, email]))
                  : item.testersList.filter((e) => e !== email),
              }
            : item
        );
        saveIdeas(next);
        return next;
      });
    } catch (e) {
      console.warn('Backend volunteer note:', e);
    }
  };

  const handleAddIdea = async (newIdeaData: any): Promise<Idea> => {
    try {
      const created = await createIdeaOnBackend({
        title: newIdeaData.title,
        description: newIdeaData.description || newIdeaData.summary,
        category: newIdeaData.category,
      });
      setIdeas((prev) => {
        const next = [created, ...prev];
        saveIdeas(next);
        return next;
      });
      router.push(`/discover/${created.id}`);
      return created;
    } catch (e) {
      console.warn('Backend create fallback to local:', e);
      const created = storeAddIdea(newIdeaData, ideas);
      setIdeas((prev) => {
        const next = [created, ...prev];
        saveIdeas(next);
        return next;
      });
      router.push(`/discover/${created.id}`);
      return created;
    }
  };

  // For ideas already saved by another service (e.g. Idea Creator), so they are not POSTed twice.
  const handleAddPublishedIdea = (idea: Idea) => {
    setIdeas((prev) => {
      const next = [idea, ...prev.filter((i) => i.id !== idea.id)];
      saveIdeas(next);
      return next;
    });
  };

  const handleDeleteIdea = async (id: string) => {
    try {
      await deleteIdeaOnBackend(id);
    } catch (e) {
      console.warn('Backend delete note:', e);
    }
    setIdeas((prev) => {
      const next = prev.filter((item) => item.id !== id);
      saveIdeas(next);
      return next;
    });
  };

  const handleUpdateIdeaStatus = async (
    id: string,
    status: 'active' | 'testing' | 'archived' | 'pending' | 'rejected'
  ) => {
    try {
      const updatedIdea = await updateIdeaStatusBackend(id, status);
      setIdeas((prev) => prev.map((i) => (i.id === id ? updatedIdea : i)));
    } catch (e) {
      console.warn('Backend status update fallback:', e);
      const updated = storeUpdateIdea(id, { status: status as any });
      setIdeas(updated);
    }
  };

  const handleNavigate = (screen: ScreenId | string) => {
    const path = screen === 'discover' ? '/' : `/${screen}`;
    router.push(path);
  };

  const handleSelectIdea = (idea: Idea) => {
    router.push(`/discover/${idea.id}`);
  };

  const handleOpenChatWithAuthor = (authorId: string) => {
    router.push(`/chat?recipient=${authorId}`);
  };

  const toggleFontSize = () => {
    if (fontSizeLevel === 'normal') setFontSizeLevel('large');
    else if (fontSizeLevel === 'large') setFontSizeLevel('huge');
    else setFontSizeLevel('normal');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser: handleSetCurrentUser,
        ideas,
        isLoadingIdeas,
        isLoadingUser,
        isLargeFont,
        toggleFontSize,
        fontSizeLevel,
        setFontSizeLevel,
        isHighContrast,
        toggleHighContrast,
        isSoundEnabled,
        toggleSound,
        vote: handleVote,
        toggleTesting: handleToggleTesting,
        addIdea: handleAddIdea,
        addPublishedIdea: handleAddPublishedIdea,
        deleteIdea: handleDeleteIdea,
        updateIdeaStatus: handleUpdateIdeaStatus,
        navigate: handleNavigate,
        selectIdea: handleSelectIdea,
        openChatWithAuthor: handleOpenChatWithAuthor,
        refreshIdeas: loadIdeas,

        // Innowacje
        innovations,
        isLoadingInnovations,
        innovationsError,
        loadInnovations,
        searchLocalInnovations,

        // Middleman
        middlemanStep,
        setMiddlemanStep: setMiddlemanStepState,
        selectedInnovation,
        setSelectedInnovation: setSelectedInnovationState,
        institutionProfile,
        setInstitutionProfile,
        serviceCardResult,
        setServiceCardResult: setServiceCardResultState,
        pickerQuery,
        setPickerQuery: setPickerQueryState,
        pickerPage,
        setPickerPage: setPickerPageState,
        middlemanRefineText,
        setMiddlemanRefineText: setMiddlemanRefineTextState,
        resetMiddleman,

        isDarkMode,
        toggleDarkMode,

        // Matching
        matchingMessages,
        setMatchingMessages,
      }}
    >
      <div
        className={`min-h-screen flex flex-col transition-colors duration-150 ${
          fontSizeLevel === 'huge'
            ? 'font-scale-huge'
            : fontSizeLevel === 'large'
            ? 'font-scale-large'
            : ''
        } ${
          isHighContrast
            ? 'high-contrast bg-black text-white'
            : isDarkMode
            ? 'dark bg-[#141518] text-[#F3F4F6]'
            : 'bg-[#F7F6F1] text-stone-900'
        }`}
      >
        {children}
      </div>
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
