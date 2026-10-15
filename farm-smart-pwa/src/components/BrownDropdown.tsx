"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { twMerge } from "tailwind-merge";

export interface DropdownOption {
  value: string;
  label: string;
}

interface Props {
  options: DropdownOption[];
  value: string;
  label: string;
  onChange: (value: string) => void;
  className?: string;
  id?: string;
}

export default function BrownDropdown({ options, value, label, onChange, className, id }: Props) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(Math.max(0, options.findIndex((option) => option.value === value)));
  const listboxId = `${useId()}-options`;
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const selectedOption = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (open) optionRefs.current[activeIndex]?.focus();
  }, [open, activeIndex]);

  useEffect(() => {
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, []);

  const focusOption = (index: number) => {
    if (!options.length) return;
    const nextIndex = (index + options.length) % options.length;
    setActiveIndex(nextIndex);
    optionRefs.current[nextIndex]?.focus();
  };

  const openList = () => {
    setActiveIndex(selectedIndex);
    setOpen(true);
  };

  const choose = (option: DropdownOption) => {
    onChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  if (!selectedOption) return null;

  return (
    <div ref={containerRef} className="relative min-w-0">
      <button
        ref={triggerRef}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={label}
        onClick={() => open ? setOpen(false) : openList()}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            openList();
          }
        }}
        className={twMerge("flex w-full items-center justify-between rounded-xl border border-[#765337]/60 bg-surface px-3 py-2.5 text-left text-sm text-leaf-900 outline-none transition focus:border-[#765337] focus:ring-2 focus:ring-[#765337]/25", className)}
      >
        <span className="min-w-0 truncate">{selectedOption.label}</span>
        <ChevronDown size={16} className={`ml-2 shrink-0 text-[#765337] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="listbox"
          id={listboxId}
          aria-label={label}
          className="absolute z-50 mt-1 max-h-60 w-full min-w-max overflow-y-auto rounded-xl border border-[#765337] bg-surface p-1 shadow-xl"
        >
          {options.map((option, index) => {
            const selected = option.value === value;
            const active = index === activeIndex;
            return (
              <button
                key={`${option.value}-${index}`}
                ref={(element) => { optionRefs.current[index] = element; }}
                type="button"
                role="option"
                aria-selected={selected}
                tabIndex={active ? 0 : -1}
                onFocus={() => setActiveIndex(index)}
                onClick={() => choose(option)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    focusOption(index + 1);
                  } else if (event.key === "ArrowUp") {
                    event.preventDefault();
                    focusOption(index - 1);
                  } else if (event.key === "Home") {
                    event.preventDefault();
                    focusOption(0);
                  } else if (event.key === "End") {
                    event.preventDefault();
                    focusOption(options.length - 1);
                  } else if (event.key === "Escape") {
                    event.preventDefault();
                    setOpen(false);
                    triggerRef.current?.focus();
                  } else if (event.key === "Tab") {
                    setOpen(false);
                  }
                }}
                className={`block w-full rounded-lg px-3 py-2 text-left text-sm outline-none transition ${selected ? "bg-[#765337] font-semibold text-white" : "text-leaf-900 hover:bg-[#765337]/10 focus:bg-[#765337]/10"} ${active && !selected ? "ring-2 ring-inset ring-[#765337]/40" : ""}`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
