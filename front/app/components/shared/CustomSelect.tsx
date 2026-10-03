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

  // Close on Escape key
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

  const hasSelection = Boolean(selectedOption && selectedOption.value !== "");
  const displayText = hasSelection
    ? selectedOption!.label
    : placeholder || options[0]?.label || "";

  return (
    <div
      ref={containerRef}
      className={`relative ${fullWidth ? "w-full block" : "inline-block"} ${className}`}
    >
      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`${
          isMd
            ? `w-full px-4 py-3 bg-white hover:bg-stone-50/70 border rounded-xl text-base flex items-center justify-between transition-all cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-stone-900/15 ${
                error
                  ? "border-red-400 focus:border-red-500"
                  : isOpen
                  ? "border-stone-900/30 ring-2 ring-stone-900/10"
                  : "border-black/10 hover:border-black/20"
              }`
            : "px-3 py-1.5 bg-white hover:bg-stone-50/80 active:bg-stone-100 border border-stone-200/80 hover:border-stone-300 rounded-xl text-xs font-medium text-stone-700 shadow-2xs flex items-center gap-2 transition-all cursor-pointer select-none"
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden text-left">
          {labelPrefix && (
            <span className="text-stone-400 font-normal shrink-0">{labelPrefix}</span>
          )}
          {selectedOption?.icon && (
            <span className="text-stone-500 shrink-0">{selectedOption.icon}</span>
          )}
          <span
            className={`truncate ${
              !hasSelection && placeholder
                ? "text-stone-400 font-normal"
                : isMd
                ? "font-medium text-stone-900"
                : "font-semibold text-stone-800"
            }`}
          >
            {displayText}
          </span>
        </div>

        <ChevronDown
          className={`${isMd ? "w-4 h-4 ml-2" : "w-3.5 h-3.5"} text-stone-400 shrink-0 transition-transform duration-200 ease-out ${
            isOpen ? "rotate-180 text-stone-700" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          className={`absolute ${
            fullWidth ? "left-0 right-0 w-full" : "right-0 min-w-[180px]"
          } top-full mt-1.5 max-h-64 overflow-y-auto bg-white border border-stone-200/90 rounded-2xl shadow-xl p-1.5 z-40 animate-in fade-in zoom-in-95 duration-150 origin-top divide-y divide-stone-100/60`}
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
                      ? "bg-stone-100 text-stone-900 font-semibold"
                      : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    {option.icon && (
                      <span
                        className={`shrink-0 ${
                          isSelected ? "text-stone-900" : "text-stone-400"
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
                      } text-stone-900 shrink-0 ml-2`}
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
