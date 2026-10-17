import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ShoppingBag,
  Layers,
  Package,
  Clock,
  Plus,
  Trash2,
  Check,
  AlertTriangle,
  Sparkles,
  Sliders,
  ArrowUpRight,
} from 'lucide-react';
import {
  LaborRateItem,
  MaterialItem,
  PackagingItem,
  PricingBlock,
  PricingRule,
  ProductItem,
} from '../types/pricing';
import {
  computeBatchTiers,
  computeProductBomTotals,
  evaluatePricingPipeline,
  formatCurrency,
} from '../utils/calculations';
import { CategoryCombobox } from './CategoryCombobox';

interface ProductBomModalProps {
  isOpen: boolean;
  editingProduct: ProductItem | null;
  materialsCatalog: MaterialItem[];
  packagingCatalog: PackagingItem[];
  laborCatalog: LaborRateItem[];
  pricingRules: PricingRule[];
  productCategories: string[];
  onClose: () => void;
  onManageRules?: () => void;
  onSaveProduct: (
    data: {
      name: string;
      category: string;
      default_rule_id?: string;
      items_materials: { material_id: string; qty_used: number }[];
      items_packaging: { packaging_id: string; qty_used: number }[];
      items_labor: { labor_id: string; minutes_spent: number }[];
    },
    editId?: string
  ) => void;
}

