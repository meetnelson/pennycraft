import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  X,
  Copy,
  Trash2,
  Sliders,
  AlertCircle,
  RefreshCw,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Pencil,
  ArrowUpDown,
  FolderKanban,
} from 'lucide-react';
import {
  CascadeAlert,
  LaborRateItem,
  MaterialItem,
  PackagingItem,
  PricingRule,
  ProductItem,
} from '../types/pricing';
import {
  computeProductBomTotals,
  evaluatePricingPipeline,
  formatCurrency,
  formatDate,
} from '../utils/calculations';

interface ProductsViewProps {
  products: ProductItem[];
  materials: MaterialItem[];
  packaging: PackagingItem[];
  laborRates: LaborRateItem[];
  pricingRules: PricingRule[];
  cascadeAlerts: CascadeAlert[];
  onOpenAddProduct: () => void;
  onOpenEditProduct: (product: ProductItem) => void;
  onOpenRulesTab: () => void;
  onDuplicateProduct: (id: string) => void;
  onDeleteProduct: (id: string) => void;
  onRecalculateProduct: (id: string) => void;
  onRecalculateAllAffected: () => void;
  onOpenCategoryManager?: () => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  materials,
  packaging,
  laborRates,
  pricingRules,
  cascadeAlerts,
  onOpenAddProduct,
  onOpenEditProduct,
  onOpenRulesTab,
  onDuplicateProduct,
  onDeleteProduct,
  onRecalculateProduct,
  onRecalculateAllAffected,
  onOpenCategoryManager,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [filterAffectedOnly, setFilterAffectedOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [globalRuleOverrideId, setGlobalRuleOverrideId] =
    useState<string>('PRODUCT_DEFAULT');
  const [cardRuleOverrides, setCardRuleOverrides] = useState<
    Record<string, string>
  >({});
  const [expandedCardIds, setExpandedCardIds] = useState<
    Record<string, boolean>
  >({});
  const [openMenuProductId, setOpenMenuProductId] = useState<string | null>(
    null
  );

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [products]);

  const affectedProducts = useMemo(
    () => products.filter((p) => p.price_stale_flag),
    [products]
  );

  const latestCascadeItemName = useMemo(() => {
    if (cascadeAlerts.length > 0) {
      return cascadeAlerts.map((a) => a.item_name).join(', ');
    }
    const names = new Set<string>();
    affectedProducts.forEach((p) => {
      (p.affected_by_names || []).forEach((n) => names.add(n));
    });
    return Array.from(names).join(', ') || 'Supply item';
  }, [cascadeAlerts, affectedProducts]);

