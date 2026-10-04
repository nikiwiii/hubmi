"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps<T extends string = string> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  labelPrefix?: string;
  className?: string;
  fullWidth?: boolean;
  size?: "sm" | "md";
  placeholder?: string;
  error?: boolean;
  id?: string;
}

export function CustomSelect<T extends string = string>({
  value,
  onChange,
  options,
  labelPrefix,
  className = "",
  fullWidth = false,
  size = "sm",
  placeholder,
  error = false,
  id,
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const isMd = size === "md";

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key and navigate with ArrowUp/ArrowDown
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleListKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const currentIndex = options.findIndex((o) => o.value === value);
      const nextIndex = (currentIndex + 1) % options.length;
      onChange(options[nextIndex].value);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const currentIndex = options.findIndex((o) => o.value === value);
      const prevIndex = (currentIndex - 1 + options.length) % options.length;
      onChange(options[prevIndex].value);
    }
  };

  const hasSelection = Boolean(selectedOption && selectedOption.value !== "");
  const displayText = hasSelection
    ? selectedOption!.label
    : placeholder || options[0]?.label || "";

  return (
    <div
      ref={containerRef}
      onKeyDown={handleListKeyDown}
      className={`relative ${fullWidth ? "w-full block" : "inline-block"} ${className}`}
    >
      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={labelPrefix ? `${labelPrefix} ${displayText}` : displayText}
        className={`${
          isMd
            ? `w-full min-h-[38px] px-3.5 py-2 bg-white dark:bg-[#1C1E23] hover:bg-stone-50 dark:hover:bg-white/5 border rounded-xl text-sm flex items-center justify-between transition-all cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-amber-400 ${
                error
                  ? "border-red-500 focus:border-red-600"
                  : isOpen
                    ? "border-stone-900 dark:border-white ring-2 ring-stone-900/15 dark:ring-white/20"
                    : "border-black/10 dark:border-white/15 hover:border-black/25 dark:hover:border-white/30"
              }`
            : "min-h-[32px] px-3 py-1.5 bg-white dark:bg-[#1C1E23] hover:bg-stone-50 dark:hover:bg-white/5 active:bg-stone-100 dark:active:bg-white/10 border border-stone-300 dark:border-white/15 hover:border-stone-400 dark:hover:border-white/30 rounded-xl text-xs font-semibold text-stone-900 dark:text-stone-100 shadow-2xs flex items-center gap-2 transition-all cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-amber-400"
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden text-left">
          {labelPrefix && (
            <span className="text-stone-600 dark:text-stone-400 font-medium shrink-0">
              {labelPrefix}
            </span>
          )}
          {selectedOption?.icon && (
            <span className="text-stone-700 dark:text-stone-300 shrink-0" aria-hidden="true">
              {selectedOption.icon}
            </span>
          )}
          <span
            className={`truncate ${
              !hasSelection && placeholder
                ? "text-stone-600 dark:text-stone-400 font-medium"
                : isMd
                  ? "font-medium text-stone-950 dark:text-white"
                  : "font-semibold text-stone-900 dark:text-white"
            }`}
          >
            {displayText}
          </span>
        </div>

        <ChevronDown
          aria-hidden="true"
          className={`${isMd ? "w-4 h-4 ml-2" : "w-3.5 h-3.5"} text-stone-600 dark:text-stone-400 shrink-0 transition-transform duration-200 ease-out ${
            isOpen ? "rotate-180 text-stone-900 dark:text-white" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          tabIndex={-1}
          aria-label={labelPrefix || "Wybierz opcję"}
          className={`absolute ${
            fullWidth ? "left-0 right-0 w-full" : "right-0 min-w-[190px]"
          } top-full mt-1.5 max-h-64 overflow-y-auto bg-white dark:bg-[#1C1E23] border border-stone-300 dark:border-white/15 rounded-2xl shadow-xl p-1.5 z-40 animate-in fade-in zoom-in-95 duration-150 origin-top divide-y divide-stone-100/60 dark:divide-white/10`}
        >
          <div className="space-y-0.5">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full ${
                    isMd ? "px-3.5 py-2.5 text-sm" : "px-3 py-2 text-xs"
                  } rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer select-none ${
                    isSelected
                      ? "bg-stone-100 dark:bg-white/15 text-stone-900 dark:text-white font-semibold"
                      : "text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-white/10 hover:text-stone-900 dark:hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    {option.icon && (
                      <span
                        className={`shrink-0 ${
                          isSelected ? "text-stone-900 dark:text-white" : "text-stone-400 dark:text-stone-400"
                        }`}
                      >
                        {option.icon}
                      </span>
                    )}
                    <span className="truncate">{option.label}</span>
                  </div>

                  {isSelected && (
                    <Check
                      className={`${
                        isMd ? "w-4 h-4" : "w-3.5 h-3.5"
                      } text-stone-900 dark:text-white shrink-0 ml-2`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
