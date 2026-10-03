'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Idea, ScreenId } from '../lib/types';
import { getCurrentUser, setCurrentUser as setStoredCurrentUser } from '../lib/auth';
import {
  getIdeas,
  voteIdea,
  toggleTestingParticipation,
  addIdea as storeAddIdea,
  updateIdea as storeUpdateIdea,
  deleteIdea as storeDeleteIdea
} from '../lib/ideasStore';
import {
  fetchIdeasFromBackend,
  createIdeaOnBackend,
  deleteIdeaOnBackend,
  toggleIdeaReaction,
  fetchCurrentProfile,
  setAuthToken
} from '../lib/api';

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  ideas: Idea[];
  isLargeFont: boolean;
  toggleFontSize: () => void;
  vote: (id: string, type: 'like' | 'dislike') => Promise<void>;
  toggleTesting: (id: string) => Promise<void>;
  addIdea: (ideaData: any) => Promise<Idea>;
  deleteIdea: (id: string) => Promise<void>;
  updateIdeaStatus: (id: string, status: 'active' | 'testing' | 'archived') => void;
  navigate: (screen: ScreenId | string) => void;
  selectIdea: (idea: Idea) => void;
  openChatWithAuthor: (authorId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLargeFont, setIsLargeFont] = useState(false);

  useEffect(() => {
    // 1. Sprawdź profil z backendu (sesja JWT)
    fetchCurrentProfile()
      .then((profile) => {
        if (profile) {
          setCurrentUserState(profile);
          setStoredCurrentUser(profile);
        } else {
          setCurrentUserState(getCurrentUser());
        }
      })
      .catch(() => {
        setCurrentUserState(getCurrentUser());
      });

    // 2. Pobierz pomysły z backendu FastAPI lub lokalnie
    fetchIdeasFromBackend()
      .then((backendIdeas) => {
        if (backendIdeas && backendIdeas.length > 0) {
          setIdeas(backendIdeas);
        } else {
          setIdeas(getIdeas());
        }
      })
      .catch(() => {
        setIdeas(getIdeas());
      });
  }, []);

  const handleSetCurrentUser = (user: User | null) => {
    setCurrentUserState(user);
    setStoredCurrentUser(user);
    if (!user) {
      setAuthToken(null);
    }
  };

  const handleVote = async (id: string, type: 'like' | 'dislike') => {
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
    const email = currentUser?.email || 'gosc@hubmi.pl';
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
      router.push(`/browse?id=${created.id}`);
      return created;
    } catch (e) {
      console.warn('Backend create fallback to local:', e);
      const created = storeAddIdea(newIdeaData);
      setIdeas(getIdeas());
      router.push(`/browse?id=${created.id}`);
      return created;
    }
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
    router.push(`/browse?id=${idea.id}`);
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
        isLargeFont,
        toggleFontSize,
        vote: handleVote,
        toggleTesting: handleToggleTesting,
        addIdea: handleAddIdea,
        deleteIdea: handleDeleteIdea,
        updateIdeaStatus: handleUpdateIdeaStatus,
        navigate: handleNavigate,
        selectIdea: handleSelectIdea,
        openChatWithAuthor: handleOpenChatWithAuthor
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
