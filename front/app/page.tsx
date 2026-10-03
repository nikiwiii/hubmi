'use client';

import React, { useState, useEffect } from 'react';
import { ScreenId, User, Idea } from './lib/types';
import { getCurrentUser, setCurrentUser } from './lib/auth';
import {
  getIdeas,
  voteIdea,
  toggleTestingParticipation,
  addIdea,
  updateIdea,
  deleteIdea
} from './lib/ideasStore';
import { Navbar } from './components/Navbar';
import { AuthScreen } from './components/AuthScreen';
import { DiscoverScreen } from './components/DiscoverScreen';
import { ProposeIdeaScreen } from './components/ProposeIdeaScreen';
import { BrowseIdeasScreen } from './components/BrowseIdeasScreen';
import { ChatScreen } from './components/ChatScreen';
import { AdminCrudScreen } from './components/AdminCrudScreen';
import { UserDashboardScreen } from './components/UserDashboardScreen';
import { KnowledgeHubScreen } from './components/KnowledgeHubScreen';

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('discover');
  const [previousScreen, setPreviousScreen] = useState<ScreenId>('discover');
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [chatRecipientId, setChatRecipientId] = useState<string | null>(null);
  const [isLargeFont, setIsLargeFont] = useState(false);

  // Initialize client state from storage
  useEffect(() => {
    setCurrentUserState(getCurrentUser());
    setIdeas(getIdeas());
  }, []);

  const handleNavigate = (screen: ScreenId) => {
    if (screen !== currentScreen) {
      setPreviousScreen(currentScreen);
      setCurrentScreen(screen);
    }
  };

  const handleUserChange = (user: User | null) => {
    setCurrentUserState(user);
    setCurrentUser(user);
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
    const created = addIdea(newIdeaData);
    setIdeas(getIdeas());
    setPreviousScreen(currentScreen);
    setSelectedIdeaId(created.id);
    setCurrentScreen('browse');
  };

  const handleDeleteIdea = (id: string) => {
    const updated = deleteIdea(id);
    setIdeas(updated);
    if (selectedIdeaId === id) {
      setSelectedIdeaId(updated[0]?.id || null);
    }
  };

  const handleUpdateIdeaStatus = (id: string, status: 'active' | 'testing' | 'archived') => {
    const updated = updateIdea(id, { status });
    setIdeas(updated);
  };

  const handleSelectIdea = (idea: Idea) => {
    setPreviousScreen(currentScreen);
    setSelectedIdeaId(idea.id);
    setCurrentScreen('browse');
  };

  const handleOpenChatWithAuthor = (authorId: string) => {
    setChatRecipientId(authorId);
    handleNavigate('chat');
  };

  // Render current active screen
  const renderScreenContent = () => {
    switch (currentScreen) {
      case 'auth':
        return (
          <AuthScreen
            currentUser={currentUser}
            onUserChange={handleUserChange}
            onNavigate={handleNavigate}
          />
        );

      case 'discover':
        return (
          <DiscoverScreen
            ideas={ideas}
            currentUser={currentUser}
            onSelectIdea={handleSelectIdea}
            onVote={handleVote}
            onToggleTesting={handleToggleTesting}
            onNavigate={handleNavigate}
          />
        );

      case 'propose':
        return (
          <ProposeIdeaScreen
            currentUser={currentUser}
            onAddIdea={handleAddIdea}
            onNavigate={handleNavigate}
          />
        );

      case 'browse':
        return (
          <BrowseIdeasScreen
            ideas={ideas}
            selectedIdeaId={selectedIdeaId || (ideas[0]?.id ?? null)}
            currentUser={currentUser}
            onVote={handleVote}
            onToggleTesting={handleToggleTesting}
            onSelectIdea={(idea) => setSelectedIdeaId(idea.id)}
            onOpenChatWithAuthor={handleOpenChatWithAuthor}
            onNavigate={handleNavigate}
          />
        );

      case 'chat':
        return (
          <ChatScreen
            currentUser={currentUser}
            initialRecipientId={chatRecipientId}
          />
        );

      case 'knowledge':
        return (
          <KnowledgeHubScreen
            onNavigate={handleNavigate}
          />
        );

      case 'admin':
        return (
          <AdminCrudScreen
            currentUser={currentUser}
            ideas={ideas}
            onUserChange={handleUserChange}
            onDeleteIdea={handleDeleteIdea}
            onUpdateIdeaStatus={handleUpdateIdeaStatus}
            onNavigate={handleNavigate}
          />
        );

      case 'dashboard':
      default:
        return (
          <UserDashboardScreen
            currentUser={currentUser}
            ideas={ideas}
            onSelectIdea={handleSelectIdea}
            onOpenChatWithAuthor={handleOpenChatWithAuthor}
            onNavigate={handleNavigate}
            isLargeFont={isLargeFont}
            onToggleFontSize={() => setIsLargeFont(!isLargeFont)}
          />
        );
    }
  };

  return (
    <div className={`min-h-screen flex flex-col bg-[#F7F6F1] ${isLargeFont ? 'font-scale-large' : ''}`}>
      {/* Top Navbar */}
      <Navbar
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        currentUser={currentUser}
        isLargeFont={isLargeFont}
        onToggleFontSize={() => setIsLargeFont(!isLargeFont)}
        ideasCount={ideas.length}
      />

      {/* Main Screen Content */}
      <main className="flex-1 pb-20 md:pb-8">
        {renderScreenContent()}
      </main>
    </div>
  );
}