  const filteredProducts = useMemo(() => {
    const matching = products.filter((prod) => {
      const matchesSearch =
        prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prod.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat =
        selectedCategory === 'ALL' || prod.category === selectedCategory;
      const matchesAffected =
        !filterAffectedOnly || Boolean(prod.price_stale_flag);
      return matchesSearch && matchesCat && matchesAffected;
    });

    return [...matching].sort((a, b) => {
      const cmp = a.name.localeCompare(b.name, undefined, {
        sensitivity: 'base',
      });
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [products, searchQuery, selectedCategory, filterAffectedOnly, sortOrder]);

  return (
    <section className="space-y-8">
      {/* Slim, Single-Line Cascade Impact Alert Banner */}
      {affectedProducts.length > 0 && (
        <div
          role="alert"
          className="bg-[#E78358]/10 rounded-2xl px-5 py-3 border border-[#E78358]/30 flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm"
        >
          <div className="flex items-center gap-2 text-[#E78358] font-normal">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#E78358]" />
            <span>
              <strong className="font-medium text-[#2D3134]">
                {latestCascadeItemName}
              </strong>{' '}
              price changed — affects {affectedProducts.length}{' '}
              {affectedProducts.length === 1 ? 'product' : 'products'}.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilterAffectedOnly((prev) => !prev)}
              className="px-3 py-1 rounded-xl text-xs font-medium text-[#64748B] hover:text-[#2D3134] bg-white hover:bg-[#F8F9FA] border border-slate-200 transition-colors"
            >
              {filterAffectedOnly ? 'Show All' : 'Review'}
            </button>
            <button
              type="button"
              onClick={() => {
                onRecalculateAllAffected();
                setFilterAffectedOnly(false);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-xl text-xs font-medium bg-[#2A8C82] hover:bg-[#23736B] text-white transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#F4B266]" />
              <span>Update All</span>
            </button>
          </div>
        </div>
      )}

      {/* Simplified, Breathable Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 px-1">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#2D3134] tracking-tight">
              My Products
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-xs font-normal text-[#64748B] shadow-xs">
              {products.length} {products.length === 1 ? 'Product' : 'Products'}
            </span>
            {affectedProducts.length === 0 && (
              <span className="hidden sm:inline-block text-xs font-normal text-[#64748B]">
                • All prices current
              </span>
            )}
          </div>
          <p className="text-sm font-normal text-[#64748B] mt-1">
            Know your costs. Price with confidence.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenRulesTab}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-[#64748B] hover:text-[#2D3134] hover:bg-[#F8F9FA] text-xs font-medium shadow-xs transition-all"
          >
            <Sliders className="w-3.5 h-3.5 text-[#E78358]" />
            <span>Pricing Rules</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddProduct}
            className="inline-flex items-center gap-1.5 bg-[#2A8C82] hover:bg-[#23736B] text-white font-medium text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-[#F4B266]" />
            <span>New Product</span>
          </button>
        </div>
      </div>

      {/* Minimalist Filter & Rule Simulation Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative min-w-[200px] max-w-xs flex-1">
            <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
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

          {/* Category Filter Pills */}
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

        {/* Sort & Rule Simulation Controls */}
        <div className="flex items-center justify-end gap-2 self-end md:self-auto">
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

          <div className="flex items-center gap-2 bg-white border border-slate-200 focus-within:border-[#2A8C82] focus-within:ring-1 focus-within:ring-[#2A8C82] rounded-xl px-3.5 py-1.5 shadow-xs transition-all">
            <span className="text-xs font-normal text-[#64748B]">Rule:</span>
            <select
              value={globalRuleOverrideId}
              onChange={(e) => {
                setGlobalRuleOverrideId(e.target.value);
                setCardRuleOverrides({});
              }}
              className="bg-white text-xs font-medium text-[#2D3134] outline-none cursor-pointer"
            >
              <option value="PRODUCT_DEFAULT">Product Default</option>
              {pricingRules.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center max-w-md mx-auto my-8">
          <h3 className="text-base font-medium text-[#2D3134]">
            No products found
          </h3>
          <p className="text-xs font-normal text-[#64748B] mt-1 mb-5">
            Create a product recipe to calculate your selling price.
          </p>
          <button
            type="button"
            onClick={onOpenAddProduct}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2A8C82] text-white text-xs font-medium hover:bg-[#23736B] shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-[#F4B266]" />
            <span>New Product</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredProducts.map((product) => {
            const isStale = Boolean(product.price_stale_flag);
            const isConfirmingDelete = confirmDeleteId === product.id;
            const isExpandedMobile = Boolean(expandedCardIds[product.id]);
            const isMenuOpenMobile = openMenuProductId === product.id;

            const liveTotals = computeProductBomTotals(
              product.items_materials,
              product.items_packaging,
              product.items_labor,
              materials,
              packaging,
              laborRates
            );

            const displayMaterialsCost = isStale
              ? liveTotals.total_materials_cost
              : product.total_materials_cost;
            const displayPackagingCost = isStale
              ? liveTotals.total_packaging_cost
              : product.total_packaging_cost;
            const displayLaborCost = isStale
              ? liveTotals.total_labor_cost
              : product.total_labor_cost;
            const displayBaseCost = isStale
              ? liveTotals.base_production_cost
              : product.base_production_cost;

            const costDiff =
              isStale && product.previous_base_cost !== undefined
                ? displayBaseCost - product.previous_base_cost
                : 0;

            const cardOverrideRuleId = cardRuleOverrides[product.id];
            const effectiveRuleId =
              cardOverrideRuleId ||
              (globalRuleOverrideId !== 'PRODUCT_DEFAULT'
                ? globalRuleOverrideId
                : product.default_rule_id);

            const ruleToUse =
              pricingRules.find((r) => r.id === effectiveRuleId) ||
              pricingRules[0];

            const ruleEval = evaluatePricingPipeline(ruleToUse?.blocks || [], {
              materialsCost: displayMaterialsCost,
              laborCost: displayLaborCost,
              packagingCost: displayPackagingCost,
            });

            const totalMinutes = product.items_labor.reduce(
              (acc, l) => acc + l.minutes_spent,
              0
            );

            const matPct =
              displayBaseCost > 0
                ? Math.round((displayMaterialsCost / displayBaseCost) * 100)
                : 0;
            const pkgPct =
              displayBaseCost > 0
                ? Math.round((displayPackagingCost / displayBaseCost) * 100)
                : 0;
            const labPct =
              displayBaseCost > 0 ? Math.max(0, 100 - matPct - pkgPct) : 0;

            return (
              <React.Fragment key={product.id}>
                {/* MOBILE QUICK CONSULTATION CARD (<768px) */}
                <div className="md:hidden bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between relative">
                  {/* Top Row: Product Title & 3-Dots Action Menu */}
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-semibold text-[#2D3134] leading-snug">
                      {product.name}
                    </h3>

                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenMenuProductId((prev) =>
                            prev === product.id ? null : product.id
                          )
                        }
                        aria-label="Product actions"
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748B] hover:text-[#2D3134] hover:bg-[#F8F9FA] transition-colors"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>

                      {isMenuOpenMobile && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenMenuProductId(null)}
                          />
                          <div className="absolute right-0 mt-1 w-40 bg-white rounded-2xl shadow-md border border-slate-200 py-1.5 z-20">
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuProductId(null);
                                onOpenEditProduct(product);
                              }}
                              className="w-full px-3.5 py-2 text-left text-xs font-medium text-[#2D3134] hover:bg-[#F8F9FA] flex items-center gap-2"
                            >
                              <Pencil className="w-3.5 h-3.5 text-[#64748B]" />
                              <span>Edit Recipe</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuProductId(null);
                                onDuplicateProduct(product.id);
                              }}
                              className="w-full px-3.5 py-2 text-left text-xs font-medium text-[#2D3134] hover:bg-[#F8F9FA] flex items-center gap-2"
                            >
                              <Copy className="w-3.5 h-3.5 text-[#64748B]" />
                              <span>Duplicate</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuProductId(null);
                                setConfirmDeleteId(product.id);
                              }}
                              className="w-full px-3.5 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50/60 flex items-center gap-2"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Delete Confirmation Inline Banner */}
                  {isConfirmingDelete && (
                    <div className="mt-3 flex items-center justify-between bg-rose-50 px-3.5 py-2 rounded-2xl">
                      <span className="text-xs font-medium text-rose-700">
                        Delete this product?
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onDeleteProduct(product.id)}
                          className="px-3 py-1 rounded-full bg-rose-600 text-white text-xs font-medium"
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-3 py-1 rounded-full bg-white text-[#64748B] text-xs font-normal"
                        >
                          No
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Category & Base Production Cost Cleanly Side-by-Side */}
                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#F8F9FA] border border-slate-200 text-[#2D3134] text-xs font-medium">
                      {product.category}
                    </span>

                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-[#64748B] font-normal">
                        Base Cost:
                      </span>
                      <span className="font-semibold text-[#2D3134]">
                        {formatCurrency(displayBaseCost)}
                      </span>
                      {isStale && (
                        <button
                          type="button"
                          onClick={() => onRecalculateProduct(product.id)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E78358]/10 border border-[#E78358]/30 text-[11px] font-medium text-[#E78358]"
                        >
                          <RefreshCw className="w-2.5 h-2.5" />
                          <span>Update</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Hero Section: Suggested Retail Price + Inline Pricing Rule Switcher */}
                  <div className="mt-4 pt-3.5 border-t border-slate-200 flex items-end justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <label className="block text-[11px] font-normal text-[#64748B] mb-1">
                        Pricing Rule
                      </label>
                      <select
                        value={ruleToUse?.id || ''}
                        onChange={(e) =>
                          setCardRuleOverrides((prev) => ({
                            ...prev,
                            [product.id]: e.target.value,
                          }))
                        }
                        aria-label={`Pricing rule for ${product.name}`}
                        className="w-full max-w-[170px] bg-white border border-slate-200 focus:border-[#2A8C82] focus:ring-1 focus:ring-[#2A8C82] outline-none rounded-xl px-2.5 py-1.5 text-xs font-medium text-[#2D3134] truncate cursor-pointer"
                      >
                        {pricingRules.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="flex items-center justify-end gap-1.5 mb-0.5">
                        <span className="text-[11px] font-normal text-[#64748B]">
                          Suggested Price
                        </span>
                        <span className="text-[11px] font-medium text-[#E78358] bg-[#E78358]/10 border border-[#E78358]/30 px-2 py-0.5 rounded-full">
                          {ruleEval.netMarginPercent.toFixed(0)}% margin
                        </span>
                      </div>
                      <div className="text-3xl font-bold text-[#2A8C82] tracking-tight leading-none">
                        {formatCurrency(ruleEval.suggestedRetailPrice)}
                      </div>
                    </div>
                  </div>

                  {/* Expandable Breakdown Drawer Toggle ("Show details") */}
                  <div className="mt-3.5 pt-2.5 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedCardIds((prev) => ({
                          ...prev,
                          [product.id]: !prev[product.id],
                        }))
                      }
                      className="w-full flex items-center justify-between text-xs font-medium text-[#64748B] hover:text-[#2D3134] py-0.5 transition-colors"
                    >
                      <span>
                        {isExpandedMobile ? 'Hide details' : 'Show details'}
                      </span>
                      {isExpandedMobile ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {isExpandedMobile && (
                      <div className="mt-3 pt-2.5 border-t border-slate-200 space-y-2.5 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[#64748B]">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#E78358]" />
                            <span>Materials</span>
                            <span className="font-medium text-[#2D3134]">
                              {formatCurrency(displayMaterialsCost)}
                            </span>
                          </span>

                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#F4B266]" />
                            <span>Packaging</span>
                            <span className="font-medium text-[#2D3134]">
                              {formatCurrency(displayPackagingCost)}
                            </span>
                          </span>

                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#2A8C82]" />
                            <span>Time ({totalMinutes}m)</span>
                            <span className="font-medium text-[#2D3134]">
                              {formatCurrency(displayLaborCost)}
                            </span>
                          </span>
                        </div>

                        <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden flex gap-0.5">
                          <div
                            style={{ width: `${matPct}%` }}
                            className="bg-[#E78358] rounded-full"
                          />
                          <div
                            style={{ width: `${pkgPct}%` }}
                            className="bg-[#F4B266] rounded-full"
                          />
                          <div
                            style={{ width: `${labPct}%` }}
                            className="bg-[#2A8C82] rounded-full"
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-1">
                          <span>
                            {product.items_materials.length} materials •{' '}
                            {totalMinutes}m labor
                          </span>
                          <span>Updated {formatDate(product.updated_at)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* DESKTOP PRODUCT CARD */}
                <div className="hidden md:flex bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 p-7 flex-col justify-between border border-slate-200">
                  <div>
                    {/* Top Row: Category Badge & Summary Metadata */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="inline-flex items-center px-3 py-0.5 rounded-full bg-[#F8F9FA] border border-slate-200 text-[#2D3134] text-xs font-medium">
                        {product.category}
                      </span>

                      <span className="text-xs font-normal text-[#64748B]">
                        {product.items_materials.length} materials • {totalMinutes}m labor
                      </span>
                    </div>

                    {/* Product Title */}
                    <h3 className="text-lg font-semibold text-[#2D3134] leading-snug mb-6">
                      {product.name}
                    </h3>

                    {/* Inline Cost Breakdown + Progress Bar */}
                    <div className="space-y-2.5 pb-6 border-b border-slate-200">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-normal text-[#64748B]">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#E78358]" />
                          <span>Materials</span>
                          <span className="font-medium text-[#2D3134]">
                            {formatCurrency(displayMaterialsCost)}
                          </span>
                        </span>

                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#F4B266]" />
                          <span>Packaging</span>
                          <span className="font-medium text-[#2D3134]">
                            {formatCurrency(displayPackagingCost)}
                          </span>
                        </span>

                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#2A8C82]" />
                          <span>Time</span>
                          <span className="font-medium text-[#2D3134]">
                            {formatCurrency(displayLaborCost)}
                          </span>
                        </span>
                      </div>

                      <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden flex gap-0.5">
                        <div
                          style={{ width: `${matPct}%` }}
                          className="bg-[#E78358] rounded-full transition-all duration-300"
                        />
                        <div
                          style={{ width: `${pkgPct}%` }}
                          className="bg-[#F4B266] rounded-full transition-all duration-300"
                        />
                        <div
                          style={{ width: `${labPct}%` }}
                          className="bg-[#2A8C82] rounded-full transition-all duration-300"
                        />
                      </div>
                    </div>

                    {/* Cost to Make vs. Suggested Price Row */}
                    <div className="flex items-end justify-between gap-4 pt-5">
                      <div>
                        <span className="block text-xs font-normal text-[#64748B]">
                          Cost to Make
                        </span>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                          <span className="text-base font-medium text-[#2D3134]">
                            {formatCurrency(displayBaseCost)}
                          </span>
                          {isStale && (
                            <button
                              type="button"
                              onClick={() => onRecalculateProduct(product.id)}
                              title="Click to accept updated supply costs"
                              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E78358]/10 border border-[#E78358]/30 text-xs font-medium text-[#E78358] hover:bg-[#E78358]/15 transition-colors"
                            >
                              <RefreshCw className="w-3 h-3 shrink-0" />
                              <span>
                                {Math.abs(costDiff) > 0.001
                                  ? `Cost ${
                                      costDiff > 0 ? 'increased' : 'decreased'
                                    } by ${formatCurrency(Math.abs(costDiff))}`
                                  : 'Supply price updated'}
                              </span>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="block text-xs font-normal text-[#64748B]">
                          Suggested Price ({ruleToUse?.name})
                        </span>
                        <div className="inline-flex items-baseline gap-2 mt-0.5">
                          <span className="text-[11px] font-medium text-[#E78358] bg-[#E78358]/10 border border-[#E78358]/30 px-2 py-0.5 rounded-full">
                            {ruleEval.netMarginPercent.toFixed(0)}% margin
                          </span>
                          <span className="text-2xl font-semibold text-[#2A8C82] tracking-tight">
                            {formatCurrency(ruleEval.suggestedRetailPrice)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Subtle Date & Clean Action Buttons */}
                  <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
                    <span className="text-xs font-normal text-[#64748B]">
                      Updated {formatDate(product.updated_at)}
                    </span>

                    {!isConfirmingDelete ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onDuplicateProduct(product.id)}
                          title="Duplicate product"
                          className="p-2 rounded-xl text-[#64748B] hover:text-[#2D3134] hover:bg-[#F8F9FA] transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(product.id)}
                          title="Delete product"
                          className="p-2 rounded-xl text-[#64748B] hover:text-rose-500 hover:bg-rose-50 transition-colors mr-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenEditProduct(product)}
                          className="px-4 py-2 rounded-xl bg-[#2A8C82] hover:bg-[#23736B] text-white text-xs font-medium shadow-sm transition-all"
                        >
                          Price Product
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 bg-rose-50 px-3 py-1 rounded-full">
                        <span className="text-xs font-medium text-rose-700">
                          Delete?
                        </span>
                        <button
                          type="button"
                          onClick={() => onDeleteProduct(product.id)}
                          className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-xs font-medium hover:bg-rose-700"
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2.5 py-0.5 rounded-full text-[#64748B] text-xs font-normal hover:bg-white"
                        >
                          No
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      )}
    </section>
  );
};
