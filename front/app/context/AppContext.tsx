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
import { getCurrentUser, setCurrentUser as setStoredCurrentUser } from '../lib/auth';
import {
  getIdeas,
  voteIdea,
  toggleTestingParticipation,
  addIdea as storeAddIdea,
  updateIdea as storeUpdateIdea,
  deleteIdea as storeDeleteIdea,
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
  toggleIdeaReaction,
  fetchCurrentProfile,
  setAuthToken,
  getAuthToken,
  searchInnovations,
} from '../lib/api';

export type MiddlemanStep = 'pick' | 'profile' | 'result';

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  ideas: Idea[];
  isLoadingIdeas: boolean;
  isLoadingUser: boolean;
  isLargeFont: boolean;
  toggleFontSize: () => void;
  vote: (id: string, type: 'like' | 'dislike') => Promise<void>;
  toggleTesting: (id: string) => Promise<void>;
  addIdea: (ideaData: any) => Promise<Idea>;
  addPublishedIdea: (idea: Idea) => void;
  deleteIdea: (id: string) => Promise<void>;
  updateIdeaStatus: (id: string, status: 'active' | 'testing' | 'archived') => void;
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
  resetMiddleman: () => void;

  // Asystent Innowacji (Matching chat history)
  matchingMessages: any[];
  setMatchingMessages: React.Dispatch<React.SetStateAction<any[]>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [currentUser, setCurrentUserState] = useState<User | null>(() => {
    return getCurrentUser();
  });
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoadingIdeas, setIsLoadingIdeas] = useState(true);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isLargeFont, setIsLargeFont] = useState(false);

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

  // Matching Chat Turn history
  const [matchingMessages, setMatchingMessages] = useState<any[]>([]);

  // Synchronizacja szkicu middleman z sessionStorage
  useEffect(() => {
    saveStoredMiddlemanDraft({
      step: middlemanStep,
      selectedInnovation,
      profile: institutionProfile,
      result: serviceCardResult,
      pickerQuery,
      pickerPage,
    });
  }, [
    middlemanStep,
    selectedInnovation,
    institutionProfile,
    serviceCardResult,
    pickerQuery,
    pickerPage,
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
    clearStoredMiddlemanDraft();
  };

  const loadIdeas = async () => {
    setIsLoadingIdeas(true);
    try {
      const backendIdeas = await fetchIdeasFromBackend();
      if (backendIdeas && backendIdeas.length > 0) {
        setIdeas(backendIdeas);
      } else {
        setIdeas(getIdeas());
      }
    } catch {
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

    // Optymistyczna zmiana lokalna
    const updated = voteIdea(id, type);
    setIdeas(updated);

    // Synchronizacja z backendem
    try {
      const res = await toggleIdeaReaction(id, type);
      setIdeas((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                likes: res.likes,
                dislikes: res.dislikes,
                userVote: res.active ? type : null
              }
            : item
        )
      );
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
    const { ideas: updated } = toggleTestingParticipation(id, email);
    setIdeas(updated);

    try {
      const res = await toggleIdeaReaction(id, 'volunteer');
      setIdeas((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                testersCount: res.volunteers
              }
            : item
        )
      );
    } catch (e) {
      console.warn('Backend volunteer note:', e);
    }
  };

  const handleAddIdea = async (newIdeaData: any): Promise<Idea> => {
    try {
      const created = await createIdeaOnBackend({
        title: newIdeaData.title,
        description: newIdeaData.description || newIdeaData.summary,
        category: newIdeaData.category
      });
      setIdeas((prev) => [created, ...prev]);
      router.push(`/discover/${created.id}`);
      return created;
    } catch (e) {
      console.warn('Backend create fallback to local:', e);
      const created = storeAddIdea(newIdeaData);
      setIdeas(getIdeas());
      router.push(`/discover/${created.id}`);
      return created;
    }
  };

  // For ideas already saved by another service (e.g. Idea Creator), so they are not POSTed twice.
  const handleAddPublishedIdea = (idea: Idea) => {
    setIdeas((prev) => [idea, ...prev.filter((i) => i.id !== idea.id)]);
  };

  const handleDeleteIdea = async (id: string) => {
    try {
      await deleteIdeaOnBackend(id);
    } catch (e) {
      console.warn('Backend delete note:', e);
    }
    const updated = storeDeleteIdea(id);
    setIdeas(updated);
  };

  const handleUpdateIdeaStatus = (id: string, status: 'active' | 'testing' | 'archived') => {
    const updated = storeUpdateIdea(id, { status });
    setIdeas(updated);
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
    setIsLargeFont((prev) => !prev);
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
        resetMiddleman,

        // Matching
        matchingMessages,
        setMatchingMessages,
      }}
    >
      <div className={`min-h-screen flex flex-col bg-[#F7F6F1] ${isLargeFont ? 'font-scale-large' : ''}`}>
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
