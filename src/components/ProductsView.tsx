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
          className="bg-amber-50/70 rounded-2xl px-5 py-3 border border-amber-200/50 flex flex-wrap items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center gap-2 text-amber-700 font-normal">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>
              <strong className="font-medium text-amber-900">
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
              className="px-3 py-1 rounded-full text-xs font-medium text-slate-600 hover:text-slate-900 bg-white/80 hover:bg-white border border-slate-200/60 transition-colors"
            >
              {filterAffectedOnly ? 'Show All' : 'Review'}
            </button>
            <button
              type="button"
              onClick={() => {
                onRecalculateAllAffected();
                setFilterAffectedOnly(false);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-medium bg-slate-800 hover:bg-slate-700 text-white transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#E07A5F]" />
              <span>Update All</span>
            </button>
          </div>
        </div>
      )}

      {/* Simplified, Breathable Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 px-1">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-800 tracking-tight">
              My Products
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-white border border-slate-200/60 text-xs font-normal text-slate-500">
              {products.length} {products.length === 1 ? 'Product' : 'Products'}
            </span>
            {affectedProducts.length === 0 && (
              <span className="hidden sm:inline-block text-xs font-normal text-slate-400">
                • All prices current
              </span>
            )}
          </div>
          <p className="text-sm font-normal text-slate-400 mt-1">
            Calculate prices and track profit.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenRulesTab}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-slate-200/70 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-medium transition-all"
          >
            <Sliders className="w-3.5 h-3.5 text-[#E07A5F]" />
            <span>Pricing Rules</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddProduct}
            className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs sm:text-sm px-4 py-2 rounded-full transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-[#E07A5F]" />
            <span>New Product</span>
          </button>
        </div>
      </div>

      {/* Minimalist Filter & Rule Simulation Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative min-w-[200px] max-w-xs flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
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

          {/* Category Filter Pills */}
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

        {/* Rule Simulation Pill */}
        <div className="flex items-center gap-2 self-end md:self-auto bg-white border border-slate-100 rounded-full px-3.5 py-1.5 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
          <span className="text-xs font-normal text-slate-400">Rule:</span>
          <select
            value={globalRuleOverrideId}
            onChange={(e) => setGlobalRuleOverrideId(e.target.value)}
            className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
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
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-12 text-center max-w-md mx-auto my-8">
          <h3 className="text-base font-medium text-slate-800">
            No products found
          </h3>
          <p className="text-xs font-normal text-slate-400 mt-1 mb-5">
            Create a product recipe to calculate your selling price.
          </p>
          <button
            type="button"
            onClick={onOpenAddProduct}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-slate-800 text-white text-xs font-medium hover:bg-slate-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-[#E07A5F]" />
            <span>New Product</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredProducts.map((product) => {
            const isStale = Boolean(product.price_stale_flag);
            const isConfirmingDelete = confirmDeleteId === product.id;

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

            const ruleToUse =
              globalRuleOverrideId !== 'PRODUCT_DEFAULT'
                ? pricingRules.find((r) => r.id === globalRuleOverrideId) ||
                  pricingRules[0]
                : pricingRules.find((r) => r.id === product.default_rule_id) ||
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
              <div
                key={product.id}
                className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_14px_40px_rgb(0,0,0,0.06)] transition-all duration-200 p-7 flex flex-col justify-between border border-slate-100"
              >
                <div>
                  {/* Top Row: Only Category Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center px-3 py-0.5 rounded-full bg-slate-100/70 text-slate-500 text-xs font-normal">
                      {product.category}
                    </span>

                    <span className="text-xs font-normal text-slate-400">
                      {product.items_materials.length} materials • {totalMinutes}m labor
                    </span>
                  </div>

                  {/* Product Title */}
                  <h3 className="text-lg font-semibold text-slate-800 leading-snug mb-6">
                    {product.name}
                  </h3>

                  {/* Minimalist Inline Cost Breakdown + Delicate Single-Line Progress Bar */}
                  <div className="space-y-2.5 pb-6 border-b border-slate-100">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-normal text-slate-400">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#E07A5F]" />
                        <span>Materials</span>
                        <span className="font-medium text-slate-700">
                          {formatCurrency(displayMaterialsCost)}
                        </span>
                      </span>

                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span>Packaging</span>
                        <span className="font-medium text-slate-700">
                          {formatCurrency(displayPackagingCost)}
                        </span>
                      </span>

                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                        <span>Time</span>
                        <span className="font-medium text-slate-700">
                          {formatCurrency(displayLaborCost)}
                        </span>
                      </span>
                    </div>

                    <div className="h-1 w-full rounded-full bg-slate-100 overflow-hidden flex gap-0.5">
                      <div
                        style={{ width: `${matPct}%` }}
                        className="bg-[#E07A5F] rounded-full transition-all duration-300"
                      />
                      <div
                        style={{ width: `${pkgPct}%` }}
                        className="bg-amber-400 rounded-full transition-all duration-300"
                      />
                      <div
                        style={{ width: `${labPct}%` }}
                        className="bg-indigo-400 rounded-full transition-all duration-300"
                      />
                    </div>
                  </div>

                  {/* Cost to Make vs. Suggested Price Row */}
                  <div className="flex items-end justify-between gap-4 pt-5">
                    <div>
                      <span className="block text-xs font-normal text-slate-400">
                        Cost to Make
                      </span>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        <span className="text-base font-medium text-slate-700">
                          {formatCurrency(displayBaseCost)}
                        </span>
                        {isStale && (
                          <button
                            type="button"
                            onClick={() => onRecalculateProduct(product.id)}
                            title="Click to accept updated supply costs"
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50/80 text-xs font-normal text-amber-700 hover:bg-amber-100/70 transition-colors"
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
                      <span className="block text-xs font-normal text-slate-400">
                        Suggested Price ({ruleToUse?.name})
                      </span>
                      <div className="inline-flex items-baseline gap-2 mt-0.5">
                        <span className="text-[11px] font-normal text-emerald-700 bg-emerald-50/80 px-2 py-0.5 rounded-full">
                          {ruleEval.netMarginPercent.toFixed(0)}% margin
                        </span>
                        <span className="text-2xl font-semibold text-slate-800 tracking-tight">
                          {formatCurrency(ruleEval.suggestedRetailPrice)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Subtle Date & Clean Action Buttons */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <span className="text-xs font-normal text-slate-400">
                    Updated {formatDate(product.updated_at)}
                  </span>

                  {!isConfirmingDelete ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onDuplicateProduct(product.id)}
                        title="Duplicate product"
                        className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(product.id)}
                        title="Delete product"
                        className="p-2 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors mr-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenEditProduct(product)}
                        className="px-4 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-all"
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
                        className="px-2.5 py-0.5 rounded-full text-slate-600 text-xs font-normal hover:bg-white"
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
      )}
    </section>
  );
};
