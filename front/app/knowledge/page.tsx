'use client';

import React, { useState, useMemo } from 'react';
import { KnowledgeResource, KnowledgeType } from '../lib/types';
import { getKnowledgeResources } from '../lib/knowledgeStore';
import { GeometricIllustration } from '../components/shared/GeometricIllustration';
import { getThemeStyles } from '../components/shared/IdeaCard';
import {
  Search,
  BookOpen,
  Film,
  MapPin,
  ChevronDown,
  ChevronUp,
  X,
  Play,
  Sparkles,
  Bot
} from 'lucide-react';

import { MalopolskaMap } from '../components/knowledge/MalopolskaMap';
import { RagChatSection } from '../components/knowledge/RagChatSection';
import { PowiatItem } from '../lib/malopolskaMapData';
import { useApp } from '../context/AppContext';

export default function KnowledgePage() {
  const { navigate } = useApp();

  const [resources] = useState<KnowledgeResource[]>(getKnowledgeResources());
  const [activeFilter, setActiveFilter] = useState<'all' | KnowledgeType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [activeVideoModal, setActiveVideoModal] = useState<KnowledgeResource | null>(null);
  const [selectedPowiat, setSelectedPowiat] = useState<PowiatItem | null>(null);
  const [isAiAdvisorOpen, setIsAiAdvisorOpen] = useState(false);

  const filteredResources = useMemo(() => {
    return resources.filter((item) => {
      const matchesType = activeFilter === 'all' || item.type === activeFilter;
      const q = searchQuery.toLowerCase();
      const matchesQuery =
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q));

      return matchesType && matchesQuery;
    });
  }, [resources, activeFilter, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedItemId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="py-6 px-4 sm:px-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2">
        <div>
          <div className="text-4xl sm:text-5xl font-bold tracking-tight leading-[0.95] select-none">
            <span className="block text-stone-900">Zasobnik Wiedzy</span>
            <span className="block text-stone-300">ROPS Kraków</span>
          </div>
          <p className="mt-2 text-stone-500 text-sm font-medium">
            Diagnozy wyzwań Małopolski, baza przetestowanych innowacji oraz materiały edukacyjne.
          </p>
        </div>

        {/* Toggle Doradca AI button (replaces "Odpowiedz pomysłem z AI") */}
        <button
          onClick={() => setIsAiAdvisorOpen((prev) => !prev)}
          className={`self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            isAiAdvisorOpen
              ? 'bg-[#EFE5C6] text-stone-900 border border-[#DDD0A6] shadow-2xs'
              : 'bg-stone-900 text-white hover:bg-stone-800 shadow-2xs'
          }`}
        >
          <Bot className="w-4 h-4 text-amber-500" />
          <span>{isAiAdvisorOpen ? 'Ukryj Doradcę AI' : 'Doradca AI (Groq RAG)'}</span>
          {isAiAdvisorOpen ? (
            <ChevronUp className="w-3.5 h-3.5 text-stone-700" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
          )}
        </button>
      </div>

      {/* Sekcja Doradcy AI - domyślnie ukryta na górze strony, rozwijana przyciskiem */}
      {isAiAdvisorOpen && (
        <div className="animate-in fade-in slide-in-from-top-3 duration-300">
          <RagChatSection />
        </div>
      )}

      {/* Interaktywna Mapa Powiatów Małopolski */}
      <MalopolskaMap
        onSelectPowiat={(p) => setSelectedPowiat(p)}
        onApplySearch={(term) => setSearchQuery(term)}
        onNavigate={navigate}
      />

      {/* Minimal Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-2 shadow-2xs border border-black/4">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Szukaj wyzwań, innowacji lub poradników..."
            className="w-full pl-10 pr-8 py-2 text-base font-medium text-stone-900 placeholder:text-stone-400 rounded-xl focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 p-1 text-stone-400 hover:text-stone-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveFilter('all')}
          className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeFilter === 'all'
              ? 'bg-stone-900 text-white'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200/80'
          }`}
        >
          Wszystkie zasoby ({resources.length})
        </button>

        <button
          onClick={() => setActiveFilter('challenge')}
          className={`flex items-center gap-1.5 whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeFilter === 'challenge'
              ? 'bg-stone-900 text-white'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200/80'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Wyzwania Małopolski</span>
        </button>

        <button
          onClick={() => setActiveFilter('innovation')}
          className={`flex items-center gap-1.5 whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeFilter === 'innovation'
              ? 'bg-stone-900 text-white'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200/80'
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          <span>Biblioteka Innowacji (Wideo)</span>
        </button>

        <button
          onClick={() => setActiveFilter('education')}
          className={`flex items-center gap-1.5 whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeFilter === 'education'
              ? 'bg-stone-900 text-white'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200/80'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Materiały Edukacyjne</span>
        </button>
      </div>

      {/* Main Content Area */}
      {filteredResources.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-stone-200">
          <p className="text-base font-semibold text-stone-800">
            Brak materiałów dla wybranych kryteriów
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setActiveFilter('all');
            }}
            className="mt-3 px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-medium"
          >
            Wyczyść filtry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredResources.map((item) => {
            const styles = getThemeStyles(item.theme);
            const isExpanded = expandedItemId === item.id;

            return (
              <div
                key={item.id}
                className={`flex flex-col justify-between overflow-hidden rounded-[28px] p-6 transition-all duration-300 hover:shadow-lg ${styles.bg} min-h-75 border border-black/4`}
              >
                {/* Top Header */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${styles.badge}`}
                    >
                      {item.categoryLabel}
                    </span>

                    {item.statusBadge && (
                      <span className="text-[10px] font-bold bg-white/90 text-stone-800 px-2 py-0.5 rounded-full shadow-2xs">
                        {item.statusBadge}
                      </span>
                    )}
                  </div>

                  <h3 className={`text-xl font-bold leading-snug tracking-tight mt-1 ${styles.text}`}>
                    {item.title}
                  </h3>

                  <p className={`text-xs font-medium ${styles.subtext}`}>
                    {item.subtitle}
                  </p>
                </div>

                {/* Center: Key Metric, Video Thumbnail, or Geometric Art */}
                <div className="my-auto py-3">
                  {item.keyMetric ? (
                    <div className="p-3 bg-white/60 backdrop-blur-2xs rounded-2xl border border-black/4 text-center space-y-0.5">
                      <span className="block text-3xl font-extrabold text-stone-900 tracking-tight">
                        {item.keyMetric}
                      </span>
                      <span className="block text-[11px] font-medium text-stone-600">
                        {item.metricLabel}
                      </span>
                    </div>
                  ) : item.videoUrl ? (
                    <div
                      onClick={() => setActiveVideoModal(item)}
                      className="group/video relative aspect-video bg-black/10 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-black/20 transition-all border border-black/6 overflow-hidden"
                    >
                      <GeometricIllustration
                        shape={item.shape}
                        theme={item.theme}
                        size={80}
                        className="opacity-70 group-hover/video:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-stone-900/90 text-white flex items-center justify-center shadow-md group-hover/video:scale-110 transition-transform">
                          <Play className="w-4 h-4 ml-0.5 fill-white" />
                        </div>
                      </div>
                      {item.videoDuration && (
                        <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 text-white text-[10px] font-mono rounded">
                          {item.videoDuration}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <GeometricIllustration
                        shape={item.shape}
                        theme={item.theme}
                        size={90}
                      />
                    </div>
                  )}
                </div>

                {/* Summary / Expandable Content */}
                <div className="space-y-2 pt-2 border-t border-black/6">
                  <p className={`text-xs font-medium leading-relaxed ${styles.subtext}`}>
                    {item.summary}
                  </p>

                  {/* Expanded deep dive */}
                  {isExpanded && (
                    <div className="p-3 bg-white/80 backdrop-blur-xs rounded-xl text-xs text-stone-800 space-y-2 animate-in fade-in duration-200">
                      <p className="leading-relaxed">{item.content}</p>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {item.tags.map((t, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-medium px-2 py-0.5 bg-stone-100 rounded text-stone-600"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer Action buttons */}
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-[11px] text-stone-500 font-medium">
                      {item.readTime}
                    </span>

                    <button
                      onClick={() => toggleExpand(item.id)}
                      className="flex items-center gap-1 font-semibold text-stone-800 hover:text-stone-950 cursor-pointer"
                    >
                      <span>{isExpanded ? 'Zwiń' : 'Czytaj szczegóły'}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Video Modal Player */}
      {activeVideoModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-stone-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-stone-100 text-stone-600 rounded-full">
                  {activeVideoModal.categoryLabel}
                </span>
                <h4 className="text-lg font-bold text-stone-900 mt-1">
                  {activeVideoModal.title}
                </h4>
              </div>
              <button
                onClick={() => setActiveVideoModal(null)}
                className="p-2 rounded-full hover:bg-stone-100 text-stone-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-video bg-stone-900 rounded-2xl overflow-hidden flex flex-col items-center justify-center text-white p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center mb-3">
                <Play className="w-7 h-7 fill-white ml-1" />
              </div>
              <p className="text-sm font-semibold">{activeVideoModal.title}</p>
              <p className="text-xs text-stone-400 mt-1">
                Wideoteka Innowacji Społecznych ROPS Kraków ({activeVideoModal.videoDuration})
              </p>
              <span className="mt-4 px-3 py-1 bg-white/10 rounded-full text-[11px] font-mono">
                Źródło: Kanał Wideo ROPS Kraków
              </span>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              {activeVideoModal.content}
            </p>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveVideoModal(null)}
                className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
