import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  RotateCcw,
  Cloud,
  Check,
  LogOut,
  Loader2,
  User as UserIcon,
  Home,
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
  onNavigateHome?: () => void;
  onLogoClick?: () => void;
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
  onNavigateHome,
  onLogoClick,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const desktopMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const inDesktop =
        desktopMenuRef.current && desktopMenuRef.current.contains(target);
      const inMobile =
        mobileMenuRef.current && mobileMenuRef.current.contains(target);
      if (!inDesktop && !inMobile) {
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

  const userInitial = userEmail ? userEmail.charAt(0).toUpperCase() : null;

  const handleBrandClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onLogoClick) {
      onLogoClick();
    } else {
      onSelectTab('products');
    }
  };

  const renderDropdownMenu = () => (
    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-[0_12px_32px_rgb(0,0,0,0.08)] border border-[#E8ECE9] py-2 z-50">
      {userEmail ? (
        <div className="px-3.5 py-2 border-b border-[#E8ECE9]">
          <p className="text-[11px] font-normal text-[#63726A]">Signed in as</p>
          <p className="text-xs font-medium text-[#303C36] truncate mt-0.5">
            {userEmail}
          </p>
          <span className="inline-flex items-center gap-1 text-[11px] font-normal text-[#42685B] mt-1">
            <Check className="w-3 h-3" />
            <span>Cloud sync active</span>
          </span>
        </div>
      ) : (
        <div className="px-3.5 py-2 border-b border-[#E8ECE9]">
          <p className="text-xs font-medium text-[#303C36]">Local Studio</p>
          <p className="text-[11px] font-normal text-[#63726A] mt-0.5">
            Saved in this browser
          </p>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              onOpenAuthModal();
            }}
            className="mt-2 w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#42685B] hover:bg-[#36544a] text-white text-xs font-medium transition-colors"
          >
            <Cloud className="w-3.5 h-3.5 text-[#E8A184]" />
            <span>Save to Cloud / Sign In</span>
          </button>
        </div>
      )}

      {onNavigateHome && (
        <button
          type="button"
          onClick={() => {
            setMenuOpen(false);
            onNavigateHome();
          }}
          className="w-full px-3.5 py-2 text-left text-xs font-normal text-[#63726A] hover:text-[#303C36] hover:bg-[#FAFBFA] flex items-center gap-2 transition-colors"
        >
          <Home className="w-3.5 h-3.5 text-[#63726A]" />
          <span>Landing Page</span>
        </button>
      )}

      <button
        type="button"
        onClick={() => {
          setMenuOpen(false);
          onResetDemo();
        }}
        className="w-full px-3.5 py-2 text-left text-xs font-normal text-[#63726A] hover:text-[#303C36] hover:bg-[#FAFBFA] flex items-center gap-2 transition-colors"
      >
        <RotateCcw className="w-3.5 h-3.5 text-[#63726A]" />
        <span>Reset sample data</span>
      </button>

      {userEmail && (
        <button
          type="button"
          onClick={() => {
            setMenuOpen(false);
            onSignOut();
          }}
          className="w-full px-3.5 py-2 text-left text-xs font-normal text-[#63726A] hover:text-rose-600 hover:bg-rose-50/60 flex items-center gap-2 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      )}
    </div>
  );

  return (
    <header className="sticky top-0 z-30">
      {/* MOBILE HEADER (< 768px): Single slim bar (h-14) + Horizontally scrollable Segmented Tabs below */}
      <div className="md:hidden px-3 pt-2.5 pb-1.5 space-y-2 bg-[#FAFBFA]/95 backdrop-blur-md">
        <div className="h-14 px-4 bg-white rounded-2xl border border-[#E8ECE9] shadow-xs flex items-center justify-between flex-nowrap">
          {/* Left: Official PennyCraft Brand Mark */}
          <a
            href="/app"
            onClick={handleBrandClick}
            className="flex items-center shrink-0 whitespace-nowrap"
          >
            <img
              src="/images/pennycraft-linear.svg"
              alt="PennyCraft"
              className="h-7 w-auto block"
            />
          </a>

          {/* Right: User avatar circle + minimalist '+' icon button */}
          <div className="flex items-center gap-2.5 shrink-0 whitespace-nowrap">
            <div className="relative" ref={mobileMenuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                title={userEmail || 'Studio Menu'}
                aria-label="Studio account menu"
                className="w-8 h-8 rounded-full bg-[#FAFBFA] text-[#303C36] font-semibold text-xs flex items-center justify-center border border-[#E8ECE9] hover:border-[#B8C9BD] transition relative"
              >
                {isSyncingCloud ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#63726A]" />
                ) : userInitial ? (
                  <span>{userInitial}</span>
                ) : (
                  <UserIcon className="w-3.5 h-3.5 text-[#63726A]" />
                )}
              </button>
              {menuOpen && renderDropdownMenu()}
            </div>

            <button
              type="button"
              onClick={onOpenAddModal}
              aria-label="Add Item"
              title="Add Item"
              className="w-8 h-8 rounded-xl bg-[#42685B] hover:bg-[#36544a] active:scale-[0.98] text-white flex items-center justify-center shadow-xs transition-all shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Mobile Horizontally Scrollable Segmented Tabs */}
        <nav
          aria-label="Mobile Navigation"
          className="overflow-x-auto whitespace-nowrap scrollbar-none no-scrollbar mobile-tabs-mask flex items-center gap-2 px-4 py-1.5 pr-8 bg-[#E8ECE9]/70 rounded-2xl"
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
                    ? 'bg-white text-[#42685B] font-semibold shadow-xs rounded-xl px-4 py-1.5 text-xs transition-all whitespace-nowrap flex-shrink-0 shrink-0'
                    : 'text-[#63726A] hover:text-[#303C36] font-medium rounded-xl px-4 py-1.5 text-xs transition-colors whitespace-nowrap flex-shrink-0 shrink-0'
                }
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* DESKTOP HEADER (md: and lg:): Full Single-Row Studio Bar */}
      <div className="hidden md:block px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-nowrap h-16 px-6 bg-white rounded-3xl border border-[#E8ECE9] shadow-sm my-4 gap-4">
          {/* Left: Official App Branding */}
          <a
            href="/app"
            onClick={handleBrandClick}
            className="flex items-center gap-3 shrink-0 whitespace-nowrap group"
          >
            <img
              src="/images/pennycraft-linear.svg"
              alt="PennyCraft — Smart Pricing Studio"
              className="h-8 lg:h-9 w-auto block group-hover:scale-[1.01] transition-transform"
            />
          </a>

          {/* Center: Segmented Pill Navigation */}
          <nav
            aria-label="Main Navigation"
            className="bg-[#E8ECE9]/70 p-1 rounded-2xl flex items-center gap-1 flex-nowrap overflow-x-auto no-scrollbar min-w-0"
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
                      ? 'bg-white text-[#42685B] font-semibold shadow-xs rounded-xl px-4 py-1.5 text-xs transition-all whitespace-nowrap flex-shrink-0 shrink-0'
                      : 'text-[#63726A] hover:text-[#303C36] font-medium rounded-xl px-4 py-1.5 text-xs transition-colors whitespace-nowrap flex-shrink-0 shrink-0'
                  }
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right: Compact User Avatar / Cloud Sign-In + Add Item Button */}
          <div className="flex items-center gap-3 shrink-0 whitespace-nowrap">
            {!userEmail && (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FAFBFA] hover:bg-[#E8ECE9]/60 text-[#63726A] hover:text-[#303C36] border border-[#E8ECE9] text-xs font-medium transition-all whitespace-nowrap"
              >
                <Cloud className="w-3.5 h-3.5 text-[#E8A184] shrink-0" />
                <span>Save to Cloud / Sign In</span>
              </button>
            )}

            <div className="relative" ref={desktopMenuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                title={userEmail || 'Studio Menu'}
                aria-label="Studio account menu"
                className="w-8 h-8 rounded-full bg-[#FAFBFA] text-[#303C36] font-semibold text-xs flex items-center justify-center border border-[#E8ECE9] hover:border-[#B8C9BD] transition relative"
              >
                {isSyncingCloud ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#63726A]" />
                ) : userInitial ? (
                  <span>{userInitial}</span>
                ) : (
                  <UserIcon className="w-3.5 h-3.5 text-[#63726A]" />
                )}
              </button>

              {menuOpen && renderDropdownMenu()}
            </div>

            <button
              type="button"
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 bg-[#42685B] hover:bg-[#36544a] active:scale-[0.99] text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-all whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
              <span>Add Item</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};


