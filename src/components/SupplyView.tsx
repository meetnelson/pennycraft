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
  onQuickUpdatePrice: (
    id: string,
    newPricePaid: number,
    newPurchaseQty?: number
  ) => void;
  onDelete: (id: string) => void;
}

export const SupplyView: React.FC<SupplyViewProps> = ({
  mode,
  items,
  onOpenAdd,
  onOpenEdit,
  onQuickUpdatePrice,
  onDelete,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showStaleOnly, setShowStaleOnly] = useState(false);
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
    return items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === 'ALL' || item.category === selectedCategory;
      const matchesStale = !showStaleOnly || isPriceStale(item.updated_at);
      return matchesSearch && matchesCategory && matchesStale;
    });
  }, [items, searchQuery, selectedCategory, showStaleOnly]);

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
            <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">
              {title}
            </h1>
            <span className="inline-flex items-center px-3 py-0.5 rounded-full bg-slate-200/60 text-slate-600 text-xs font-medium">
              {items.length} {items.length === 1 ? singularLabel : title}
            </span>
            {staleCount > 0 ? (
              <button
                type="button"
                onClick={() => setShowStaleOnly((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-medium hover:bg-amber-100/70 transition-colors"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{staleCount} older than 90d</span>
              </button>
            ) : (
              <span className="text-xs font-normal text-slate-400">
                • All prices current
              </span>
            )}
          </div>
          <p className="text-sm font-normal text-slate-400 mt-1">
            {subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAdd}
          className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs sm:text-sm px-5 py-2.5 rounded-full transition-all self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 text-[#E07A5F]" />
          <span>Add {singularLabel}</span>
        </button>
      </div>

      {/* Minimalist Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 px-1">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${mode}...`}
              className="w-full pl-9 pr-8 py-2 bg-white border border-slate-100 focus:border-slate-300 rounded-full text-xs font-normal text-slate-700 placeholder:text-slate-400 focus:outline-none shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
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
                  ? 'bg-slate-800 text-white font-medium'
                  : 'bg-white text-slate-500 hover:text-slate-800 border border-slate-100 font-normal'
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
                    ? 'bg-slate-800 text-white font-medium'
                    : 'bg-white text-slate-500 hover:text-slate-800 border border-slate-100 font-normal'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-2">
          {staleCount > 0 && (
            <button
              type="button"
              onClick={() => setShowStaleOnly((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border ${
                showStaleOnly
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-white text-amber-700 border-slate-100 hover:bg-amber-50/50'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Stale Only ({staleCount})</span>
            </button>
          )}

          <div className="bg-white border border-slate-100 p-1 rounded-full flex items-center gap-1 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
            <button
              type="button"
              onClick={() => setViewLayout('grid')}
              title="Card Grid View"
              className={`p-1.5 rounded-full transition-all ${
                viewLayout === 'grid'
                  ? 'bg-slate-100 text-slate-800'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewLayout('table')}
              title="Soft Table View"
              className={`p-1.5 rounded-full transition-all ${
                viewLayout === 'table'
                  ? 'bg-slate-100 text-slate-800'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-12 text-center max-w-lg mx-auto my-8">
          <div className="w-11 h-11 rounded-full bg-coral-50 text-[#E07A5F] flex items-center justify-center mx-auto mb-3">
            {isMaterials ? (
              <Layers className="w-5 h-5" />
            ) : (
              <Package className="w-5 h-5" />
            )}
          </div>
          <h3 className="text-base font-medium text-slate-800">
            No {mode} match your current view
          </h3>
          <p className="text-xs font-normal text-slate-400 mt-1 mb-5">
            Try clearing your search filters or add a new item to your catalog.
          </p>
          <button
            type="button"
            onClick={onOpenAdd}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-slate-800 text-white text-xs font-medium hover:bg-slate-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-[#E07A5F]" />
            <span>Add {singularLabel}</span>
          </button>
        </div>
      ) : viewLayout === 'grid' ? (
        /* HERO UI CARD GRID VIEW (NO BOX-IN-BOX CLUTTER) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                className={`bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_14px_40px_rgb(0,0,0,0.06)] transition-all duration-200 p-6 flex flex-col justify-between border ${
                  stale ? 'border-amber-200/80' : 'border-slate-100'
                }`}
              >
                <div>
                  {/* Top Row: Category Pill & 90-Day Stale Warning Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center px-3 py-0.5 rounded-full bg-slate-100/80 text-slate-600 border border-slate-200/40 text-xs font-normal">
                      {item.category}
                    </span>

                    {stale && (
                      <span
                        title={`Last updated ${daysAgo} days ago (${formatDate(
                          item.updated_at
                        )})`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60 text-xs font-medium"
                      >
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Price older than 90d</span>
                      </span>
                    )}
                  </div>

                  {/* Item Name + Optional Supplier Link */}
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-base font-semibold text-slate-800 leading-snug">
                      {item.name}
                    </h3>
                    {item.supplier_url && (
                      <a
                        href={item.supplier_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Where to buy: ${item.supplier_url}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 rounded-lg text-slate-400 hover:text-[#E07A5F] hover:bg-coral-50/70 transition-colors shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  {/* Clean Divider Breakdown (No nested grey box) */}
                  {!isQuickEditing ? (
                    <div className="divide-y divide-slate-100 border-t border-slate-100">
                      <div className="py-3 flex items-baseline justify-between gap-2">
                        <span className="text-xs font-normal text-slate-400">
                          Unit Cost
                        </span>
                        <span className="inline-flex items-baseline gap-1 px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <strong className="text-sm font-semibold">
                            {formatCurrency(item.unit_cost, true)}
                          </strong>
                          <span className="text-[11px] font-normal opacity-80">
                            / {item.purchase_unit}
                          </span>
                        </span>
                      </div>

                      <div className="py-2.5 flex items-center justify-between text-xs">
                        <span className="font-normal text-slate-400">
                          Purchase Details
                        </span>
                        <span className="font-medium text-slate-700">
                          {formatCurrency(item.price_paid)} for {item.purchase_qty}{' '}
                          {item.purchase_unit}
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* Minimalist Inline Quick Price Edit */
                    <div className="pt-3 border-t border-slate-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-600">
                          Quick Update Price
                        </span>
                        <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full">
                          {formatCurrency(previewUnitCost, true)} /{' '}
                          {item.purchase_unit}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-normal text-slate-400 mb-1">
                            Package Price ($)
                          </label>
                          <div className="relative">
                            <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
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
                              className="w-full pl-7 pr-2.5 py-1.5 bg-slate-50/70 border border-transparent focus:border-slate-300 focus:bg-white rounded-2xl text-xs font-medium text-slate-800 focus:outline-none transition-all"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-normal text-slate-400 mb-1">
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
                            className="w-full px-3 py-1.5 bg-slate-50/70 border border-transparent focus:border-slate-300 focus:bg-white rounded-2xl text-xs font-medium text-slate-800 focus:outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={cancelQuickEdit}
                          className="px-3 py-1 rounded-full text-xs font-normal text-slate-500 hover:bg-slate-100/70 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => saveQuickEdit(item)}
                          className="inline-flex items-center gap-1 px-3.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-white hover:bg-slate-700 transition-colors"
                        >
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Save Price</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer: Updated Date + Ghost Actions */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-normal text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-slate-300 shrink-0" />
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
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                          stale
                            ? 'bg-amber-50 text-amber-700 border-amber-200/60 hover:bg-amber-100/60'
                            : 'bg-slate-50/80 text-slate-600 border-transparent hover:bg-slate-100'
                        }`}
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>{stale ? 'Update Price' : 'Price'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenEdit(item)}
                        title="Edit full item details"
                        className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg p-1 transition-colors"
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
                        className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg p-1 transition-colors"
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
                        className="px-2 py-0.5 rounded-full text-slate-600 text-[11px] font-normal hover:bg-white"
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
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden border border-slate-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-xs font-normal">
                  <th className="py-3.5 px-6 font-normal">Item Name</th>
                  <th className="py-3.5 px-4 font-normal">Category</th>
                  <th className="py-3.5 px-4 font-normal">Purchase Details</th>
                  <th className="py-3.5 px-4 font-normal">Unit Cost</th>
                  <th className="py-3.5 px-4 font-normal">Last Updated</th>
                  <th className="py-3.5 px-6 text-right font-normal">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredItems.map((item) => {
                  const stale = isPriceStale(item.updated_at);
                  const isQuickEditing = quickEditId === item.id;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/40 transition-colors"
                    >
                      <td className="py-3.5 px-6 font-medium text-slate-800">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <span>{item.name}</span>
                            {item.supplier_url && (
                              <a
                                href={item.supplier_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={`Where to buy: ${item.supplier_url}`}
                                className="p-1 rounded-lg text-slate-400 hover:text-[#E07A5F] hover:bg-coral-50/70 transition-colors shrink-0"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                          {stale && (
                            <span className="inline-flex w-fit items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60 text-[11px] font-medium">
                              <AlertCircle className="w-3 h-3 shrink-0" />
                              <span>Price older than 90d</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-3 py-0.5 rounded-full bg-slate-100/80 text-slate-600 text-xs font-normal">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-normal text-slate-600 text-xs">
                        {isQuickEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              step="0.01"
                              value={quickPriceValue}
                              onChange={(e) => setQuickPriceValue(e.target.value)}
                              className="w-24 px-2.5 py-1 bg-slate-50/70 border border-transparent focus:border-slate-300 focus:bg-white rounded-xl text-xs font-medium"
                            />
                            <span className="text-xs text-slate-400">for</span>
                            <input
                              type="number"
                              step="any"
                              value={quickQtyValue}
                              onChange={(e) => setQuickQtyValue(e.target.value)}
                              className="w-20 px-2.5 py-1 bg-slate-50/70 border border-transparent focus:border-slate-300 focus:bg-white rounded-xl text-xs font-medium"
                            />
                            <span className="text-xs text-slate-500">
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
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-baseline gap-1 px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-medium text-xs">
                          {formatCurrency(item.unit_cost, true)}
                          <span className="text-[11px] font-normal opacity-75">
                            / {item.purchase_unit}
                          </span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400 font-normal">
                        {formatDate(item.updated_at)}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        {isQuickEditing ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => saveQuickEdit(item)}
                              className="px-3 py-1 rounded-full bg-slate-800 text-white text-xs font-medium"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={cancelQuickEdit}
                              className="px-2.5 py-1 rounded-full text-slate-500 text-xs font-normal"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => startQuickEdit(item)}
                              className="px-3 py-1 rounded-full bg-slate-50/80 hover:bg-slate-100 text-slate-600 text-xs font-normal transition-colors"
                            >
                              Edit Price
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenEdit(item)}
                              className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg p-1"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDelete(item.id)}
                              className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg p-1"
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
