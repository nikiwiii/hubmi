"use client";

import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Video,
  Users2,
  Target,
  Coins,
  FileText,
  HeartHandshake,
} from "lucide-react";
import { InnovationRecord } from "../../lib/types";
import { getYoutubeEmbedUrl } from "../../lib/middleman";
import { fetchInnovationById } from "../../lib/api";

interface InnovationDetailViewProps {
  innovation: InnovationRecord;
  onBack: () => void;
  onProceed: () => void;
}

export const InnovationDetailView: React.FC<InnovationDetailViewProps> = ({
  innovation,
  onBack,
  onProceed,
}) => {
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(
    innovation.video_url || null,
  );

  useEffect(() => {
    if (innovation.video_url) {
      setActiveVideoUrl(innovation.video_url);
    } else if (innovation.id) {
      fetchInnovationById(innovation.id)
        .then((fresh) => {
          if (fresh?.video_url) {
            setActiveVideoUrl(fresh.video_url);
          }
        })
        .catch(() => {});
    }
  }, [innovation.id, innovation.video_url]);

  const embedUrl = getYoutubeEmbedUrl(activeVideoUrl);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Karta: Wybrana innowacja */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-[#FAF4E5] border border-[#E7DAC0]">
        <div className="space-y-0.5">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
            Wybrana innowacja
          </span>
          <h1 className="text-base sm:text-lg font-bold text-stone-900">
            {innovation.title}
          </h1>
          {innovation.target_group && (
            <p className="text-xs text-stone-600 flex items-center gap-1.5 pt-0.5">
              <Users2 className="w-3.5 h-3.5 shrink-0 text-stone-500" />
              <span>{innovation.target_group}</span>
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
          {innovation.url && (
            <a
              href={innovation.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-stone-700 hover:text-stone-900 bg-white border border-black/10 hover:bg-stone-50 transition-colors shadow-2xs"
            >
              <span>Karta w bazie ROPS</span>
              <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
            </a>
          )}
          <button
            type="button"
            onClick={onBack}
            className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white border border-black/10 hover:bg-stone-50 text-stone-700 cursor-pointer shadow-2xs transition-colors"
          >
            Zmień innowację
          </button>
        </div>
      </div>

      {/* Spójna karta ze wszystkimi sekcjami merytorycznymi innowacji */}
      <article className="bg-white rounded-[24px] border border-black/5 p-5 sm:p-7 shadow-2xs space-y-6">
        {/* Wideo z YouTube (jeśli istnieje) */}
        {activeVideoUrl && (
          <>
            <section className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-xs sm:text-sm font-bold text-stone-900">
                  <span className="w-6 h-6 rounded-lg bg-red-50 border border-red-200/60 flex items-center justify-center text-red-600 shrink-0">
                    <Video className="w-3.5 h-3.5" />
                  </span>
                  <span>Prezentacja wideo innowacji</span>
                </h2>
                <a
                  href={activeVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-stone-500 hover:text-stone-900 inline-flex items-center gap-1 transition-colors"
                >
                  <span>Otwórz w YouTube</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {embedUrl ? (
                <div className="max-w-2xl">
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black shadow-inner border border-black/10">
                    <iframe
                      src={embedUrl}
                      title={`Prezentacja wideo innowacji: ${innovation.title}`}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-stone-50 border border-black/5 flex items-center justify-between gap-3">
                  <span className="text-xs text-stone-600">
                    Obejrzyj oficjalną prezentację wideo innowacji
                  </span>
                  <a
                    href={activeVideoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Otwórz wideo</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </section>
            <hr className="border-t border-black/5" />
          </>
        )}

        {/* Rozwiązywane problemy */}
        {innovation.addressed_problems && (
          <section className="space-y-2">
            <h2 className="flex items-center gap-2 text-xs sm:text-sm font-bold text-stone-900">
              <span className="w-6 h-6 rounded-lg bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-700 shrink-0">
                <Target className="w-3.5 h-3.5" />
              </span>
              <span>Rozwiązywane problemy społeczne i diagnoza</span>
            </h2>
            <div className="text-xs sm:text-sm text-stone-600 leading-relaxed whitespace-pre-line pl-0 sm:pl-8">
              {innovation.addressed_problems}
            </div>
          </section>
        )}

        {/* Divider */}
        {innovation.addressed_problems && innovation.description && (
          <hr className="border-t border-black/5" />
        )}

        {/* Opis innowacji */}
        {innovation.description && (
          <section className="space-y-2">
            <h2 className="flex items-center gap-2 text-xs sm:text-sm font-bold text-stone-900">
              <span className="w-6 h-6 rounded-lg bg-stone-100 border border-black/5 flex items-center justify-center text-stone-800 shrink-0">
                <FileText className="w-3.5 h-3.5" />
              </span>
              <span>Opis innowacji i mechanizm działania</span>
            </h2>
            <div className="text-xs sm:text-sm text-stone-600 leading-relaxed whitespace-pre-line pl-0 sm:pl-8">
              {innovation.description}
            </div>
          </section>
        )}

        {/* Divider */}
        {(innovation.addressed_problems || innovation.description) &&
          (innovation.target_group || innovation.beneficiaries) && (
            <hr className="border-t border-black/5" />
          )}

        {/* Odbiorcy i Beneficjenci */}
        {(innovation.target_group || innovation.beneficiaries) && (
          <section className="space-y-2.5">
            <h2 className="flex items-center gap-2 text-xs sm:text-sm font-bold text-stone-900">
              <span className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-700 shrink-0">
                <HeartHandshake className="w-3.5 h-3.5" />
              </span>
              <span>Odbiorcy i beneficjenci</span>
            </h2>
            <div className="space-y-3 pl-0 sm:pl-8">
              {innovation.target_group && (
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-stone-800">
                    Bezpośrednia grupa docelowa
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mt-0.5">
                    {innovation.target_group}
                  </p>
                </div>
              )}
              {innovation.beneficiaries && (
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-stone-800">
                    Ostateczni beneficjenci
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mt-0.5">
                    {innovation.beneficiaries}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Finansowanie (jeśli dostępne) */}
        {innovation.funding_info && (
          <>
            <hr className="border-t border-black/5" />
            <section className="space-y-2">
              <h2 className="flex items-center gap-2 text-xs sm:text-sm font-bold text-stone-900">
                <span className="w-6 h-6 rounded-lg bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-700 shrink-0">
                  <Coins className="w-3.5 h-3.5" />
                </span>
                <span>Finansowanie</span>
              </h2>
              <div className="text-xs sm:text-sm text-stone-600 pl-0 sm:pl-8 leading-relaxed">
                <p>{innovation.funding_info}</p>
              </div>
            </section>
          </>
        )}
      </article>

      {/* Przycisk przejścia do formularza adaptacji */}
      <div className="flex justify-end pt-1">
        <button
          type="button"
          onClick={onProceed}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-stone-900 hover:bg-stone-800 text-white shadow-2xs transition-all cursor-pointer"
        >
          <span>Uzupełnij formularz</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
