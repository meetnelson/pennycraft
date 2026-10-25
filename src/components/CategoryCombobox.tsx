import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Tag, Check, Settings2 } from 'lucide-react';

interface CategoryComboboxProps {
  value: string;
  onChange: (newValue: string) => void;
  categories: string[];
  placeholder?: string;
  onAddNewCategory?: (categoryName: string) => void;
  onOpenCategoryManager?: () => void;
}

export const CategoryCombobox: React.FC<CategoryComboboxProps> = ({
  value,
  onChange,
  categories,
  placeholder = 'Select or type a new category...',
  onAddNewCategory,
  onOpenCategoryManager,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customDraft, setCustomDraft] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const customInputRef = useRef<HTMLInputElement>(null);

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
        setIsAddingCustom(false);
        if (value !== value.trim()) {
          onChange(value.trim());
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value, onChange]);

  const handleSelect = (category: string) => {
    const clean = category.trim();
    if (!clean) return;
    onAddNewCategory?.(clean);
    onChange(clean);
    setIsAddingCustom(false);
    setCustomDraft('');
    setIsOpen(false);
  };

  const handleConfirmCustomDraft = () => {
    const clean = customDraft.trim();
    if (!clean) return;
    handleSelect(clean);
  };

  return (
    <div ref={containerRef} className="relative space-y-2">
      <div className="relative flex items-center">
        <Tag className="w-3.5 h-3.5 text-[#64748B] absolute left-3.5 pointer-events-none" />
        <input
          ref={inputRef}
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
          className="w-full pl-9 pr-9 py-2.5 bg-white border border-slate-200 focus:border-[#2A8C82] focus:ring-1 focus:ring-[#2A8C82] outline-none rounded-2xl text-sm font-normal text-[#2D3134] placeholder:text-[#64748B] transition-all"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label="Toggle category dropdown"
          className="absolute right-2.5 p-1 text-[#64748B] hover:text-[#2D3134] rounded-lg"
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-150 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {/* Inline Custom Category Creation Box when "+ Add New Category" is clicked */}
      {isAddingCustom && (
        <div className="p-3 rounded-2xl bg-[#F8F9FA] border border-slate-200 flex items-center gap-2">
          <input
            ref={customInputRef}
            type="text"
            value={customDraft}
            onChange={(e) => setCustomDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleConfirmCustomDraft();
              }
              if (e.key === 'Escape') {
                setIsAddingCustom(false);
                setCustomDraft('');
              }
            }}
            placeholder="Type custom category name..."
            className="flex-1 px-3 py-1.5 bg-white border border-slate-200 focus:border-[#2A8C82] focus:ring-1 focus:ring-[#2A8C82] outline-none rounded-xl text-xs font-medium text-[#2D3134] placeholder:text-[#64748B]"
          />
          <button
            type="button"
            onClick={handleConfirmCustomDraft}
            disabled={!customDraft.trim()}
            className="px-3 py-1.5 rounded-xl bg-[#2A8C82] hover:bg-[#23736B] disabled:opacity-40 text-white text-xs font-medium transition-colors"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setIsAddingCustom(false);
              setCustomDraft('');
            }}
            className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-[#64748B] hover:text-[#2D3134] text-xs font-normal transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-2xl shadow-md py-2 max-h-64 overflow-y-auto border border-slate-200">
          {filteredCategories.length > 0 ? (
            <div className="px-1.5 space-y-0.5">
              <div className="px-2.5 py-1 text-[11px] font-normal text-[#64748B]">
                Existing Categories
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
                        ? 'bg-[#2A8C82]/10 text-[#2A8C82] font-semibold'
                        : 'text-[#2D3134] hover:bg-[#F8F9FA]'
                    }`}
                  >
                    <span>{cat}</span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-[#2A8C82]" />
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            !trimmedInput && (
              <div className="px-4 py-3 text-xs text-[#64748B] text-center">
                No categories saved yet
              </div>
            )
          )}

          <div className="px-1.5 pt-1.5 mt-1 border-t border-slate-200 space-y-1">
            {trimmedInput.length > 0 && !exactMatchExists ? (
              <button
                type="button"
                onClick={() => handleSelect(trimmedInput)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs font-medium text-[#2A8C82] bg-[#2A8C82]/10 hover:bg-[#2A8C82]/15 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  + Add New Category:{' '}
                  <strong className="font-semibold">
                    &ldquo;{trimmedInput}&rdquo;
                  </strong>
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsAddingCustom(true);
                  setTimeout(() => customInputRef.current?.focus(), 50);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs font-medium text-[#2A8C82] hover:bg-[#2A8C82]/10 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span>+ Add New Category</span>
              </button>
            )}

            {onOpenCategoryManager && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenCategoryManager();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs font-normal text-[#64748B] hover:text-[#2D3134] hover:bg-[#F8F9FA] transition-colors"
              >
                <Settings2 className="w-3.5 h-3.5 shrink-0" />
                <span>Manage Categories (Rename / Delete)</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
