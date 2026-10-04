"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Download, Loader2, X } from "lucide-react";
import {
  downloadUrl,
  fetchApplicationPdf,
  pdfFileName,
} from "../../lib/grantsApi";

interface Props {
  applicationId: string;
  title?: string | null;
  onClose: () => void;
}

export function PdfPreviewModal({ applicationId, title, onClose }: Props) {
  const pagesRef = useRef<HTMLDivElement>(null);
  const [downloadBlobUrl, setDownloadBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [rendering, setRendering] = useState(true);

  useEffect(() => {
    const host = pagesRef.current;
    if (!host) return;
    let cancelled = false;
    let blobUrl: string | null = null;
    let destroyDoc: (() => void) | null = null;

    (async () => {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

      const blob = await fetchApplicationPdf(applicationId);
      if (cancelled) return;
      const bytes = new Uint8Array(await blob.arrayBuffer());
      blobUrl = URL.createObjectURL(
        new Blob([bytes], { type: "application/pdf" }),
      );
      setDownloadBlobUrl(blobUrl);

      const task = pdfjs.getDocument({ data: bytes });
      destroyDoc = () => {
        void task.destroy();
      };
      const pdf = await task.promise;
      if (cancelled) return;

      host.replaceChildren();
      const width = Math.max(host.clientWidth - 32, 320);
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        if (cancelled) return;
        const page = await pdf.getPage(pageNumber);
        const base = page.getViewport({ scale: 1 });
        const scale = width / base.width;
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.className = "w-full h-auto bg-white shadow-sm";
        canvas.setAttribute("aria-label", `Strona ${pageNumber}`);
        const context = canvas.getContext("2d");
        if (!context) continue;
        await page.render({ canvas, canvasContext: context, viewport }).promise;
        if (cancelled) return;
        host.appendChild(canvas);
      }
      setRendering(false);
    })().catch((e) => {
      if (cancelled) return;
      setRendering(false);
      setError(
        e instanceof Error ? e.message : "Nie udało się wygenerować PDF.",
      );
    });

    return () => {
      cancelled = true;
      destroyDoc?.();
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [applicationId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-stone-900/50 backdrop-blur-2xs"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-[#1C1E23] rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col border border-stone-200 dark:border-white/10 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-stone-100 dark:border-white/10">
          <h3 className="text-sm font-bold text-stone-900 dark:text-white truncate">
            {title || "Wniosek"} – PDF
          </h3>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() =>
                downloadBlobUrl &&
                downloadUrl(downloadBlobUrl, pdfFileName(applicationId, title))
              }
              disabled={!downloadBlobUrl}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 dark:bg-white text-white dark:text-stone-950 rounded-xl text-xs font-semibold disabled:opacity-40 cursor-pointer shadow-2xs hover:bg-stone-800 dark:hover:bg-stone-100 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Pobierz
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-white/10 text-stone-500 cursor-pointer"
              aria-label="Zamknij podgląd"
            >
              <X className="w-4 h-4" />
            </button>{" "}
            d
          </div>
        </div>
        <div className="relative flex-1 min-h-0 bg-stone-100 dark:bg-[#14161A]">
          {rendering && !error && (
            <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 text-xs text-stone-500 dark:text-stone-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              Generowanie PDF...
            </div>
          )}
          {error && (
            <div className="absolute inset-0 z-10 flex items-center justify-center text-xs text-rose-700 dark:text-rose-400 p-6 text-center">
              {error}
            </div>
          )}
          <div
            ref={pagesRef}
            className="h-full overflow-y-auto p-4 space-y-3"
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
