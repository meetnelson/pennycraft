import React, { useState, useMemo } from 'react';
import {
  Search,
  Edit3,
  Trash2,
  DollarSign,
  Check,
  X,
  LayoutGrid,
  List,
  Calendar,
  Plus,
  RefreshCw,
  Package,
  Layers,
  AlertCircle,
  ExternalLink,
  ArrowUpDown,
  Copy,
  FolderKanban,
} from 'lucide-react';
import { MaterialItem, PackagingItem } from '../types/pricing';
import {
  calculateUnitCost,
  formatCurrency,
  formatDate,
  getDaysSinceUpdate,
  isPriceStale,
} from '../utils/calculations';

type SupplyItem = MaterialItem | PackagingItem;

interface SupplyViewProps {
  mode: 'materials' | 'packaging';
  items: SupplyItem[];
  onOpenAdd: () => void;
  onOpenEdit: (item: SupplyItem) => void;
  onDuplicate: (item: SupplyItem) => void;
  onOpenCategoryManager?: () => void;
  onQuickUpdatePrice: (
    id: string,
    newPricePaid: number,
    newPurchaseQty?: number
  ) => void;
  onDelete: (id: string) => void;
}

function formatSupplierBadgeText(rawUrl: string): string {
  try {
    const normalized = /^https?:\/\//i.test(rawUrl)
      ? rawUrl
      : `https://${rawUrl}`;
    const url = new URL(normalized);
    return url.hostname.replace(/^www\./i, '') || 'Supplier';
  } catch {
    return 'Supplier Link';
  }
}

