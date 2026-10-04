"use client";

import React from "react";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Video,
  Users2,
  Sparkles,
  Target,
  Coins,
  FileText,
  Layers,
  HeartHandshake,
  CheckCircle2,
} from "lucide-react";
import { InnovationRecord } from "../../lib/types";
import { getYoutubeEmbedUrl } from "../../lib/middleman";

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
  const embedUrl = innovation.video_url
    ? getYoutubeEmbedUrl(innovation.video_url)
    : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Pasek nawigacji górnej */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="self-start inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-stone-700 hover:text-stone-900 bg-white border border-black/10 hover:bg-stone-50 transition-colors cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Wróć do listy innowacji</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {innovation.url && (
            <a
              href={innovation.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-stone-700 hover:text-stone-900 bg-white border border-black/10 hover:bg-stone-50 transition-colors shadow-2xs"
            >
              <span>Karta w bazie ROPS</span>
              <ExternalLink className="w-3 h-3 text-stone-400" />
            </a>
          )}
          {innovation.video_url && (
            <a
              href={innovation.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors shadow-2xs"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Otwórz w YouTube</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <button
            type="button"
            onClick={onProceed}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-stone-900 hover:bg-stone-800 text-white transition-all shadow-2xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#EFE5C6]" />
            <span>Dostosuj do formy usługi</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Nagłówek innowacji (Hero) */}
      <div
        className="rounded-[28px] p-6 sm:p-8 border border-black/5 shadow-2xs space-y-4"
        style={{
          background:
            "radial-gradient(circle at 14% 14%, #FAF4E5 0%, #FFFFFF 48%, #FAFAF8 80%, #F5F5F0 100%)",
        }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-block px-3 py-1 bg-stone-900 text-white rounded-xl text-[10px] font-extrabold uppercase tracking-wider">
            {innovation.category || "Innowacja społeczna ROPS"}
          </span>
          {innovation.video_url && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 border border-red-200 rounded-xl text-[10px] font-bold uppercase tracking-wider">
              <Video className="w-3 h-3 text-red-600" />
              <span>Wideo YouTube</span>
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 tracking-tight leading-tight">
          {innovation.title}
        </h1>

        {innovation.target_group && (
          <div className="flex items-center gap-2 text-stone-700 text-sm font-medium">
            <span className="w-7 h-7 rounded-lg bg-stone-100 border border-black/5 flex items-center justify-center shrink-0">
              <Users2 className="w-4 h-4 text-stone-600" />
            </span>
            <span>
              <strong className="text-stone-900">Grupa docelowa: </strong>
              {innovation.target_group}
            </span>
          </div>
        )}
      </div>

      {/* Jedna spójna karta ze wszystkimi sekcjami merytorycznymi innowacji */}
      <article className="bg-white rounded-[28px] border border-black/5 p-6 sm:p-10 shadow-2xs space-y-8">
        {/* Wideo z YouTube (jeśli video_url nie jest null) */}
        {innovation.video_url && (
          <>
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-stone-900">
                  <span className="w-8 h-8 rounded-xl bg-red-50 border border-red-200/60 flex items-center justify-center text-red-600 shrink-0">
                    <Video className="w-4 h-4" />
                  </span>
                  <span>Prezentacja wideo innowacji</span>
                </h2>
                <a
                  href={innovation.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-stone-500 hover:text-stone-900 inline-flex items-center gap-1 transition-colors"
                >
                  <span>Otwórz w YouTube</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {embedUrl ? (
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-inner border border-black/10">
                  <iframe
                    src={embedUrl}
                    title={`Prezentacja innowacji wideo: ${innovation.title}`}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-stone-50 border border-black/5 flex items-center justify-between gap-3">
                  <span className="text-sm text-stone-600">
                    Obejrzyj oficjalną prezentację wideo innowacji
                  </span>
                  <a
                    href={innovation.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors"
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
          <section className="space-y-2.5">
            <h2 className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-stone-900">
              <span className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-700 shrink-0">
                <Target className="w-4 h-4" />
              </span>
              <span>Rozwiązywane problemy społeczne i diagnoza</span>
            </h2>
            <div className="text-sm sm:text-base text-stone-700 leading-relaxed whitespace-pre-line pl-0 sm:pl-10.5">
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
          <section className="space-y-2.5">
            <h2 className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-stone-900">
              <span className="w-8 h-8 rounded-xl bg-stone-100 border border-black/5 flex items-center justify-center text-stone-800 shrink-0">
                <FileText className="w-4 h-4" />
              </span>
              <span>Opis innowacji i mechanizm działania</span>
            </h2>
            <div className="text-sm sm:text-base text-stone-700 leading-relaxed whitespace-pre-line pl-0 sm:pl-10.5">
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
          <section className="space-y-3">
            <h2 className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-stone-900">
              <span className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-700 shrink-0">
                <HeartHandshake className="w-4 h-4" />
              </span>
              <span>Odbiorcy i beneficjenci</span>
            </h2>
            <div className="space-y-4 pl-0 sm:pl-10.5">
              {innovation.target_group && (
                <div>
                  <h3 className="text-sm sm:text-base font-semibold text-stone-900">
                    Bezpośrednia grupa docelowa
                  </h3>
                  <p className="text-sm sm:text-base text-stone-700 leading-relaxed mt-1">
                    {innovation.target_group}
                  </p>
                </div>
              )}
              {innovation.beneficiaries && (
                <div>
                  <h3 className="text-sm sm:text-base font-semibold text-stone-900">
                    Ostateczni beneficjenci
                  </h3>
                  <p className="text-sm sm:text-base text-stone-700 leading-relaxed mt-1">
                    {innovation.beneficiaries}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Divider */}
        {(innovation.funding_info || innovation.url) && (
          <>
            <hr className="border-t border-black/5" />
            <section className="space-y-2.5">
              <h2 className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-stone-900">
                <span className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-700 shrink-0">
                  <Coins className="w-4 h-4" />
                </span>
                <span>Finansowanie i materiały źródłowe</span>
              </h2>
              <div className="space-y-2 text-sm sm:text-base text-stone-700 pl-0 sm:pl-10.5 leading-relaxed">
                {innovation.funding_info ? (
                  <p>{innovation.funding_info}</p>
                ) : (
                  <p className="text-stone-500 text-sm">
                    Innowacja sfinansowana i przetestowana w ramach programu
                    inkubacji ROPS Kraków.
                  </p>
                )}
                {innovation.url && (
                  <div className="pt-1">
                    <a
                      href={innovation.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-semibold text-sm text-stone-900 underline underline-offset-4 hover:text-stone-600 transition-colors"
                    >
                      <span>
                        Zobacz oryginalną kartę innowacji w bazie ROPS
                      </span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
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
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl text-sm sm:text-base font-semibold bg-stone-900 hover:bg-stone-800 text-white shadow-2xs transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-[#EFE5C6]" />
          <span>Stwórz kartę usługi</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
