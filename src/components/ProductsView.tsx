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
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [filterAffectedOnly, setFilterAffectedOnly] = useState(false);
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
    return products.filter((prod) => {
      const matchesSearch =
        prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prod.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat =
        selectedCategory === 'ALL' || prod.category === selectedCategory;
      const matchesAffected =
        !filterAffectedOnly || Boolean(prod.price_stale_flag);
      return matchesSearch && matchesCat && matchesAffected;
    });
  }, [products, searchQuery, selectedCategory, filterAffectedOnly]);

  return (
    <section className="space-y-8">
      {/* Slim, Single-Line Cascade Impact Alert Banner */}
      {affectedProducts.length > 0 && (
        <div
          role="alert"
          className="bg-[#FDF3F0] rounded-2xl px-5 py-3 border border-[#E8A184]/50 flex flex-wrap items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center gap-2 text-[#C66746] font-normal">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#C66746]" />
            <span>
              <strong className="font-medium text-[#303C36]">
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
              className="px-3 py-1 rounded-full text-xs font-medium text-[#63726A] hover:text-[#303C36] bg-white hover:bg-[#FAFBFA] border border-[#E8ECE9] transition-colors"
            >
              {filterAffectedOnly ? 'Show All' : 'Review'}
            </button>
            <button
              type="button"
              onClick={() => {
                onRecalculateAllAffected();
                setFilterAffectedOnly(false);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-medium bg-[#42685B] hover:bg-[#36544a] text-white transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#E8A184]" />
              <span>Update All</span>
            </button>
          </div>
        </div>
      )}

      {/* Simplified, Breathable Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 px-1">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#303C36] tracking-tight">
              My Products
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-white border border-[#E8ECE9] text-xs font-normal text-[#63726A]">
              {products.length} {products.length === 1 ? 'Product' : 'Products'}
            </span>
            {affectedProducts.length === 0 && (
              <span className="hidden sm:inline-block text-xs font-normal text-[#63726A]">
                • All prices current
              </span>
            )}
          </div>
          <p className="text-sm font-normal text-[#63726A] mt-1">
            Calculate prices and track profit.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenRulesTab}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-[#E8ECE9] text-[#63726A] hover:text-[#303C36] hover:bg-[#FAFBFA] text-xs font-medium transition-all"
          >
            <Sliders className="w-3.5 h-3.5 text-[#E8A184]" />
            <span>Pricing Rules</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddProduct}
            className="inline-flex items-center gap-1.5 bg-[#42685B] hover:bg-[#36544a] text-white font-medium text-xs sm:text-sm px-4 py-2 rounded-full transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-[#E8A184]" />
            <span>New Product</span>
          </button>
        </div>
      </div>

      {/* Minimalist Filter & Rule Simulation Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative min-w-[200px] max-w-xs flex-1">
            <Search className="w-3.5 h-3.5 text-[#63726A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
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

          {/* Category Filter Pills */}
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

        {/* Rule Simulation Pill */}
        <div className="flex items-center gap-2 self-end md:self-auto bg-white border border-[#E8ECE9] rounded-full px-3.5 py-1.5 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
          <span className="text-xs font-normal text-[#63726A]">Rule:</span>
          <select
            value={globalRuleOverrideId}
            onChange={(e) => {
              setGlobalRuleOverrideId(e.target.value);
              setCardRuleOverrides({});
            }}
            className="bg-transparent text-xs font-medium text-[#303C36] focus:outline-none cursor-pointer"
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

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#E8ECE9] p-12 text-center max-w-md mx-auto my-8">
          <h3 className="text-base font-medium text-[#303C36]">
            No products found
          </h3>
          <p className="text-xs font-normal text-[#63726A] mt-1 mb-5">
            Create a product recipe to calculate your selling price.
          </p>
          <button
            type="button"
            onClick={onOpenAddProduct}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#42685B] text-white text-xs font-medium hover:bg-[#36544a] transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-[#E8A184]" />
            <span>New Product</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
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
                <div className="md:hidden bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#E8ECE9] p-5 flex flex-col justify-between relative">
                  {/* Top Row: Product Title & 3-Dots Action Menu */}
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-semibold text-[#303C36] leading-snug">
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
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[#63726A] hover:text-[#303C36] hover:bg-[#FAFBFA] transition-colors"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>

                      {isMenuOpenMobile && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenMenuProductId(null)}
                          />
                          <div className="absolute right-0 mt-1 w-40 bg-white rounded-2xl shadow-[0_12px_36px_rgb(0,0,0,0.12)] border border-[#E8ECE9] py-1.5 z-20">
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuProductId(null);
                                onOpenEditProduct(product);
                              }}
                              className="w-full px-3.5 py-2 text-left text-xs font-medium text-[#303C36] hover:bg-[#FAFBFA] flex items-center gap-2"
                            >
                              <Pencil className="w-3.5 h-3.5 text-[#63726A]" />
                              <span>Edit Recipe</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuProductId(null);
                                onDuplicateProduct(product.id);
                              }}
                              className="w-full px-3.5 py-2 text-left text-xs font-medium text-[#303C36] hover:bg-[#FAFBFA] flex items-center gap-2"
                            >
                              <Copy className="w-3.5 h-3.5 text-[#63726A]" />
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

                  {/* Delete Confirmation Inline Banner (if triggered on mobile) */}
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
                          className="px-3 py-1 rounded-full bg-white text-[#63726A] text-xs font-normal"
                        >
                          No
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Category & Base Production Cost Cleanly Side-by-Side */}
                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#B8C9BD]/25 border border-[#B8C9BD]/50 text-[#303C36] text-xs font-normal">
                      {product.category}
                    </span>

                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-[#63726A] font-normal">
                        Base Cost:
                      </span>
                      <span className="font-semibold text-[#303C36]">
                        {formatCurrency(displayBaseCost)}
                      </span>
                      {isStale && (
                        <button
                          type="button"
                          onClick={() => onRecalculateProduct(product.id)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FDF3F0] border border-[#E8A184]/50 text-[11px] font-medium text-[#C66746]"
                        >
                          <RefreshCw className="w-2.5 h-2.5" />
                          <span>Update</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Hero Section: Suggested Retail Price + Inline Pricing Rule Switcher */}
                  <div className="mt-4 pt-3.5 border-t border-[#E8ECE9] flex items-end justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <label className="block text-[11px] font-normal text-[#63726A] mb-1">
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
                        className="w-full max-w-[170px] bg-[#FAFBFA] hover:bg-[#E8ECE9]/60 border border-[#E8ECE9] rounded-xl px-2.5 py-1.5 text-xs font-medium text-[#303C36] focus:outline-none truncate cursor-pointer"
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
                        <span className="text-[11px] font-normal text-[#63726A]">
                          Suggested Price
                        </span>
                        <span className="text-[11px] font-medium text-[#C66746] bg-[#FDF3F0] border border-[#E8A184]/50 px-2 py-0.5 rounded-full">
                          {ruleEval.netMarginPercent.toFixed(0)}% margin
                        </span>
                      </div>
                      <div className="text-3xl font-bold text-[#42685B] tracking-tight leading-none">
                        {formatCurrency(ruleEval.suggestedRetailPrice)}
                      </div>
                    </div>
                  </div>

                  {/* Expandable Breakdown Drawer Toggle ("Show details") */}
                  <div className="mt-3.5 pt-2.5 border-t border-[#E8ECE9]">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedCardIds((prev) => ({
                          ...prev,
                          [product.id]: !prev[product.id],
                        }))
                      }
                      className="w-full flex items-center justify-between text-xs font-medium text-[#63726A] hover:text-[#303C36] py-0.5 transition-colors"
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
                      <div className="mt-3 pt-2.5 border-t border-[#E8ECE9] space-y-2.5 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[#63726A]">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#E8A184]" />
                            <span>Materials</span>
                            <span className="font-medium text-[#303C36]">
                              {formatCurrency(displayMaterialsCost)}
                            </span>
                          </span>

                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#B8C9BD]" />
                            <span>Packaging</span>
                            <span className="font-medium text-[#303C36]">
                              {formatCurrency(displayPackagingCost)}
                            </span>
                          </span>

                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#42685B]" />
                            <span>Time ({totalMinutes}m)</span>
                            <span className="font-medium text-[#303C36]">
                              {formatCurrency(displayLaborCost)}
                            </span>
                          </span>
                        </div>

                        <div className="h-1 w-full rounded-full bg-[#E8ECE9] overflow-hidden flex gap-0.5">
                          <div
                            style={{ width: `${matPct}%` }}
                            className="bg-[#E8A184] rounded-full"
                          />
                          <div
                            style={{ width: `${pkgPct}%` }}
                            className="bg-[#B8C9BD] rounded-full"
                          />
                          <div
                            style={{ width: `${labPct}%` }}
                            className="bg-[#42685B] rounded-full"
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-[#63726A] pt-1">
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

                {/* DESKTOP PRODUCT CARD (md: and lg: layout completely preserved) */}
                <div className="hidden md:flex bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_14px_40px_rgb(0,0,0,0.06)] transition-all duration-200 p-7 flex-col justify-between border border-[#E8ECE9]">
                  <div>
                    {/* Top Row: Only Category Badge */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="inline-flex items-center px-3 py-0.5 rounded-full bg-[#B8C9BD]/25 border border-[#B8C9BD]/50 text-[#303C36] text-xs font-normal">
                        {product.category}
                      </span>

                      <span className="text-xs font-normal text-[#63726A]">
                        {product.items_materials.length} materials • {totalMinutes}m labor
                      </span>
                    </div>

                    {/* Product Title */}
                    <h3 className="text-lg font-semibold text-[#303C36] leading-snug mb-6">
                      {product.name}
                    </h3>

                    {/* Minimalist Inline Cost Breakdown + Delicate Single-Line Progress Bar */}
                    <div className="space-y-2.5 pb-6 border-b border-[#E8ECE9]">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-normal text-[#63726A]">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#E8A184]" />
                          <span>Materials</span>
                          <span className="font-medium text-[#303C36]">
                            {formatCurrency(displayMaterialsCost)}
                          </span>
                        </span>

                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#B8C9BD]" />
                          <span>Packaging</span>
                          <span className="font-medium text-[#303C36]">
                            {formatCurrency(displayPackagingCost)}
                          </span>
                        </span>

                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#42685B]" />
                          <span>Time</span>
                          <span className="font-medium text-[#303C36]">
                            {formatCurrency(displayLaborCost)}
                          </span>
                        </span>
                      </div>

                      <div className="h-1 w-full rounded-full bg-[#E8ECE9] overflow-hidden flex gap-0.5">
                        <div
                          style={{ width: `${matPct}%` }}
                          className="bg-[#E8A184] rounded-full transition-all duration-300"
                        />
                        <div
                          style={{ width: `${pkgPct}%` }}
                          className="bg-[#B8C9BD] rounded-full transition-all duration-300"
                        />
                        <div
                          style={{ width: `${labPct}%` }}
                          className="bg-[#42685B] rounded-full transition-all duration-300"
                        />
                      </div>
                    </div>

                    {/* Cost to Make vs. Suggested Price Row */}
                    <div className="flex items-end justify-between gap-4 pt-5">
                      <div>
                        <span className="block text-xs font-normal text-[#63726A]">
                          Cost to Make
                        </span>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                          <span className="text-base font-medium text-[#303C36]">
                            {formatCurrency(displayBaseCost)}
                          </span>
                          {isStale && (
                            <button
                              type="button"
                              onClick={() => onRecalculateProduct(product.id)}
                              title="Click to accept updated supply costs"
                              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FDF3F0] border border-[#E8A184]/50 text-xs font-normal text-[#C66746] hover:bg-[#F9E3DC] transition-colors"
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
                        <span className="block text-xs font-normal text-[#63726A]">
                          Suggested Price ({ruleToUse?.name})
                        </span>
                        <div className="inline-flex items-baseline gap-2 mt-0.5">
                          <span className="text-[11px] font-medium text-[#C66746] bg-[#FDF3F0] border border-[#E8A184]/50 px-2 py-0.5 rounded-full">
                            {ruleEval.netMarginPercent.toFixed(0)}% margin
                          </span>
                          <span className="text-2xl font-semibold text-[#42685B] tracking-tight">
                            {formatCurrency(ruleEval.suggestedRetailPrice)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Subtle Date & Clean Action Buttons */}
                  <div className="mt-6 pt-4 border-t border-[#E8ECE9] flex items-center justify-between gap-3">
                    <span className="text-xs font-normal text-[#63726A]">
                      Updated {formatDate(product.updated_at)}
                    </span>

                    {!isConfirmingDelete ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onDuplicateProduct(product.id)}
                          title="Duplicate product"
                          className="p-2 rounded-full text-[#63726A] hover:text-[#303C36] hover:bg-[#FAFBFA] transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(product.id)}
                          title="Delete product"
                          className="p-2 rounded-full text-[#63726A] hover:text-rose-500 hover:bg-rose-50 transition-colors mr-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenEditProduct(product)}
                          className="px-4 py-1.5 rounded-full bg-[#42685B] hover:bg-[#36544a] text-white text-xs font-medium transition-all"
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
                          className="px-2.5 py-0.5 rounded-full text-[#63726A] text-xs font-normal hover:bg-white"
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
