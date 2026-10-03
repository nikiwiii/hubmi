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

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  ideas: Idea[];
  isLargeFont: boolean;
  toggleFontSize: () => void;
  vote: (id: string, type: 'like' | 'dislike') => void;
  toggleTesting: (id: string) => void;
  addIdea: (ideaData: any) => Idea;
  deleteIdea: (id: string) => void;
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
    setCurrentUserState(getCurrentUser());
    setIdeas(getIdeas());
  }, []);

  const handleSetCurrentUser = (user: User | null) => {
    setCurrentUserState(user);
    setStoredCurrentUser(user);
  };

  const handleVote = (id: string, type: 'like' | 'dislike') => {
    const updated = voteIdea(id, type);
    setIdeas(updated);
  };

  const handleToggleTesting = (id: string) => {
    const email = currentUser?.email || 'gosc@hubmi.pl';
    const { ideas: updated } = toggleTestingParticipation(id, email);
    setIdeas(updated);
  };

  const handleAddIdea = (newIdeaData: any) => {
    const created = storeAddIdea(newIdeaData);
    setIdeas(getIdeas());
    router.push(`/browse?id=${created.id}`);
    return created;
  };

  const handleDeleteIdea = (id: string) => {
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
