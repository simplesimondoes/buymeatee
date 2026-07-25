"use client";

import { Check, ChevronDown } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

export interface CountryOption {
  code: string;
  label: string;
  /** Emoji flag; may be empty on platforms without flag glyphs. */
  flag: string;
}

/**
 * Accessible, on-brand country picker. A native <select> can't be styled
 * beyond the OS-drawn option list, which looked unbranded, so this is a
 * hand-rolled listbox following the WAI-ARIA pattern.
 *
 * Behaviour mirrors components/account-menu.tsx (the house disclosure
 * pattern — no headless UI library is installed): Escape and outside-click
 * close it, focus returns to the trigger on close, and Up/Down/Home/End move
 * the active option via aria-activedescendant. Flags are always paired with
 * the country name — never shown alone — since flag glyphs degrade to letters
 * on some platforms.
 */
export function CountrySelect({
  value,
  onChange,
  options,
  id,
  label,
}: {
  value: string;
  onChange: (code: string) => void;
  options: CountryOption[];
  /** Id for the trigger button, so an external <label> can point at it. */
  id?: string;
  /** Accessible name for the trigger and listbox — pass a translated string. */
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const generatedId = useId();
  const baseId = id ?? generatedId;
  const listId = `${baseId}-listbox`;
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.code === value),
  );
  const selected = options[selectedIndex];
  const [activeIndex, setActiveIndex] = useState(selectedIndex);

  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  }, []);

  // Open with the active option synced to the current selection.
  const openMenu = useCallback(() => {
    setActiveIndex(selectedIndex);
    setOpen(true);
  }, [selectedIndex]);

  // Close on outside click / focus leaving.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        close(false);
      }
    };
    const onFocusIn = (event: FocusEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("focusin", onFocusIn);
    };
  }, [open, close]);

  // Move focus into the list once it opens so arrow keys work immediately.
  useEffect(() => {
    if (open) listRef.current?.focus();
  }, [open]);

  const commit = (index: number) => {
    const option = options[index];
    if (option) onChange(option.code);
    close();
  };

  const onListKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((index) => (index + 1) % options.length);
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((index) => (index - 1 + options.length) % options.length);
        break;
      case "Home":
        event.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        event.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        commit(activeIndex);
        break;
      case "Escape":
        event.preventDefault();
        close();
        break;
      case "Tab":
        close(false);
        break;
      default:
        break;
    }
  };

  const activeOption = options[activeIndex];

  return (
    <div ref={containerRef} className="relative max-w-xs">
      <button
        ref={buttonRef}
        type="button"
        id={baseId}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={selected ? `${label}: ${selected.label}` : label}
        onClick={() => (open ? close(false) : openMenu())}
        onKeyDown={(event) => {
          if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
            event.preventDefault();
            openMenu();
          }
        }}
        className="mt-1.5 flex min-h-11 w-full items-center gap-2 rounded-xl border border-stone bg-white px-4 py-2.5 text-base text-ink transition-colors hover:border-forest focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20"
      >
        <span aria-hidden="true" className="text-lg leading-none">
          {selected?.flag}
        </span>
        <span className="flex-1 text-left">{selected?.label}</span>
        <ChevronDown
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 text-ink/50 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open ? (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={label}
          aria-activedescendant={
            activeOption ? `${baseId}-opt-${activeOption.code}` : undefined
          }
          tabIndex={-1}
          onKeyDown={onListKeyDown}
          className="absolute z-50 mt-2 max-h-72 w-full overflow-auto rounded-2xl border border-stone bg-white p-1.5 shadow-lg focus:outline-none"
        >
          {options.map((option, index) => {
            const isSelected = option.code === value;
            const isActive = index === activeIndex;
            return (
              <li
                key={option.code}
                id={`${baseId}-opt-${option.code}`}
                role="option"
                aria-selected={isSelected}
                onClick={() => commit(index)}
                onMouseEnter={() => setActiveIndex(index)}
                className={`flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors ${
                  isActive ? "bg-forest/5 text-forest" : "text-ink/80"
                }`}
              >
                <span aria-hidden="true" className="text-lg leading-none">
                  {option.flag}
                </span>
                <span className="flex-1">{option.label}</span>
                {isSelected ? (
                  <Check aria-hidden="true" className="h-4 w-4 shrink-0 text-forest" />
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
