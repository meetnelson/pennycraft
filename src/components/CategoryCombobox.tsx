import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Tag, Check } from 'lucide-react';

interface CategoryComboboxProps {
  value: string;
  onChange: (newValue: string) => void;
  categories: string[];
  placeholder?: string;
}

export const CategoryCombobox: React.FC<CategoryComboboxProps> = ({
  value,
  onChange,
  categories,
  placeholder = 'Select or type a new category...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const trimmedInput = value.trim();

  const filteredCategories = categories.filter((cat) =>
    cat.toLowerCase().includes(trimmedInput.toLowerCase())
  );

  const exactMatchExists = categories.some(
    (cat) => cat.toLowerCase() === trimmedInput.toLowerCase()
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        if (value !== value.trim()) {
          onChange(value.trim());
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value, onChange]);

  const handleSelect = (category: string) => {
    onChange(category.trim());
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative flex items-center">
        <Tag className="w-3.5 h-3.5 text-[#63726A] absolute left-3.5 pointer-events-none" />
        <input
          type="text"
          value={value}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            onChange(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onBlur={() => {
            setTimeout(() => {
              if (value !== value.trim()) {
                onChange(value.trim());
              }
            }, 150);
          }}
          placeholder={placeholder}
          className="w-full pl-9 pr-9 py-2.5 bg-[#FAFBFA] border border-[#E8ECE9] focus:border-[#42685B] focus:bg-white rounded-2xl text-sm font-normal text-[#303C36] placeholder:text-[#63726A]/70 focus:outline-none transition-all"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setIsOpen((prev) => !prev)}
          className="absolute right-2.5 p-1 text-[#63726A] hover:text-[#303C36] rounded-lg"
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-150 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] py-2 max-h-56 overflow-y-auto border border-[#E8ECE9]">
          {filteredCategories.length > 0 ? (
            <div className="px-1.5 space-y-0.5">
              <div className="px-2.5 py-1 text-[11px] font-normal text-[#63726A]">
                Saved Categories
              </div>
              {filteredCategories.map((cat) => {
                const isSelected =
                  cat.toLowerCase() === trimmedInput.toLowerCase();
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleSelect(cat)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs sm:text-sm font-normal transition-colors ${
                      isSelected
                        ? 'bg-[#42685B]/10 text-[#42685B] font-semibold'
                        : 'text-[#303C36] hover:bg-[#FAFBFA]'
                    }`}
                  >
                    <span>{cat}</span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-[#42685B]" />
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            !trimmedInput && (
              <div className="px-4 py-3 text-xs text-[#63726A] text-center">
                Type to create your first category
              </div>
            )
          )}

          {trimmedInput.length > 0 && !exactMatchExists && (
            <div className="px-1.5 pt-1 mt-1 border-t border-[#E8ECE9]">
              <button
                type="button"
                onClick={() => handleSelect(trimmedInput)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs font-medium text-[#42685B] bg-[#42685B]/10 hover:bg-[#42685B]/15 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  Create category:{' '}
                  <strong className="font-medium">"{trimmedInput}"</strong>
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
