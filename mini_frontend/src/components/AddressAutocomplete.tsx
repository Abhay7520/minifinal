import { useCallback, useEffect, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { searchAddresses } from "@/services/addressService";
import type { AddressSuggestion } from "@/types/address";
import { cn } from "@/lib/utils";

interface AddressAutocompleteProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: AddressSuggestion) => void;
  placeholder?: string;
  accent?: "orange" | "violet";
  className?: string;
  minRows?: number;
}

const accentMap = {
  orange: {
    icon: "text-orange-400/60",
    active: "border-orange-500/40 bg-orange-500/5",
    highlight: "text-orange-400",
  },
  violet: {
    icon: "text-violet-400/60",
    active: "border-violet-500/40 bg-violet-500/5",
    highlight: "text-violet-400",
  },
};

export default function AddressAutocomplete({
  id,
  label,
  value,
  onChange,
  onSelect,
  placeholder,
  accent = "orange",
  className,
  minRows = 3,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const colors = accentMap[accent];

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    try {
      const results = await searchAddresses(query);
      setSuggestions(results);
      setOpen(results.length > 0);
      setActiveIndex(-1);
    } catch {
      setSuggestions([]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 280);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, fetchSuggestions]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (item: AddressSuggestion) => {
    onChange(item.label);
    onSelect(item);
    setOpen(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!open || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={cn("space-y-1.5 relative", className)}>
      <label htmlFor={id} className="text-xs font-bold uppercase tracking-widest text-white/40">
        {label}
      </label>
      <div className="relative">
        <MapPin className={cn("absolute left-3.5 top-3.5 h-4 w-4 z-10", colors.icon)} />
        {loading && (
          <Loader2 className="absolute right-3.5 top-3.5 h-4 w-4 animate-spin text-white/30 z-10" />
        )}
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={minRows}
          autoComplete="off"
          className={cn(
            "w-full pl-10 pr-10 min-h-[72px] resize-none rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/20",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange-500/50 focus-visible:border-orange-500/40 transition-all"
          )}
        />

        {open && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-[100] mt-1.5 overflow-hidden rounded-xl border border-white/15 bg-[#0c0c16] shadow-2xl shadow-black/60">
            <div className="px-3 py-2 border-b border-white/5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">
                AI Address Suggestions
              </p>
            </div>
            <ul className="max-h-56 overflow-y-auto py-1">
              {suggestions.map((item, idx) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(item)}
                    className={cn(
                      "flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white/5",
                      idx === activeIndex && colors.active
                    )}
                  >
                    <MapPin className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", colors.highlight)} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white truncate">{item.label}</p>
                      <p className="text-[11px] text-white/40">
                        {item.locality} · {item.city} · Match {item.score.toFixed(0)}%
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
