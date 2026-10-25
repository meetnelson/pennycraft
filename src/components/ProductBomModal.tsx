import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
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
  PricingRule,
  ProductItem,
} from '../types/pricing';
import {
  applyTargetMarginToBlocks,
  computeBatchTiers,
  computeProductBomTotals,
  evaluatePricingPipeline,
  formatBlockPillLabel,
  formatCurrency,
  isFeeBlock,
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
  onOpenCategoryManager?: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
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
  onOpenCategoryManager,
  onDirtyChange,
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
  const [customTargetMarginPercent, setCustomTargetMarginPercent] = useState<
    number | null
  >(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const initialSnapshot = useMemo(() => {
    const defaultRule =
      editingProduct?.default_rule_id || pricingRules[0]?.id || '';
    if (!editingProduct) {
      return {
        name: '',
        category: '',
        selectedRuleId: defaultRule,
        materialLines: [] as { material_id: string; qty_used: string }[],
        packagingLines: [] as { packaging_id: string; qty_used: string }[],
        laborLines: [] as { labor_id: string; minutes_spent: string }[],
      };
    }
    return {
      name: editingProduct.name,
      category: editingProduct.category,
      selectedRuleId: defaultRule,
      materialLines: editingProduct.items_materials.map((m) => ({
        material_id: m.material_id,
        qty_used: String(m.qty_used),
      })),
      packagingLines: editingProduct.items_packaging.map((p) => ({
        packaging_id: p.packaging_id,
        qty_used: String(p.qty_used),
      })),
      laborLines: editingProduct.items_labor.map((l) => ({
        labor_id: l.labor_id,
        minutes_spent: String(l.minutes_spent),
      })),
    };
  }, [editingProduct, pricingRules]);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setCustomTargetMarginPercent(null);
    setShowDiscardConfirm(false);
    setPendingAction(null);

    setName(initialSnapshot.name);
    setCategory(initialSnapshot.category);
    setSelectedRuleId(initialSnapshot.selectedRuleId);
    setMaterialLines(initialSnapshot.materialLines);
    setPackagingLines(initialSnapshot.packagingLines);
    setLaborLines(initialSnapshot.laborLines);
  }, [isOpen, initialSnapshot]);

  const isDirty = useMemo(() => {
    if (!isOpen) return false;
    if (name !== initialSnapshot.name) return true;
    if (category !== initialSnapshot.category) return true;
    if (selectedRuleId !== initialSnapshot.selectedRuleId) return true;
    if (
      JSON.stringify(materialLines) !==
      JSON.stringify(initialSnapshot.materialLines)
    )
      return true;
    if (
      JSON.stringify(packagingLines) !==
      JSON.stringify(initialSnapshot.packagingLines)
    )
      return true;
    if (
      JSON.stringify(laborLines) !== JSON.stringify(initialSnapshot.laborLines)
    )
      return true;
    return false;
  }, [
    isOpen,
    name,
    category,
    selectedRuleId,
    materialLines,
    packagingLines,
    laborLines,
    initialSnapshot,
  ]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    if (!isOpen || !isDirty) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isOpen, isDirty]);

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

  const effectiveBlocks = useMemo(() => {
    const baseBlocks = activeRule?.blocks || [];
    if (customTargetMarginPercent === null) return baseBlocks;
    return applyTargetMarginToBlocks(
      baseBlocks,
      {
        materialsCost: liveSummary.total_materials_cost,
        laborCost: liveSummary.total_labor_cost,
        packagingCost: liveSummary.total_packaging_cost,
      },
      customTargetMarginPercent
    );
  }, [activeRule, customTargetMarginPercent, liveSummary]);

  const pipelineEvaluation = useMemo(() => {
    return evaluatePricingPipeline(effectiveBlocks, {
      materialsCost: liveSummary.total_materials_cost,
      laborCost: liveSummary.total_labor_cost,
      packagingCost: liveSummary.total_packaging_cost,
    });
  }, [effectiveBlocks, liveSummary]);

  const sliderMarginValue = useMemo(() => {
    if (customTargetMarginPercent !== null) return customTargetMarginPercent;
    const rounded = Math.round(pipelineEvaluation.netMarginPercent);
    return Math.min(80, Math.max(10, isFinite(rounded) ? rounded : 30));
  }, [customTargetMarginPercent, pipelineEvaluation.netMarginPercent]);

  const batchTiers = useMemo(
    () => computeBatchTiers(pipelineEvaluation),
    [pipelineEvaluation]
  );

  if (!isOpen) return null;

  const isEditing = Boolean(editingProduct);

  const attemptActionWithGuard = (action: () => void) => {
    if (isDirty) {
      setPendingAction(() => action);
      setShowDiscardConfirm(true);
    } else {
      action();
    }
  };

  const handleRequestClose = () => {
    attemptActionWithGuard(onClose);
  };

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

    onDirtyChange?.(false);
    onClose();
  };

  return (
    <div className="w-full space-y-6 pb-12 animate-fadeIn">
      {/* Dedicated View Top Navigation Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={handleRequestClose}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#F8F9FA] text-[#2D3134] border border-slate-200 text-xs font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#64748B]" />
            <span>Back to list</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#2A8C82]/10 border border-[#2A8C82]/25 text-[#2A8C82] hidden sm:flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-semibold text-[#2D3134] tracking-tight">
                  {isEditing
                    ? `Edit Recipe: ${editingProduct?.name}`
                    : 'New Product Recipe'}
                </h1>
                {editingProduct?.price_stale_flag && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E78358]/10 text-[#E78358] border border-[#E78358]/30 text-xs font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Cost updated</span>
                  </span>
                )}
              </div>
              <p className="text-xs font-normal text-[#64748B]">
                Assemble materials, packaging, handcrafting time, and pricing rule
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dedicated Full-Height Form Body (No Constrained Vertical Overflow) */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-visible"
      >
        <div className="p-6 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* LEFT COLUMN: CLEAN LIST-ROW BILL OF MATERIALS (6 cols) */}
          <div className="lg:col-span-6 space-y-8">
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50/80 border border-rose-100 text-rose-700 text-xs font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Product Name & Category */}
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-[#2D3134] mb-2">
                  Product Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Floral Hardcover Spiral Planner A5 - 2026 Edition"
                  className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-[#2A8C82] focus:ring-1 focus:ring-[#2A8C82] outline-none rounded-2xl text-sm font-medium text-[#2D3134] placeholder:text-[#64748B] transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-medium text-[#2D3134]">
                    Product Category
                  </label>
                  {onOpenCategoryManager && (
                    <button
                      type="button"
                      onClick={onOpenCategoryManager}
                      className="text-[11px] font-medium text-[#2A8C82] hover:underline"
                    >
                      Manage Categories
                    </button>
                  )}
                </div>
                <CategoryCombobox
                  value={category}
                  onChange={setCategory}
                  categories={productCategories}
                  onOpenCategoryManager={onOpenCategoryManager}
                  placeholder="e.g., Planners & Journals"
                />
              </div>
            </div>

            {/* SECTION 1: MATERIALS USED */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#E78358]" />
                  <h3 className="text-sm font-semibold text-[#2D3134]">
                    Materials Used
                  </h3>
                  <span className="text-xs font-medium text-[#64748B]">
                    {formatCurrency(liveSummary.total_materials_cost)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleAddMaterialLine}
                  disabled={materialsCatalog.length === 0}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-[#F8F9FA] hover:border-[#2A8C82]/40 disabled:opacity-40 text-[#2D3134] text-xs font-medium transition-all"
                >
                  <Plus className="w-3.5 h-3.5 text-[#2A8C82]" />
                  <span>Add Material</span>
                </button>
              </div>

              {materialLines.length === 0 ? (
                <div className="py-5 text-center text-xs text-[#64748B] font-normal bg-[#F8F9FA] rounded-2xl border border-dashed border-slate-200">
                  No materials added yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {materialLines.map((line, index) => {
                    const mat = materialsCatalog.find(
                      (m) => m.id === line.material_id
                    );
                    const qty = parseFloat(line.qty_used) || 0;
                    const lineCost = mat ? qty * mat.unit_cost : 0;

                    return (
                      <div
                        key={`${line.material_id}-${index}`}
                        className="py-3 grid grid-cols-1 sm:grid-cols-12 items-center gap-2.5"
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
                            className="w-full px-3 py-2.5 bg-white border border-slate-200 focus:border-[#2A8C82] focus:ring-1 focus:ring-[#2A8C82] outline-none rounded-xl text-xs font-medium text-[#2D3134] transition-all"
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
                            className="w-full px-3 py-2.5 bg-white border border-slate-200 focus:border-[#2A8C82] focus:ring-1 focus:ring-[#2A8C82] outline-none rounded-xl text-xs font-medium text-[#2D3134] placeholder:text-[#64748B] text-right transition-all"
                          />
                          <span className="text-[11px] font-normal text-[#64748B] shrink-0">
                            {mat?.purchase_unit || 'un'}
                          </span>
                        </div>

                        <div className="sm:col-span-2 text-right">
                          <span className="text-xs font-semibold text-[#2D3134]">
                            {formatCurrency(lineCost, true)}
                          </span>
                        </div>

                        <div className="sm:col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleRemoveMaterialLine(index)}
                            className="text-[#64748B] hover:text-rose-500 hover:bg-rose-50 rounded-lg p-1.5 transition-colors"
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

            {/* SECTION 2: PACKAGING USED */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#F4B266]" />
                  <h3 className="text-sm font-semibold text-[#2D3134]">
                    Packaging Used
                  </h3>
                  <span className="text-xs font-medium text-[#64748B]">
                    {formatCurrency(liveSummary.total_packaging_cost)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleAddPackagingLine}
                  disabled={packagingCatalog.length === 0}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-[#F8F9FA] hover:border-[#2A8C82]/40 disabled:opacity-40 text-[#2D3134] text-xs font-medium transition-all"
                >
                  <Plus className="w-3.5 h-3.5 text-[#2A8C82]" />
                  <span>Add Packaging</span>
                </button>
              </div>

              {packagingLines.length === 0 ? (
                <div className="py-5 text-center text-xs text-[#64748B] font-normal bg-[#F8F9FA] rounded-2xl border border-dashed border-slate-200">
                  No packaging items added yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {packagingLines.map((line, index) => {
                    const pkg = packagingCatalog.find(
                      (p) => p.id === line.packaging_id
                    );
                    const qty = parseFloat(line.qty_used) || 0;
                    const lineCost = pkg ? qty * pkg.unit_cost : 0;

                    return (
                      <div
                        key={`${line.packaging_id}-${index}`}
                        className="py-3 grid grid-cols-1 sm:grid-cols-12 items-center gap-2.5"
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
                            className="w-full px-3 py-2.5 bg-white border border-slate-200 focus:border-[#2A8C82] focus:ring-1 focus:ring-[#2A8C82] outline-none rounded-xl text-xs font-medium text-[#2D3134] transition-all"
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
                            className="w-full px-3 py-2.5 bg-white border border-slate-200 focus:border-[#2A8C82] focus:ring-1 focus:ring-[#2A8C82] outline-none rounded-xl text-xs font-medium text-[#2D3134] placeholder:text-[#64748B] text-right transition-all"
                          />
                          <span className="text-[11px] font-normal text-[#64748B] shrink-0">
                            {pkg?.purchase_unit || 'un'}
                          </span>
                        </div>

                        <div className="sm:col-span-2 text-right">
                          <span className="text-xs font-semibold text-[#2D3134]">
                            {formatCurrency(lineCost, true)}
                          </span>
                        </div>

                        <div className="sm:col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleRemovePackagingLine(index)}
                            className="text-[#64748B] hover:text-rose-500 hover:bg-rose-50 rounded-lg p-1.5 transition-colors"
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

            {/* SECTION 3: LABOR TIME */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#2A8C82]" />
                  <h3 className="text-sm font-semibold text-[#2D3134]">
                    Labor Time
                  </h3>
                  <span className="text-xs font-medium text-[#64748B]">
                    {formatCurrency(liveSummary.total_labor_cost)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleAddLaborLine}
                  disabled={laborCatalog.length === 0}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-[#F8F9FA] hover:border-[#2A8C82]/40 disabled:opacity-40 text-[#2D3134] text-xs font-medium transition-all"
                >
                  <Plus className="w-3.5 h-3.5 text-[#2A8C82]" />
                  <span>Add Labor Time</span>
                </button>
              </div>

              {laborLines.length === 0 ? (
                <div className="py-5 text-center text-xs text-[#64748B] font-normal bg-[#F8F9FA] rounded-2xl border border-dashed border-slate-200">
                  No labor steps added yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {laborLines.map((line, index) => {
                    const lab = laborCatalog.find((l) => l.id === line.labor_id);
                    const mins = parseFloat(line.minutes_spent) || 0;
                    const lineCost = lab ? (mins / 60) * lab.hourly_rate : 0;

                    return (
                      <div
                        key={`${line.labor_id}-${index}`}
                        className="py-3 grid grid-cols-1 sm:grid-cols-12 items-center gap-2.5"
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
                            className="w-full px-3 py-2.5 bg-white border border-slate-200 focus:border-[#2A8C82] focus:ring-1 focus:ring-[#2A8C82] outline-none rounded-xl text-xs font-medium text-[#2D3134] transition-all"
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
                            className="w-full px-3 py-2.5 bg-white border border-slate-200 focus:border-[#2A8C82] focus:ring-1 focus:ring-[#2A8C82] outline-none rounded-xl text-xs font-medium text-[#2D3134] placeholder:text-[#64748B] text-right transition-all"
                          />
                          <span className="text-[11px] font-normal text-[#64748B] shrink-0">
                            min
                          </span>
                        </div>

                        <div className="sm:col-span-2 text-right">
                          <span className="text-xs font-semibold text-[#2D3134]">
                            {formatCurrency(lineCost)}
                          </span>
                        </div>

                        <div className="sm:col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleRemoveLaborLine(index)}
                            className="text-[#64748B] hover:text-rose-500 hover:bg-rose-50 rounded-lg p-1.5 transition-colors"
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

          {/* RIGHT COLUMN: PRICING PIPELINE & TARGET PRICE SUMMARY CARD (6 cols) */}
          <div className="lg:col-span-6">
            <div className="bg-[#F8F9FA] rounded-2xl p-5 sm:p-6 border border-slate-200 space-y-5">
              {/* Active Rule Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#2A8C82]" />
                  <span className="text-sm font-semibold text-[#2D3134]">
                    Pricing Rule
                  </span>
                </div>

                <select
                  value={activeRule?.id || ''}
                  onChange={(e) => {
                    setSelectedRuleId(e.target.value);
                    setCustomTargetMarginPercent(null);
                  }}
                  className="px-3.5 py-2 bg-white border border-slate-200 focus:border-[#2A8C82] focus:ring-1 focus:ring-[#2A8C82] outline-none rounded-xl text-xs font-medium text-[#2D3134] shadow-xs transition-all"
                >
                  {pricingRules.map((rule) => (
                    <option key={rule.id} value={rule.id}>
                      {rule.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Read-Only Informative Price Steps Pipeline */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-normal text-[#64748B]">
                    Pricing Pipeline (Price Steps)
                  </span>
                  {onManageRules && (
                    <button
                      type="button"
                      onClick={() =>
                        attemptActionWithGuard(() => {
                          onClose();
                          onManageRules();
                        })
                      }
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#2A8C82] hover:text-[#23736B] transition-colors"
                    >
                      <span>Manage rules in Pricing Rules tab</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Visual Formula Breadcrumb */}
                {effectiveBlocks.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {effectiveBlocks.map((block, idx) => {
                      const isMarkupBlock =
                        block.type === 'PERCENT_MODIFIER' && !isFeeBlock(block);
                      return (
                        <React.Fragment key={block.id}>
                          <span
                            className={
                              isMarkupBlock
                                ? 'bg-[#E78358]/10 border border-[#E78358]/30 text-[#E78358] text-xs px-2.5 py-1 rounded-full font-medium'
                                : 'bg-[#F8F9FA] border border-slate-200 text-[#2D3134] text-xs px-2.5 py-1 rounded-full font-medium'
                            }
                          >
                            {formatBlockPillLabel(block)}
                          </span>
                          {idx < effectiveBlocks.length - 1 && (
                            <span className="text-[#64748B] font-normal text-xs px-0.5">
                              +
                            </span>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                )}

                {/* Read-Only Step Breakdown */}
                <div className="divide-y divide-slate-200 pt-1">
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
                          <span className="w-4 h-4 rounded-full bg-[#F8F9FA] border border-slate-200 text-[#64748B] text-[10px] font-medium flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-[#2D3134] font-normal truncate">
                            {step.block.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span
                            className={`font-medium ${
                              isDiscount
                                ? 'text-rose-600'
                                : isBase
                                ? 'text-[#64748B]'
                                : 'text-[#E78358]'
                            }`}
                          >
                            {step.deltaAmount >= 0 ? '+' : ''}
                            {formatCurrency(step.deltaAmount)}
                          </span>
                          <span className="text-[11px] font-normal text-[#64748B] w-16 text-right">
                            {formatCurrency(step.runningSubtotal)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* INTERACTIVE TARGET PROFIT MARGIN SLIDER (10% - 80%) */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <label
                      htmlFor="product-target-margin-slider"
                      className="text-xs font-semibold text-[#2D3134] block"
                    >
                      Target Profit Margin
                    </label>
                    <span className="text-[11px] font-normal text-[#64748B]">
                      Dynamically adjusts Markup % to achieve your target net
                      margin
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {customTargetMarginPercent !== null && (
                      <button
                        type="button"
                        onClick={() => setCustomTargetMarginPercent(null)}
                        className="text-[11px] font-medium text-[#64748B] hover:text-[#2D3134] underline"
                      >
                        Reset to rule
                      </button>
                    )}
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#E78358]/10 text-[#E78358] border border-[#E78358]/30 text-xs font-semibold">
                      {sliderMarginValue}% Net Margin
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-medium text-[#64748B] w-8">
                    10%
                  </span>
                  <input
                    id="product-target-margin-slider"
                    type="range"
                    min={10}
                    max={80}
                    step={1}
                    value={sliderMarginValue}
                    onChange={(e) =>
                      setCustomTargetMarginPercent(
                        parseInt(e.target.value, 10)
                      )
                    }
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#2A8C82]"
                  />
                  <span className="text-[11px] font-medium text-[#64748B] w-8 text-right">
                    80%
                  </span>
                </div>
              </div>

              {/* TARGET PRICE & GROSS-UP MARKETPLACE FEE SUMMARY CARD */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200 space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#64748B]">
                      <Sparkles className="w-3.5 h-3.5 text-[#F4B266]" />
                      <span>
                        Suggested Retail Price ({activeRule?.name})
                      </span>
                    </span>
                    <div className="text-3xl sm:text-4xl font-bold text-[#2A8C82] tracking-tight mt-1">
                      {formatCurrency(pipelineEvaluation.suggestedRetailPrice)}
                    </div>
                    {pipelineEvaluation.percentageFeesRate > 0 && (
                      <span className="block text-[11px] font-normal text-[#64748B] mt-1">
                        Gross-up: Subtotal{' '}
                        {formatCurrency(
                          pipelineEvaluation.subtotalBeforePercentFees
                        )}{' '}
                        ÷ (1 −{' '}
                        {(pipelineEvaluation.percentageFeesRate * 100).toFixed(
                          1
                        )}
                        %)
                      </span>
                    )}
                  </div>

                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#E78358]/10 text-[#E78358] border border-[#E78358]/30 text-xs font-semibold shrink-0">
                    {pipelineEvaluation.netMarginPercent.toFixed(1)}% margin
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-200 text-xs">
                  <div>
                    <span className="text-[#64748B] font-normal block">
                      Direct Costs
                    </span>
                    <span className="text-sm font-semibold text-[#2D3134] mt-0.5 block">
                      {formatCurrency(pipelineEvaluation.directCostsTotal)}
                    </span>
                    {pipelineEvaluation.extraCostsTotal > 0 && (
                      <span className="text-[10px] font-normal text-[#64748B] block">
                        +{formatCurrency(pipelineEvaluation.extraCostsTotal)}{' '}
                        Extra $
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-[#64748B] font-normal block">
                      Marketplace Fees
                    </span>
                    <span className="text-sm font-semibold text-[#2A8C82] mt-0.5 block">
                      -{formatCurrency(pipelineEvaluation.platformFeesTotal)}
                    </span>
                    <span className="text-[10px] font-normal text-[#64748B] block">
                      {formatCurrency(pipelineEvaluation.percentageFeesTotal)} (
                      {(pipelineEvaluation.percentageFeesRate * 100).toFixed(1)}
                      %) + {formatCurrency(pipelineEvaluation.fixedFeesTotal)}{' '}
                      fixed
                    </span>
                  </div>

                  <div>
                    <span className="text-[#64748B] font-normal block">
                      Net Revenue
                    </span>
                    <span className="text-sm font-semibold text-[#2D3134] mt-0.5 block">
                      {formatCurrency(pipelineEvaluation.netRevenue)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[#64748B] font-normal block">
                      Net Profit
                    </span>
                    <span className="text-sm font-semibold text-[#E78358] mt-0.5 block">
                      {formatCurrency(pipelineEvaluation.netProfit)}{' '}
                      <span className="text-[11px] font-normal text-[#64748B]">
                        ({pipelineEvaluation.netMarginPercent.toFixed(1)}%)
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Lightweight Batch / Tier Table */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-2">
                <span className="text-xs font-medium text-[#2D3134] block px-1">
                  Quantity Discounts &amp; Batch Margins
                </span>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-[#64748B] font-normal">
                        <th className="py-2 px-2.5 font-normal">Quantity</th>
                        <th className="py-2 px-2.5 font-normal">Unit Price</th>
                        <th className="py-2 px-2.5 font-normal">Total</th>
                        <th className="py-2 px-2.5 font-normal text-right">
                          Profit
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {batchTiers.map((tier) => (
                        <tr key={tier.qty}>
                          <td className="py-2 px-2.5 font-medium text-[#2D3134]">
                            {tier.label}
                          </td>
                          <td className="py-2 px-2.5 font-medium text-[#2D3134]">
                            {formatCurrency(tier.unitPrice)}
                          </td>
                          <td className="py-2 px-2.5 font-normal text-[#64748B]">
                            {formatCurrency(tier.totalRevenue)}
                          </td>
                          <td className="py-2 px-2.5 text-right font-medium text-[#2A8C82]">
                            {formatCurrency(tier.totalProfit)}{' '}
                            <span className="text-[11px] font-normal text-[#64748B]">
                              ({tier.marginPercent.toFixed(0)}%)
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Action Footer — Always Pinned & Visible */}
        <div className="sticky bottom-0 z-20 bg-white/95 backdrop-blur-md border-t border-slate-200 px-6 sm:px-10 py-4 rounded-b-2xl flex items-center justify-between gap-4">
          <span className="text-xs font-normal text-[#64748B]">
            {isDirty ? (
              <span className="inline-flex items-center gap-1.5 text-[#E78358] font-medium">
                <span className="w-2 h-2 rounded-full bg-[#E78358]" />
                <span>Unsaved changes</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#F4B266]" />
                <span>Recipe ready</span>
              </span>
            )}
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleRequestClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-[#F8F9FA] text-xs sm:text-sm font-medium text-[#64748B] hover:text-[#2D3134] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 bg-[#2A8C82] hover:bg-[#23736B] text-white font-semibold text-xs sm:text-sm px-6 py-2.5 rounded-xl shadow-sm transition-all"
            >
              <Check className="w-4 h-4 text-[#F4B266]" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </form>

      {/* Unsaved Changes Confirmation Dialog */}
      {showDiscardConfirm && (
        <div
          role="alertdialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D3134]/30 backdrop-blur-sm animate-fadeIn"
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg max-w-md w-full p-6 space-y-5">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#E78358]/10 border border-[#E78358]/30 text-[#E78358] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-[#2D3134]">
                  Discard unsaved changes? Any edits will be lost.
                </h3>
                <p className="text-xs font-normal text-[#64748B] leading-relaxed">
                  You have uncommitted changes in this recipe. If you leave now, your edits will not be saved.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setShowDiscardConfirm(false);
                  setPendingAction(null);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-[#F8F9FA] text-xs font-medium text-[#2D3134] transition-colors"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDiscardConfirm(false);
                  onDirtyChange?.(false);
                  if (pendingAction) {
                    pendingAction();
                  } else {
                    onClose();
                  }
                }}
                className="px-4 py-2 rounded-xl bg-[#E78358] hover:bg-[#d67147] text-white text-xs font-semibold shadow-sm transition-colors"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