export const ProductBomModal: React.FC<ProductBomModalProps> = ({
  isOpen,
  editingProduct,
  materialsCatalog,
  packagingCatalog,
  laborCatalog,
  pricingRules,
  productCategories,
  onClose,
  onManageRules,
  onSaveProduct,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [selectedRuleId, setSelectedRuleId] = useState<string>('');
  const [materialLines, setMaterialLines] = useState<
    { material_id: string; qty_used: string }[]
  >([]);
  const [packagingLines, setPackagingLines] = useState<
    { packaging_id: string; qty_used: string }[]
  >([]);
  const [laborLines, setLaborLines] = useState<
    { labor_id: string; minutes_spent: string }[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);

    if (editingProduct) {
      setName(editingProduct.name);
      setCategory(editingProduct.category);
      setSelectedRuleId(
        editingProduct.default_rule_id || pricingRules[0]?.id || ''
      );
      setMaterialLines(
        editingProduct.items_materials.map((m) => ({
          material_id: m.material_id,
          qty_used: String(m.qty_used),
        }))
      );
      setPackagingLines(
        editingProduct.items_packaging.map((p) => ({
          packaging_id: p.packaging_id,
          qty_used: String(p.qty_used),
        }))
      );
      setLaborLines(
        editingProduct.items_labor.map((l) => ({
          labor_id: l.labor_id,
          minutes_spent: String(l.minutes_spent),
        }))
      );
    } else {
      setName('');
      setCategory('');
      setSelectedRuleId(pricingRules[0]?.id || '');
      setMaterialLines([]);
      setPackagingLines([]);
      setLaborLines([]);
    }
  }, [
    isOpen,
    editingProduct,
    productCategories,
    materialsCatalog,
    packagingCatalog,
    laborCatalog,
    pricingRules,
  ]);

  const liveSummary = useMemo(() => {
    return computeProductBomTotals(
      materialLines.map((m) => ({
        material_id: m.material_id,
        qty_used: parseFloat(m.qty_used) || 0,
      })),
      packagingLines.map((p) => ({
        packaging_id: p.packaging_id,
        qty_used: parseFloat(p.qty_used) || 0,
      })),
      laborLines.map((l) => ({
        labor_id: l.labor_id,
        minutes_spent: parseFloat(l.minutes_spent) || 0,
      })),
      materialsCatalog,
      packagingCatalog,
      laborCatalog
    );
  }, [
    materialLines,
    packagingLines,
    laborLines,
    materialsCatalog,
    packagingCatalog,
    laborCatalog,
  ]);

  const activeRule = useMemo(
    () =>
      pricingRules.find((r) => r.id === selectedRuleId) || pricingRules[0],
    [pricingRules, selectedRuleId]
  );

  const pipelineEvaluation = useMemo(() => {
    const blocks = activeRule?.blocks || [];
    return evaluatePricingPipeline(blocks, {
      materialsCost: liveSummary.total_materials_cost,
      laborCost: liveSummary.total_labor_cost,
      packagingCost: liveSummary.total_packaging_cost,
    });
  }, [activeRule, liveSummary]);

  const batchTiers = useMemo(
    () => computeBatchTiers(pipelineEvaluation),
    [pipelineEvaluation]
  );

  const formatBlockPillLabel = (block: PricingBlock): string => {
    if (block.type === 'BASE_MATERIALS') return 'Materials';
    if (block.type === 'BASE_LABOR') return 'Labor';
    if (block.type === 'BASE_PACKAGING') return 'Packaging';
    if (block.type === 'PERCENT_MODIFIER') {
      const val = block.value ?? 0;
      const cleanLabel = block.label
        .replace(/^Platform Fee\s*\((.*)\)$/i, '$1 Fee')
        .replace(/^Profit\s+/i, '')
        .trim();
      return `+${val}% ${cleanLabel || 'Margin'}`;
    }
    if (block.type === 'FIXED_ADD') {
      return `+${formatCurrency(block.value ?? 0)} ${block.label}`;
    }
    if (block.type === 'DISCOUNT') {
      const val = block.value ?? 0;
      return block.is_percent
        ? `-${val}% ${block.label}`
        : `-${formatCurrency(val)} ${block.label}`;
    }
    return block.label;
  };

  if (!isOpen) return null;

  const isEditing = Boolean(editingProduct);

  // Handlers for Section 1: Materials Used
  const handleAddMaterialLine = () => {
    if (materialsCatalog.length === 0) return;
    const unused = materialsCatalog.find(
      (m) => !materialLines.some((line) => line.material_id === m.id)
    );
    const defaultId = unused ? unused.id : materialsCatalog[0].id;
    setMaterialLines((prev) => [
      ...prev,
      { material_id: defaultId, qty_used: '' },
    ]);
  };

  const handleUpdateMaterialLine = (
    index: number,
    field: 'material_id' | 'qty_used',
    value: string
  ) => {
    setMaterialLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, [field]: value } : line))
    );
  };

  const handleRemoveMaterialLine = (index: number) => {
    setMaterialLines((prev) => prev.filter((_, i) => i !== index));
  };

  // Handlers for Section 2: Packaging Used
  const handleAddPackagingLine = () => {
    if (packagingCatalog.length === 0) return;
    const unused = packagingCatalog.find(
      (p) => !packagingLines.some((line) => line.packaging_id === p.id)
    );
    const defaultId = unused ? unused.id : packagingCatalog[0].id;
    setPackagingLines((prev) => [
      ...prev,
      { packaging_id: defaultId, qty_used: '' },
    ]);
  };

  const handleUpdatePackagingLine = (
    index: number,
    field: 'packaging_id' | 'qty_used',
    value: string
  ) => {
    setPackagingLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, [field]: value } : line))
    );
  };

  const handleRemovePackagingLine = (index: number) => {
    setPackagingLines((prev) => prev.filter((_, i) => i !== index));
  };

  // Handlers for Section 3: Labor Time
  const handleAddLaborLine = () => {
    if (laborCatalog.length === 0) return;
    const unused = laborCatalog.find(
      (l) => !laborLines.some((line) => line.labor_id === l.id)
    );
    const defaultId = unused ? unused.id : laborCatalog[0].id;
    setLaborLines((prev) => [
      ...prev,
      { labor_id: defaultId, minutes_spent: '' },
    ]);
  };

  const handleUpdateLaborLine = (
    index: number,
    field: 'labor_id' | 'minutes_spent',
    value: string
  ) => {
    setLaborLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, [field]: value } : line))
    );
  };

  const handleRemoveLaborLine = (index: number) => {
    setLaborLines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter a Product Name.');
      return;
    }

    if (!category.trim()) {
      setError('Please select or type a Product Category.');
      return;
    }

    onSaveProduct(
      {
        name: name.trim(),
        category: category.trim(),
        default_rule_id: activeRule?.id,
        items_materials: materialLines
          .map((m) => ({
            material_id: m.material_id,
            qty_used: Math.max(0, parseFloat(m.qty_used) || 0),
          }))
          .filter((m) => m.material_id && m.qty_used > 0),
        items_packaging: packagingLines
          .map((p) => ({
            packaging_id: p.packaging_id,
            qty_used: Math.max(0, parseFloat(p.qty_used) || 0),
          }))
          .filter((p) => p.packaging_id && p.qty_used > 0),
        items_labor: laborLines
          .map((l) => ({
            labor_id: l.labor_id,
            minutes_spent: Math.max(0, parseFloat(l.minutes_spent) || 0),
          }))
          .filter((l) => l.labor_id && l.minutes_spent > 0),
      },
      editingProduct?.id
    );

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/20 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-[0_14px_40px_rgb(0,0,0,0.06)] w-full max-w-6xl max-h-[93vh] flex flex-col overflow-hidden my-auto border border-slate-100">
        {/* Top Modal Header */}
        <div className="px-7 sm:px-10 py-5 flex items-center justify-between border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-2xl bg-coral-50 border border-coral-100/80 text-[#E07A5F] flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base sm:text-lg font-semibold text-slate-800">
                  {isEditing
                    ? `${editingProduct?.name}`
                    : 'New Product Recipe'}
                </h2>
                {editingProduct?.price_stale_flag && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 text-xs font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Cost updated</span>
                  </span>
                )}
              </div>
              <p className="text-xs font-normal text-slate-400">
                Materials, time, and selling price
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100/70 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Breathable Split-View Body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-7 sm:px-10 py-8 grid grid-cols-1 lg:grid-cols-12 gap-10"
        >
          {/* LEFT COLUMN: CLEAN LIST-ROW BILL OF MATERIALS (6 cols) */}
          <div className="lg:col-span-6 space-y-8">
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50/80 border border-rose-100 text-rose-700 text-xs font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Product Name & Category (Full-Width Stacked Rows for Long Titles) */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-normal text-slate-400 mb-1.5">
                  Product Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Floral Hardcover Spiral Planner A5 - 2026 Edition"
                  className="w-full px-4 py-2.5 bg-slate-50/70 border border-transparent focus:border-slate-300 focus:bg-white rounded-2xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-normal text-slate-400 mb-1.5">
                  Product Category
                </label>
                <CategoryCombobox
                  value={category}
                  onChange={setCategory}
                  categories={productCategories}
                  placeholder="e.g., Planners & Journals"
                />
              </div>
            </div>

            {/* SECTION 1: MATERIALS USED (Clean List Rows) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#E07A5F]" />
                  <h3 className="text-sm font-medium text-slate-800">
                    Materials Used
                  </h3>
                  <span className="text-xs font-normal text-slate-400">
                    {formatCurrency(liveSummary.total_materials_cost)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleAddMaterialLine}
                  disabled={materialsCatalog.length === 0}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100/80 hover:bg-slate-200/60 disabled:opacity-40 text-slate-600 text-xs font-medium transition-all"
                >
                  <Plus className="w-3 h-3 text-[#E07A5F]" />
                  <span>Add Material</span>
                </button>
              </div>

              {materialLines.length === 0 ? (
                <div className="py-5 text-center text-xs text-slate-400 font-normal">
                  No materials added yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {materialLines.map((line, index) => {
                    const mat = materialsCatalog.find(
                      (m) => m.id === line.material_id
                    );
                    const qty = parseFloat(line.qty_used) || 0;
                    const lineCost = mat ? qty * mat.unit_cost : 0;

                    return (
                      <div
                        key={`${line.material_id}-${index}`}
                        className="py-2.5 grid grid-cols-1 sm:grid-cols-12 items-center gap-2.5"
                      >
                        <div className="sm:col-span-6">
                          <select
                            value={line.material_id}
                            onChange={(e) =>
                              handleUpdateMaterialLine(
                                index,
                                'material_id',
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 bg-slate-50/70 border border-transparent focus:border-slate-300 focus:bg-white rounded-2xl text-xs font-medium text-slate-700 focus:outline-none transition-all"
                          >
                            {materialsCatalog.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name} ({formatCurrency(m.unit_cost, true)}/
                                {m.purchase_unit})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-3 flex items-center gap-1.5">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={line.qty_used}
                            placeholder="0"
                            onChange={(e) =>
                              handleUpdateMaterialLine(
                                index,
                                'qty_used',
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 bg-slate-50/70 border border-transparent focus:border-slate-300 focus:bg-white rounded-2xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none text-right transition-all"
                          />
                          <span className="text-[11px] font-normal text-slate-400 shrink-0">
                            {mat?.purchase_unit || 'un'}
                          </span>
                        </div>

                        <div className="sm:col-span-2 text-right">
                          <span className="text-xs font-medium text-slate-700">
                            {formatCurrency(lineCost, true)}
                          </span>
                        </div>

                        <div className="sm:col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleRemoveMaterialLine(index)}
                            className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg p-1 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SECTION 2: PACKAGING USED (Clean List Rows) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#E07A5F]" />
                  <h3 className="text-sm font-medium text-slate-800">
                    Packaging Used
                  </h3>
                  <span className="text-xs font-normal text-slate-400">
                    {formatCurrency(liveSummary.total_packaging_cost)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleAddPackagingLine}
                  disabled={packagingCatalog.length === 0}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100/80 hover:bg-slate-200/60 disabled:opacity-40 text-slate-600 text-xs font-medium transition-all"
                >
                  <Plus className="w-3 h-3 text-[#E07A5F]" />
                  <span>Add Packaging</span>
                </button>
              </div>

              {packagingLines.length === 0 ? (
                <div className="py-5 text-center text-xs text-slate-400 font-normal">
                  No packaging items added yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {packagingLines.map((line, index) => {
                    const pkg = packagingCatalog.find(
                      (p) => p.id === line.packaging_id
                    );
                    const qty = parseFloat(line.qty_used) || 0;
                    const lineCost = pkg ? qty * pkg.unit_cost : 0;

                    return (
                      <div
                        key={`${line.packaging_id}-${index}`}
                        className="py-2.5 grid grid-cols-1 sm:grid-cols-12 items-center gap-2.5"
                      >
                        <div className="sm:col-span-6">
                          <select
                            value={line.packaging_id}
                            onChange={(e) =>
                              handleUpdatePackagingLine(
                                index,
                                'packaging_id',
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 bg-slate-50/70 border border-transparent focus:border-slate-300 focus:bg-white rounded-2xl text-xs font-medium text-slate-700 focus:outline-none transition-all"
                          >
                            {packagingCatalog.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({formatCurrency(p.unit_cost, true)}/
                                {p.purchase_unit})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-3 flex items-center gap-1.5">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={line.qty_used}
                            placeholder="0"
                            onChange={(e) =>
                              handleUpdatePackagingLine(
                                index,
                                'qty_used',
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 bg-slate-50/70 border border-transparent focus:border-slate-300 focus:bg-white rounded-2xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none text-right transition-all"
                          />
                          <span className="text-[11px] font-normal text-slate-400 shrink-0">
                            {pkg?.purchase_unit || 'un'}
                          </span>
                        </div>

                        <div className="sm:col-span-2 text-right">
                          <span className="text-xs font-medium text-slate-700">
                            {formatCurrency(lineCost, true)}
                          </span>
                        </div>

                        <div className="sm:col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleRemovePackagingLine(index)}
                            className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg p-1 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SECTION 3: LABOR TIME (Clean List Rows) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#E07A5F]" />
                  <h3 className="text-sm font-medium text-slate-800">
                    Labor Time
                  </h3>
                  <span className="text-xs font-normal text-slate-400">
                    {formatCurrency(liveSummary.total_labor_cost)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleAddLaborLine}
                  disabled={laborCatalog.length === 0}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100/80 hover:bg-slate-200/60 disabled:opacity-40 text-slate-600 text-xs font-medium transition-all"
                >
                  <Plus className="w-3 h-3 text-[#E07A5F]" />
                  <span>Add Labor Time</span>
                </button>
              </div>

              {laborLines.length === 0 ? (
                <div className="py-5 text-center text-xs text-slate-400 font-normal">
                  No labor steps added yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {laborLines.map((line, index) => {
                    const lab = laborCatalog.find((l) => l.id === line.labor_id);
                    const mins = parseFloat(line.minutes_spent) || 0;
                    const lineCost = lab ? (mins / 60) * lab.hourly_rate : 0;

                    return (
                      <div
                        key={`${line.labor_id}-${index}`}
                        className="py-2.5 grid grid-cols-1 sm:grid-cols-12 items-center gap-2.5"
                      >
                        <div className="sm:col-span-6">
                          <select
                            value={line.labor_id}
                            onChange={(e) =>
                              handleUpdateLaborLine(
                                index,
                                'labor_id',
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 bg-slate-50/70 border border-transparent focus:border-slate-300 focus:bg-white rounded-2xl text-xs font-medium text-slate-700 focus:outline-none transition-all"
                          >
                            {laborCatalog.map((l) => (
                              <option key={l.id} value={l.id}>
                                {l.name} ({formatCurrency(l.hourly_rate)}/hr)
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-3 flex items-center gap-1.5">
                          <input
                            type="number"
                            step="1"
                            min="0"
                            value={line.minutes_spent}
                            placeholder="0"
                            onChange={(e) =>
                              handleUpdateLaborLine(
                                index,
                                'minutes_spent',
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 bg-slate-50/70 border border-transparent focus:border-slate-300 focus:bg-white rounded-2xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none text-right transition-all"
                          />
                          <span className="text-[11px] font-normal text-slate-400 shrink-0">
                            min
                          </span>
                        </div>

                        <div className="sm:col-span-2 text-right">
                          <span className="text-xs font-medium text-slate-700">
                            {formatCurrency(lineCost)}
                          </span>
                        </div>

                        <div className="sm:col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleRemoveLaborLine(index)}
                            className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg p-1 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: FLOATING LIVE PREVIEW & PRICING SIMULATOR (6 cols) */}
          <div className="lg:col-span-6">
            <div className="bg-[#F4F7FB]/70 rounded-3xl p-6 border border-slate-100 space-y-6">
              {/* Active Rule Selector (Select-Only) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#E07A5F]" />
                  <span className="text-sm font-medium text-slate-800">
                    Pricing Rule
                  </span>
                </div>

                <select
                  value={activeRule?.id || ''}
                  onChange={(e) => setSelectedRuleId(e.target.value)}
                  className="px-3.5 py-1.5 bg-white border border-slate-200/60 rounded-full text-xs font-medium text-slate-700 focus:outline-none shadow-2xs"
                >
                  {pricingRules.map((rule) => (
                    <option key={rule.id} value={rule.id}>
                      {rule.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* LUMINOUS HERO PRICE CARD */}
              <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#E07A5F]">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Suggested Price ({activeRule?.name})</span>
                    </span>
                    <div className="text-3xl sm:text-4xl font-semibold text-slate-800 tracking-tight mt-1">
                      {formatCurrency(pipelineEvaluation.suggestedRetailPrice)}
                    </div>
                  </div>

                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-medium">
                    +{pipelineEvaluation.netMarginPercent.toFixed(0)}% margin
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 font-normal block">
                      Cost to Make
                    </span>
                    <span className="text-sm font-semibold text-slate-700 mt-0.5 block">
                      {formatCurrency(pipelineEvaluation.totalProductionCost)}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-normal block">
                      Your Profit
                    </span>
                    <span className="text-sm font-semibold text-emerald-600 mt-0.5 block">
                      {formatCurrency(pipelineEvaluation.netProfit)}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-normal block">
                      Fees
                    </span>
                    <span className="text-sm font-semibold text-indigo-600 mt-0.5 block">
                      {formatCurrency(pipelineEvaluation.platformFeesTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Read-Only Informative Price Steps Pipeline */}
              <div className="bg-white rounded-2xl p-4 border border-slate-100 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-normal text-slate-400">
                    Price Steps
                  </span>
                  {onManageRules && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onManageRules();
                      }}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#E07A5F] hover:text-[#c9674d] transition-colors"
                    >
                      <span>Manage rules in Pricing Rules tab</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Visual Formula Breadcrumb */}
                {activeRule && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {activeRule.blocks.map((block, idx) => (
                      <React.Fragment key={block.id}>
                        <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-full font-medium">
                          {formatBlockPillLabel(block)}
                        </span>
                        {idx < activeRule.blocks.length - 1 && (
                          <span className="text-slate-400 font-normal text-xs px-0.5">
                            +
                          </span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                )}

                {/* Read-Only Step Breakdown */}
                <div className="divide-y divide-slate-100 pt-1">
                  {pipelineEvaluation.steps.map((step, idx) => {
                    const isDiscount = step.block.type === 'DISCOUNT';
                    const isBase =
                      step.block.type === 'BASE_MATERIALS' ||
                      step.block.type === 'BASE_LABOR' ||
                      step.block.type === 'BASE_PACKAGING';
                    return (
                      <div
                        key={step.block.id}
                        className="py-2 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-500 text-[10px] font-medium flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-slate-700 font-normal truncate">
                            {step.block.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span
                            className={`font-medium ${
                              isDiscount
                                ? 'text-rose-600'
                                : isBase
                                ? 'text-slate-600'
                                : 'text-emerald-600'
                            }`}
                          >
                            {step.deltaAmount >= 0 ? '+' : ''}
                            {formatCurrency(step.deltaAmount)}
                          </span>
                          <span className="text-[11px] font-normal text-slate-400 w-16 text-right">
                            {formatCurrency(step.runningSubtotal)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Lightweight Batch / Tier Table */}
              <div className="bg-white rounded-2xl p-4 border border-slate-100 space-y-2">
                <span className="text-xs font-normal text-slate-400 block px-1">
                  Quantity Discounts
                </span>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-normal">
                        <th className="py-2 px-2.5 font-normal">Quantity</th>
                        <th className="py-2 px-2.5 font-normal">Unit Price</th>
                        <th className="py-2 px-2.5 font-normal">Total</th>
                        <th className="py-2 px-2.5 font-normal text-right">
                          Profit
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {batchTiers.map((tier) => (
                        <tr key={tier.qty}>
                          <td className="py-2 px-2.5 font-medium text-slate-700">
                            {tier.label}
                          </td>
                          <td className="py-2 px-2.5 font-medium text-slate-800">
                            {formatCurrency(tier.unitPrice)}
                          </td>
                          <td className="py-2 px-2.5 font-normal text-slate-500">
                            {formatCurrency(tier.totalRevenue)}
                          </td>
                          <td className="py-2 px-2.5 text-right font-medium text-emerald-600">
                            {formatCurrency(tier.totalProfit)}{' '}
                            <span className="text-[11px] font-normal text-slate-400">
                              ({tier.marginPercent.toFixed(0)}%)
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer Save / Cancel */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-full text-xs font-normal text-slate-500 hover:text-slate-800 hover:bg-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs sm:text-sm px-6 py-2.5 rounded-full shadow-xs transition-all"
                >
                  <Check className="w-3.5 h-3.5 text-[#E07A5F]" />
                  <span>
                    {isEditing ? 'Save Recipe' : 'Create Product'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
