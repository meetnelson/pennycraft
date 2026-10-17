import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  RotateCcw,
  Cloud,
  Check,
  LogOut,
  Loader2,
} from 'lucide-react';
import { ActiveTab } from '../types/pricing';

interface NavbarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenAddModal: () => void;
  counts?: {
    products: number;
    rules: number;
    materials: number;
    packaging: number;
    labor: number;
  };
  staleCounts?: {
    products: number;
    materials: number;
    packaging: number;
  };
  userEmail?: string | null;
  isSyncingCloud?: boolean;
  onOpenAuthModal: () => void;
  onSignOut: () => void;
  onResetDemo: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenAddModal,
  userEmail,
  isSyncingCloud,
  onOpenAuthModal,
  onSignOut,
  onResetDemo,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems: {
    id: ActiveTab;
    label: string;
  }[] = [
    { id: 'products', label: 'Products' },
    { id: 'rules', label: 'Pricing Rules' },
    { id: 'materials', label: 'Materials' },
    { id: 'packaging', label: 'Packaging' },
    { id: 'labor', label: 'Labor Rates' },
  ];

  const userInitial = userEmail ? userEmail.charAt(0).toUpperCase() : 'U';

  return (
    <header className="sticky top-0 z-30 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-nowrap h-16 px-6 bg-white rounded-3xl border border-slate-100 shadow-sm my-4 gap-4">
        {/* Left: App Branding */}
        <div className="flex items-center gap-3 shrink-0 whitespace-nowrap">
          <div className="w-9 h-9 rounded-2xl bg-coral-50 border border-coral-100/80 flex items-center justify-center text-[#E07A5F] shrink-0">
            <Sparkles className="w-4 h-4 stroke-[2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-semibold tracking-tight text-slate-800">
                PennyCraft
              </span>
              <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-[#E07A5F]/80" />
            </div>
            <p className="text-[11px] font-normal text-slate-400 leading-none mt-0.5">
              Smart Pricing Studio
            </p>
          </div>
        </div>

        {/* Center: Segmented Pill Navigation */}
        <nav
          aria-label="Main Navigation"
          className="bg-slate-100/80 p-1 rounded-2xl flex items-center gap-1 flex-nowrap overflow-x-auto no-scrollbar min-w-0"
        >
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={
                  isActive
                    ? 'bg-white text-slate-900 font-semibold shadow-xs rounded-xl px-4 py-1.5 text-xs transition-all whitespace-nowrap shrink-0'
                    : 'text-slate-500 hover:text-slate-800 font-medium rounded-xl px-4 py-1.5 text-xs transition-colors whitespace-nowrap shrink-0'
                }
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right: Compact User Avatar / Cloud Sign-In + Add Item Button */}
        <div className="flex items-center gap-3 shrink-0 whitespace-nowrap">
          {!userEmail ? (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/70 text-xs font-medium transition-all whitespace-nowrap"
            >
              <Cloud className="w-3.5 h-3.5 text-[#E07A5F] shrink-0" />
              <span>Save to Cloud / Sign In</span>
            </button>
          ) : (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                title={userEmail}
                aria-label={`Account menu for ${userEmail}`}
                className="w-8 h-8 rounded-full bg-slate-100 bg-slate-150 text-slate-700 font-semibold text-xs flex items-center justify-center border border-slate-200 hover:border-slate-300 transition relative"
              >
                {isSyncingCloud ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
                ) : (
                  <span>{userInitial}</span>
                )}
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-[0_12px_32px_rgb(0,0,0,0.08)] border border-slate-100 py-2 z-50">
                  <div className="px-3.5 py-2 border-b border-slate-100">
                    <p className="text-[11px] font-normal text-slate-400">
                      Signed in as
                    </p>
                    <p className="text-xs font-medium text-slate-800 truncate mt-0.5">
                      {userEmail}
                    </p>
                    <span className="inline-flex items-center gap-1 text-[11px] font-normal text-emerald-600 mt-1">
                      <Check className="w-3 h-3" />
                      <span>Cloud sync active</span>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onResetDemo();
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-normal text-slate-600 hover:text-slate-900 hover:bg-slate-50/80 flex items-center gap-2 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset sample data</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onSignOut();
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-normal text-slate-600 hover:text-rose-600 hover:bg-rose-50/60 flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-all whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
            <span>Add Item</span>
          </button>
        </div>
      </div>
    </header>
  );
};

