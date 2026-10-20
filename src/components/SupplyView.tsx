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
            <h1 className="text-2xl font-semibold text-[#303C36] tracking-tight">
              {title}
            </h1>
            <span className="inline-flex items-center px-3 py-0.5 rounded-full bg-white border border-[#E8ECE9] text-[#63726A] text-xs font-medium">
              {items.length} {items.length === 1 ? singularLabel : title}
            </span>
            {staleCount > 0 ? (
              <button
                type="button"
                onClick={() => setShowStaleOnly((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FDF3F0] border border-[#E8A184]/50 text-[#C66746] text-xs font-medium hover:bg-[#F9E3DC] transition-colors"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{staleCount} older than 90d</span>
              </button>
            ) : (
              <span className="text-xs font-normal text-[#63726A]">
                • All prices current
              </span>
            )}
          </div>
          <p className="text-sm font-normal text-[#63726A] mt-1">
            {subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAdd}
          className="inline-flex items-center gap-1.5 bg-[#42685B] hover:bg-[#36544a] text-white font-medium text-xs sm:text-sm px-5 py-2.5 rounded-full transition-all self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 text-[#E8A184]" />
          <span>Add {singularLabel}</span>
        </button>
      </div>

      {/* Minimalist Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 px-1">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-[#63726A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${mode}...`}
              className="w-full pl-9 pr-8 py-2 bg-white border border-[#E8ECE9] focus:border-[#42685B] rounded-full text-xs font-normal text-[#303C36] placeholder:text-[#63726A]/70 focus:outline-none shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#63726A] hover:text-[#303C36]"
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
                  ? 'bg-[#42685B] text-white font-medium'
                  : 'bg-white text-[#63726A] hover:text-[#303C36] border border-[#E8ECE9] font-normal'
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
                    ? 'bg-[#42685B] text-white font-medium'
                    : 'bg-white text-[#63726A] hover:text-[#303C36] border border-[#E8ECE9] font-normal'
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
                  ? 'bg-[#FDF3F0] text-[#C66746] border-[#E8A184]/60'
                  : 'bg-white text-[#C66746] border-[#E8ECE9] hover:bg-[#FDF3F0]/60'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Stale Only ({staleCount})</span>
            </button>
          )}

          <div className="bg-white border border-[#E8ECE9] p-1 rounded-full flex items-center gap-1 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
            <button
              type="button"
              onClick={() => setViewLayout('grid')}
              title="Card Grid View"
              className={`p-1.5 rounded-full transition-all ${
                viewLayout === 'grid'
                  ? 'bg-[#42685B]/10 text-[#42685B]'
                  : 'text-[#63726A] hover:text-[#303C36]'
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
                  ? 'bg-[#42685B]/10 text-[#42685B]'
                  : 'text-[#63726A] hover:text-[#303C36]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#E8ECE9] p-12 text-center max-w-lg mx-auto my-8">
          <div className="w-11 h-11 rounded-full bg-[#42685B]/10 text-[#42685B] flex items-center justify-center mx-auto mb-3">
            {isMaterials ? (
              <Layers className="w-5 h-5" />
            ) : (
              <Package className="w-5 h-5" />
            )}
          </div>
          <h3 className="text-base font-medium text-[#303C36]">
            No {mode} match your current view
          </h3>
          <p className="text-xs font-normal text-[#63726A] mt-1 mb-5">
            Try clearing your search filters or add a new item to your catalog.
          </p>
          <button
            type="button"
            onClick={onOpenAdd}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#42685B] text-white text-xs font-medium hover:bg-[#36544a] transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-[#E8A184]" />
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
                  stale ? 'border-[#E8A184]/70' : 'border-[#E8ECE9]'
                }`}
              >
                <div>
                  {/* Top Row: Category Pill & 90-Day Stale Warning Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center px-3 py-0.5 rounded-full bg-[#B8C9BD]/25 text-[#303C36] border border-[#B8C9BD]/50 text-xs font-normal">
                      {item.category}
                    </span>

                    {stale && (
                      <span
                        title={`Last updated ${daysAgo} days ago (${formatDate(
                          item.updated_at
                        )})`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FDF3F0] text-[#C66746] border border-[#E8A184]/50 text-xs font-medium"
                      >
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Price older than 90d</span>
                      </span>
                    )}
                  </div>

                  {/* Item Name + Optional Supplier Link */}
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-base font-semibold text-[#303C36] leading-snug">
                      {item.name}
                    </h3>
                    {item.supplier_url && (
                      <a
                        href={item.supplier_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Where to buy: ${item.supplier_url}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 rounded-lg text-[#63726A] hover:text-[#42685B] hover:bg-[#FAFBFA] transition-colors shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  {/* Clean Divider Breakdown (No nested grey box) */}
                  {!isQuickEditing ? (
                    <div className="divide-y divide-[#E8ECE9] border-t border-[#E8ECE9]">
                      <div className="py-3 flex items-baseline justify-between gap-2">
                        <span className="text-xs font-normal text-[#63726A]">
                          Unit Cost
                        </span>
                        <span className="inline-flex items-baseline gap-1 px-3 py-0.5 rounded-full bg-[#42685B]/10 text-[#42685B] border border-[#B8C9BD]/60">
                          <strong className="text-sm font-semibold">
                            {formatCurrency(item.unit_cost, true)}
                          </strong>
                          <span className="text-[11px] font-normal opacity-80">
                            / {item.purchase_unit}
                          </span>
                        </span>
                      </div>

                      <div className="py-2.5 flex items-center justify-between text-xs">
                        <span className="font-normal text-[#63726A]">
                          Purchase Details
                        </span>
                        <span className="font-medium text-[#303C36]">
                          {formatCurrency(item.price_paid)} for {item.purchase_qty}{' '}
                          {item.purchase_unit}
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* Minimalist Inline Quick Price Edit */
                    <div className="pt-3 border-t border-[#E8ECE9] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#303C36]">
                          Quick Update Price
                        </span>
                        <span className="text-xs font-medium text-[#42685B] bg-[#42685B]/10 border border-[#B8C9BD]/60 px-2.5 py-0.5 rounded-full">
                          {formatCurrency(previewUnitCost, true)} /{' '}
                          {item.purchase_unit}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-normal text-[#63726A] mb-1">
                            Package Price ($)
                          </label>
                          <div className="relative">
                            <DollarSign className="w-3.5 h-3.5 text-[#63726A] absolute left-2.5 top-1/2 -translate-y-1/2" />
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
                              className="w-full pl-7 pr-2.5 py-1.5 bg-[#FAFBFA] border border-[#E8ECE9] focus:border-[#42685B] focus:bg-white rounded-2xl text-xs font-medium text-[#303C36] focus:outline-none transition-all"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-normal text-[#63726A] mb-1">
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
                            className="w-full px-3 py-1.5 bg-[#FAFBFA] border border-[#E8ECE9] focus:border-[#42685B] focus:bg-white rounded-2xl text-xs font-medium text-[#303C36] focus:outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={cancelQuickEdit}
                          className="px-3 py-1 rounded-full text-xs font-normal text-[#63726A] hover:bg-[#FAFBFA] transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => saveQuickEdit(item)}
                          className="inline-flex items-center gap-1 px-3.5 py-1 rounded-full text-xs font-medium bg-[#42685B] text-white hover:bg-[#36544a] transition-colors"
                        >
                          <Check className="w-3 h-3 text-[#E8A184]" />
                          <span>Save Price</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer: Updated Date + Ghost Actions */}
                <div className="mt-4 pt-3.5 border-t border-[#E8ECE9] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-normal text-[#63726A]">
                    <Calendar className="w-3.5 h-3.5 text-[#B8C9BD] shrink-0" />
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
                            ? 'bg-[#FDF3F0] text-[#C66746] border-[#E8A184]/50 hover:bg-[#F9E3DC]'
                            : 'bg-[#FAFBFA] text-[#303C36] border-[#E8ECE9] hover:border-[#B8C9BD]'
                        }`}
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>{stale ? 'Update Price' : 'Price'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenEdit(item)}
                        title="Edit full item details"
                        className="text-[#63726A] hover:text-[#303C36] hover:bg-[#FAFBFA] rounded-lg p-1 transition-colors"
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
                        className="text-[#63726A] hover:text-rose-500 hover:bg-rose-50 rounded-lg p-1 transition-colors"
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
                        className="px-2 py-0.5 rounded-full text-[#63726A] text-[11px] font-normal hover:bg-white"
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
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden border border-[#E8ECE9]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E8ECE9] text-[#63726A] text-xs font-normal">
                  <th className="py-3.5 px-6 font-normal">Item Name</th>
                  <th className="py-3.5 px-4 font-normal">Category</th>
                  <th className="py-3.5 px-4 font-normal">Purchase Details</th>
                  <th className="py-3.5 px-4 font-normal">Unit Cost</th>
                  <th className="py-3.5 px-4 font-normal">Last Updated</th>
                  <th className="py-3.5 px-6 text-right font-normal">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8ECE9] text-sm">
                {filteredItems.map((item) => {
                  const stale = isPriceStale(item.updated_at);
                  const isQuickEditing = quickEditId === item.id;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-[#FAFBFA] transition-colors"
                    >
                      <td className="py-3.5 px-6 font-medium text-[#303C36]">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <span>{item.name}</span>
                            {item.supplier_url && (
                              <a
                                href={item.supplier_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={`Where to buy: ${item.supplier_url}`}
                                className="p-1 rounded-lg text-[#63726A] hover:text-[#42685B] hover:bg-white transition-colors shrink-0"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                          {stale && (
                            <span className="inline-flex w-fit items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FDF3F0] text-[#C66746] border border-[#E8A184]/50 text-[11px] font-medium">
                              <AlertCircle className="w-3 h-3 shrink-0" />
                              <span>Price older than 90d</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-3 py-0.5 rounded-full bg-[#B8C9BD]/25 border border-[#B8C9BD]/50 text-[#303C36] text-xs font-normal">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-normal text-[#63726A] text-xs">
                        {isQuickEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              step="0.01"
                              value={quickPriceValue}
                              onChange={(e) => setQuickPriceValue(e.target.value)}
                              className="w-24 px-2.5 py-1 bg-[#FAFBFA] border border-[#E8ECE9] focus:border-[#42685B] focus:bg-white rounded-xl text-xs font-medium text-[#303C36]"
                            />
                            <span className="text-xs text-[#63726A]">for</span>
                            <input
                              type="number"
                              step="any"
                              value={quickQtyValue}
                              onChange={(e) => setQuickQtyValue(e.target.value)}
                              className="w-20 px-2.5 py-1 bg-[#FAFBFA] border border-[#E8ECE9] focus:border-[#42685B] focus:bg-white rounded-xl text-xs font-medium text-[#303C36]"
                            />
                            <span className="text-xs text-[#63726A]">
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
                        <span className="inline-flex items-baseline gap-1 px-3 py-0.5 rounded-full bg-[#42685B]/10 text-[#42685B] border border-[#B8C9BD]/60 font-medium text-xs">
                          {formatCurrency(item.unit_cost, true)}
                          <span className="text-[11px] font-normal opacity-75">
                            / {item.purchase_unit}
                          </span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#63726A] font-normal">
                        {formatDate(item.updated_at)}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        {isQuickEditing ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => saveQuickEdit(item)}
                              className="px-3 py-1 rounded-full bg-[#42685B] text-white text-xs font-medium"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={cancelQuickEdit}
                              className="px-2.5 py-1 rounded-full text-[#63726A] text-xs font-normal"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => startQuickEdit(item)}
                              className="px-3 py-1 rounded-full bg-[#FAFBFA] border border-[#E8ECE9] hover:border-[#B8C9BD] text-[#303C36] text-xs font-normal transition-colors"
                            >
                              Edit Price
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenEdit(item)}
                              className="text-[#63726A] hover:text-[#303C36] hover:bg-[#FAFBFA] rounded-lg p-1"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDelete(item.id)}
                              className="text-[#63726A] hover:text-rose-600 hover:bg-rose-50 rounded-lg p-1"
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
