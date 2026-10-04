"use client";

import React, { useEffect, useState } from "react";
import { Download, Loader2, X } from "lucide-react";
import { downloadUrl, fetchApplicationPdf, pdfFileName } from "../../lib/grantsApi";

interface Props {
  applicationId: string;
  title?: string | null;
  onClose: () => void;
}

export function PdfPreviewModal({ applicationId, title, onClose }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    fetchApplicationPdf(applicationId).then(
      (blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      },
      (e) => !cancelled && setError(e instanceof Error ? e.message : "Nie udało się wygenerować PDF."),
    );
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [applicationId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col border border-stone-200 shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-stone-100">
          <h3 className="text-sm font-bold text-stone-900 truncate">{title || "Wniosek"} – PDF</h3>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => url && downloadUrl(url, pdfFileName(applicationId, title))}
              disabled={!url}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-semibold disabled:opacity-40 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Pobierz
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 bg-stone-100">
          {url ? (
            <iframe src={url} title="Podgląd PDF" className="w-full h-full border-0" />
          ) : error ? (
            <div className="h-full flex items-center justify-center text-xs text-rose-700 p-6 text-center">{error}</div>
          ) : (
            <div className="h-full flex items-center justify-center gap-2 text-xs text-stone-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Generowanie PDF...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