export const SupplyView: React.FC<SupplyViewProps> = ({
  mode,
  items,
  onOpenAdd,
  onOpenEdit,
  onDuplicate,
  onOpenCategoryManager,
  onQuickUpdatePrice,
  onDelete,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showStaleOnly, setShowStaleOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewLayout, setViewLayout] = useState<'grid' | 'table'>('grid');

  const [quickEditId, setQuickEditId] = useState<string | null>(null);
  const [quickPriceValue, setQuickPriceValue] = useState<string>('');
  const [quickQtyValue, setQuickQtyValue] = useState<string>('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const isMaterials = mode === 'materials';
  const title = isMaterials ? 'Materials' : 'Packaging';
  const subtitle = isMaterials
    ? 'Your studio materials and unit costs.'
    : 'Boxes, ribbons, tags, and wrapping supplies.';
  const singularLabel = isMaterials ? 'Material' : 'Packaging';

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return Array.from(set).sort();
  }, [items]);

  const staleCount = useMemo(
    () => items.filter((item) => isPriceStale(item.updated_at)).length,
    [items]
  );

  const filteredItems = useMemo(() => {
    const matching = items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === 'ALL' || item.category === selectedCategory;
      const matchesStale = !showStaleOnly || isPriceStale(item.updated_at);
      return matchesSearch && matchesCategory && matchesStale;
    });

    return [...matching].sort((a, b) => {
      const cmp = a.name.localeCompare(b.name, undefined, {
        sensitivity: 'base',
      });
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [items, searchQuery, selectedCategory, showStaleOnly, sortOrder]);

  const startQuickEdit = (item: SupplyItem) => {
    setQuickEditId(item.id);
    setQuickPriceValue(item.price_paid.toFixed(2));
    setQuickQtyValue(String(item.purchase_qty));
    setConfirmDeleteId(null);
  };

  const cancelQuickEdit = () => {
    setQuickEditId(null);
    setQuickPriceValue('');
    setQuickQtyValue('');
  };

  const saveQuickEdit = (item: SupplyItem) => {
    const parsedPrice = parseFloat(quickPriceValue);
    const parsedQty = parseFloat(quickQtyValue);
    if (
      !isNaN(parsedPrice) &&
      parsedPrice >= 0 &&
      !isNaN(parsedQty) &&
      parsedQty > 0
    ) {
      onQuickUpdatePrice(item.id, parsedPrice, parsedQty);
    }
    setQuickEditId(null);
  };

  return (
    <section className="space-y-8">
      {/* Simplified Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-[#2D3134] tracking-tight">
              {title}
            </h1>
            <span className="inline-flex items-center px-3 py-0.5 rounded-full bg-white border border-slate-200 text-[#64748B] text-xs font-medium shadow-xs">
              {items.length} {items.length === 1 ? singularLabel : title}
            </span>
            {staleCount > 0 ? (
              <button
                type="button"
                onClick={() => setShowStaleOnly((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E78358]/10 border border-[#E78358]/30 text-[#E78358] text-xs font-medium hover:bg-[#E78358]/15 transition-colors"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{staleCount} older than 90d</span>
              </button>
            ) : (
              <span className="text-xs font-normal text-[#64748B]">
                • All prices current
              </span>
            )}
          </div>
          <p className="text-sm font-normal text-[#64748B] mt-1">
            {subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAdd}
          className="inline-flex items-center gap-1.5 bg-[#2A8C82] hover:bg-[#23736B] text-white font-medium text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 text-[#F4B266]" />
          <span>Add {singularLabel}</span>
        </button>
      </div>

      {/* Minimalist Filter, Search & Sort Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 px-1">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${mode}...`}
              className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 focus:border-[#2A8C82] focus:ring-1 focus:ring-[#2A8C82] outline-none rounded-xl text-xs font-normal text-[#2D3134] placeholder:text-[#64748B] shadow-xs transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#64748B] hover:text-[#2D3134]"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3.5 py-1.5 rounded-full text-xs transition-all whitespace-nowrap ${
                selectedCategory === 'ALL'
                  ? 'bg-[#2A8C82] text-white font-medium shadow-xs'
                  : 'bg-white text-[#64748B] hover:text-[#2D3134] border border-slate-200 font-normal'
              }`}
            >
              All
            </button>
            {availableCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() =>
                  setSelectedCategory(selectedCategory === cat ? 'ALL' : cat)
                }
                className={`px-3.5 py-1.5 rounded-full text-xs transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-[#2A8C82] text-white font-medium shadow-xs'
                    : 'bg-white text-[#64748B] hover:text-[#2D3134] border border-slate-200 font-normal'
                }`}
              >
                {cat}
              </button>
            ))}
            {onOpenCategoryManager && (
              <button
                type="button"
                onClick={onOpenCategoryManager}
                title="Manage Categories"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white hover:bg-[#F8F9FA] text-[#2A8C82] border border-slate-200 hover:border-[#2A8C82]/40 text-xs font-medium whitespace-nowrap transition-all"
              >
                <FolderKanban className="w-3 h-3 shrink-0" />
                <span>Manage Categories</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-2">
          {staleCount > 0 && (
            <button
              type="button"
              onClick={() => setShowStaleOnly((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                showStaleOnly
                  ? 'bg-[#E78358]/10 text-[#E78358] border-[#E78358]/40'
                  : 'bg-white text-[#E78358] border-slate-200 hover:bg-[#E78358]/5'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Stale Only ({staleCount})</span>
            </button>
          )}

          {/* Alphabetical Sort Toggle (A-Z / Z-A) */}
          <button
            type="button"
            onClick={() =>
              setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
            }
            title={`Sort alphabetically (${
              sortOrder === 'asc' ? 'A-Z' : 'Z-A'
            })`}
            aria-label={`Sort ${
              sortOrder === 'asc' ? 'A-Z' : 'Z-A'
            }`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-200 hover:border-[#2A8C82]/40 rounded-xl text-xs font-medium text-[#2D3134] shadow-xs transition-all"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-[#2A8C82]" />
            <span>{sortOrder === 'asc' ? 'A-Z' : 'Z-A'}</span>
          </button>

          <div className="bg-white border border-slate-200 p-1 rounded-xl flex items-center gap-1 shadow-xs">
            <button
              type="button"
              onClick={() => setViewLayout('grid')}
              title="Card Grid View"
              className={`p-1.5 rounded-lg transition-all ${
                viewLayout === 'grid'
                  ? 'bg-[#2A8C82]/10 text-[#2A8C82]'
                  : 'text-[#64748B] hover:text-[#2D3134]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewLayout('table')}
              title="Table View"
              className={`p-1.5 rounded-lg transition-all ${
                viewLayout === 'table'
                  ? 'bg-[#2A8C82]/10 text-[#2A8C82]'
                  : 'text-[#64748B] hover:text-[#2D3134]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center max-w-lg mx-auto my-8">
          <div className="w-11 h-11 rounded-full bg-[#2A8C82]/10 text-[#2A8C82] flex items-center justify-center mx-auto mb-3">
            {isMaterials ? (
              <Layers className="w-5 h-5" />
            ) : (
              <Package className="w-5 h-5" />
            )}
          </div>
          <h3 className="text-base font-medium text-[#2D3134]">
            No {mode} match your current view
          </h3>
          <p className="text-xs font-normal text-[#64748B] mt-1 mb-5">
            Try clearing your search filters or add a new item to your catalog.
          </p>
          <button
            type="button"
            onClick={onOpenAdd}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2A8C82] text-white text-xs font-medium hover:bg-[#23736B] shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-[#F4B266]" />
            <span>Add {singularLabel}</span>
          </button>
        </div>
      ) : viewLayout === 'grid' ? (
        /* CLEAN DASHBOARD CARD GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const stale = isPriceStale(item.updated_at);
            const daysAgo = getDaysSinceUpdate(item.updated_at);
            const isQuickEditing = quickEditId === item.id;
            const isConfirmingDelete = confirmDeleteId === item.id;

            const previewUnitCost = isQuickEditing
              ? calculateUnitCost(
                  parseFloat(quickPriceValue),
                  parseFloat(quickQtyValue)
                )
              : item.unit_cost;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 p-6 flex flex-col justify-between border ${
                  stale ? 'border-[#E78358]/60' : 'border-slate-200'
                }`}
              >
                <div>
                  {/* Top Structured Metadata Row: Category Tag, Supplier Badge & Stale Warning */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center px-3 py-0.5 rounded-full bg-[#F8F9FA] text-[#2D3134] border border-slate-200 text-xs font-medium">
                        {item.category}
                      </span>

                      {item.supplier_url && (
                        <a
                          href={item.supplier_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`Supplier link: ${item.supplier_url}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#2A8C82]/10 hover:bg-[#2A8C82]/15 text-[#2A8C82] border border-[#2A8C82]/25 text-[11px] font-medium transition-colors"
                        >
                          <ExternalLink className="w-3 h-3 shrink-0" />
                          <span className="truncate max-w-[130px]">
                            {formatSupplierBadgeText(item.supplier_url)}
                          </span>
                        </a>
                      )}
                    </div>

                    {stale && (
                      <span
                        title={`Last updated ${daysAgo} days ago (${formatDate(
                          item.updated_at
                        )})`}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E78358]/10 text-[#E78358] border border-[#E78358]/30 text-[11px] font-medium"
                      >
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>90d+ stale</span>
                      </span>
                    )}
                  </div>

                  {/* Item Name */}
                  <div className="mb-4">
                    <h3 className="text-base font-semibold text-[#2D3134] leading-snug">
                      {item.name}
                    </h3>
                  </div>

                  {/* Structured Unit Cost & Purchase Details Breakdown */}
                  {!isQuickEditing ? (
                    <div className="divide-y divide-slate-200 border-t border-slate-200">
                      <div className="py-3.5 flex items-baseline justify-between gap-2">
                        <span className="text-xs font-normal text-[#64748B]">
                          Unit Cost
                        </span>
                        <span className="inline-flex items-baseline gap-1 px-3 py-1 rounded-full bg-[#2A8C82]/10 text-[#2A8C82] border border-[#2A8C82]/25">
                          <strong className="text-sm font-semibold">
                            {formatCurrency(item.unit_cost, true)}
                          </strong>
                          <span className="text-[11px] font-normal opacity-80">
                            / {item.purchase_unit}
                          </span>
                        </span>
                      </div>

                      <div className="py-3 flex items-center justify-between text-xs">
                        <span className="font-normal text-[#64748B]">
                          Purchase Details
                        </span>
                        <span className="font-medium text-[#2D3134]">
                          {formatCurrency(item.price_paid)} for {item.purchase_qty}{' '}
                          {item.purchase_unit}
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* Minimalist Inline Quick Price Edit */
                    <div className="pt-3.5 border-t border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#2D3134]">
                          Quick Update Price
                        </span>
                        <span className="text-xs font-medium text-[#2A8C82] bg-[#2A8C82]/10 border border-[#2A8C82]/25 px-2.5 py-0.5 rounded-full">
                          {formatCurrency(previewUnitCost, true)} /{' '}
                          {item.purchase_unit}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-normal text-[#64748B] mb-1">
                            Package Price ($)
                          </label>
                          <div className="relative">
                            <DollarSign className="w-3.5 h-3.5 text-[#64748B] absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              autoFocus
                              value={quickPriceValue}
                              onChange={(e) => setQuickPriceValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveQuickEdit(item);
                                if (e.key === 'Escape') cancelQuickEdit();
                              }}
                              className="w-full pl-7 pr-2.5 py-1.5 bg-white border border-slate-200 focus:border-[#2A8C82] focus:ring-1 focus:ring-[#2A8C82] outline-none rounded-xl text-xs font-medium text-[#2D3134] transition-all"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-normal text-[#64748B] mb-1">
                            Qty ({item.purchase_unit})
                          </label>
                          <input
                            type="number"
                            step="any"
                            min="0.001"
                            value={quickQtyValue}
                            onChange={(e) => setQuickQtyValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveQuickEdit(item);
                              if (e.key === 'Escape') cancelQuickEdit();
                            }}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 focus:border-[#2A8C82] focus:ring-1 focus:ring-[#2A8C82] outline-none rounded-xl text-xs font-medium text-[#2D3134] transition-all"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={cancelQuickEdit}
                          className="px-3 py-1 rounded-xl text-xs font-normal text-[#64748B] hover:bg-[#F8F9FA] transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => saveQuickEdit(item)}
                          className="inline-flex items-center gap-1 px-3.5 py-1 rounded-xl text-xs font-medium bg-[#2A8C82] text-white hover:bg-[#23736B] transition-colors"
                        >
                          <Check className="w-3 h-3 text-[#F4B266]" />
                          <span>Save Price</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer: Updated Date + Actions */}
                <div className="mt-4 pt-3.5 border-t border-slate-200 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-normal text-[#64748B]">
                    <Calendar className="w-3.5 h-3.5 text-[#64748B]/70 shrink-0" />
                    <span>
                      {formatDate(item.updated_at)}
                      {daysAgo > 0 ? ` (${daysAgo}d ago)` : ' (Today)'}
                    </span>
                  </div>

                  {!isConfirmingDelete ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => startQuickEdit(item)}
                        title="Quick edit price & reset 90-day timer"
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-medium transition-colors border ${
                          stale
                            ? 'bg-[#E78358]/10 text-[#E78358] border-[#E78358]/30 hover:bg-[#E78358]/15'
                            : 'bg-white text-[#2D3134] border-slate-200 hover:bg-[#F8F9FA] hover:border-[#2A8C82]/40'
                        }`}
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>{stale ? 'Update Price' : 'Price'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onDuplicate(item)}
                        title={`Duplicate ${singularLabel.toLowerCase()} as template`}
                        aria-label={`Duplicate ${item.name}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-normal text-[#64748B] hover:text-[#2A8C82] hover:bg-[#2A8C82]/10 transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Duplicate</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenEdit(item)}
                        title="Edit full item details"
                        className="text-[#64748B] hover:text-[#2D3134] hover:bg-[#F8F9FA] rounded-lg p-1.5 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setConfirmDeleteId(item.id);
                          setQuickEditId(null);
                        }}
                        title="Delete item"
                        className="text-[#64748B] hover:text-rose-500 hover:bg-rose-50 rounded-lg p-1.5 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100">
                      <span className="text-[11px] font-medium text-rose-700">
                        Delete?
                      </span>
                      <button
                        type="button"
                        onClick={() => onDelete(item.id)}
                        className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[11px] font-medium hover:bg-rose-700"
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-0.5 rounded-full text-[#64748B] text-[11px] font-normal hover:bg-white"
                      >
                        No
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* CLEAN WHITE TABLE VIEW */
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[#64748B] text-xs font-normal bg-[#F8F9FA]">
                  <th className="py-3.5 px-6 font-normal">Item Name</th>
                  <th className="py-3.5 px-4 font-normal">Category</th>
                  <th className="py-3.5 px-4 font-normal">Supplier</th>
                  <th className="py-3.5 px-4 font-normal">Purchase Details</th>
                  <th className="py-3.5 px-4 font-normal">Unit Cost</th>
                  <th className="py-3.5 px-4 font-normal">Last Updated</th>
                  <th className="py-3.5 px-6 text-right font-normal">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filteredItems.map((item) => {
                  const stale = isPriceStale(item.updated_at);
                  const isQuickEditing = quickEditId === item.id;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-[#F8F9FA] transition-colors"
                    >
                      <td className="py-4 px-6 font-medium text-[#2D3134]">
                        <div className="flex flex-col gap-1">
                          <span>{item.name}</span>
                          {stale && (
                            <span className="inline-flex w-fit items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E78358]/10 text-[#E78358] border border-[#E78358]/30 text-[11px] font-medium">
                              <AlertCircle className="w-3 h-3 shrink-0" />
                              <span>Price older than 90d</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-3 py-0.5 rounded-full bg-[#F8F9FA] border border-slate-200 text-[#2D3134] text-xs font-medium">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {item.supplier_url ? (
                          <a
                            href={item.supplier_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`Where to buy: ${item.supplier_url}`}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#2A8C82]/10 hover:bg-[#2A8C82]/15 text-[#2A8C82] border border-[#2A8C82]/25 text-xs font-medium transition-colors"
                          >
                            <ExternalLink className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-[140px]">
                              {formatSupplierBadgeText(item.supplier_url)}
                            </span>
                          </a>
                        ) : (
                          <span className="text-xs text-[#64748B]/60">—</span>
                        )}
                      </td>
                      <td className="py-4 px-4 font-normal text-[#64748B] text-xs">
                        {isQuickEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              step="0.01"
                              value={quickPriceValue}
                              onChange={(e) => setQuickPriceValue(e.target.value)}
                              className="w-24 px-2.5 py-1 bg-white border border-slate-200 focus:border-[#2A8C82] focus:ring-1 focus:ring-[#2A8C82] outline-none rounded-xl text-xs font-medium text-[#2D3134]"
                            />
                            <span className="text-xs text-[#64748B]">for</span>
                            <input
                              type="number"
                              step="any"
                              value={quickQtyValue}
                              onChange={(e) => setQuickQtyValue(e.target.value)}
                              className="w-20 px-2.5 py-1 bg-white border border-slate-200 focus:border-[#2A8C82] focus:ring-1 focus:ring-[#2A8C82] outline-none rounded-xl text-xs font-medium text-[#2D3134]"
                            />
                            <span className="text-xs text-[#64748B]">
                              {item.purchase_unit}
                            </span>
                          </div>
                        ) : (
                          <span>
                            {formatCurrency(item.price_paid)} for{' '}
                            {item.purchase_qty} {item.purchase_unit}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-baseline gap-1 px-3 py-0.5 rounded-full bg-[#2A8C82]/10 text-[#2A8C82] border border-[#2A8C82]/25 font-medium text-xs">
                          {formatCurrency(item.unit_cost, true)}
                          <span className="text-[11px] font-normal opacity-75">
                            / {item.purchase_unit}
                          </span>
                        </span>
                      </td>
                      <td className="py-4 px-4 text-xs text-[#64748B] font-normal">
                        {formatDate(item.updated_at)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        {isQuickEditing ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => saveQuickEdit(item)}
                              className="px-3 py-1 rounded-xl bg-[#2A8C82] text-white text-xs font-medium"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={cancelQuickEdit}
                              className="px-2.5 py-1 rounded-xl text-[#64748B] text-xs font-normal"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => startQuickEdit(item)}
                              className="px-3 py-1 rounded-xl bg-white border border-slate-200 hover:bg-[#F8F9FA] hover:border-[#2A8C82]/40 text-[#2D3134] text-xs font-normal transition-colors"
                            >
                              Edit Price
                            </button>
                            <button
                              type="button"
                              onClick={() => onDuplicate(item)}
                              title={`Duplicate ${singularLabel.toLowerCase()} as template`}
                              aria-label={`Duplicate ${item.name}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white border border-slate-200 hover:bg-[#2A8C82]/10 hover:text-[#2A8C82] hover:border-[#2A8C82]/30 text-[#64748B] text-xs font-normal transition-colors"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>Duplicate</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenEdit(item)}
                              title="Edit full item details"
                              className="text-[#64748B] hover:text-[#2D3134] hover:bg-[#F8F9FA] rounded-lg p-1.5"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDelete(item.id)}
                              className="text-[#64748B] hover:text-rose-600 hover:bg-rose-50 rounded-lg p-1.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};
