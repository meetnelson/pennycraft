import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Copy,
  Trash2,
  Sparkles,
  Check,
  AlertTriangle,
  Info,
} from 'lucide-react';
import {
  PricingBlock,
  PricingRule,
  ProductItem,
} from '../types/pricing';
import {
  applyTargetMarginToBlocks,
  computeBatchTiers,
  evaluatePricingPipeline,
  formatBlockPillLabel,
  formatCurrency,
  generateId,
  isFeeBlock,
} from '../utils/calculations';
import { RulePipelineStack } from './RulePipelineStack';

interface PricingRulesViewProps {
  rules: PricingRule[];
  products: ProductItem[];
  onDirtyChange?: (isDirty: boolean) => void;
  onAddRule: (data: {
    name: string;
    description?: string;
    blocks: PricingBlock[];
  }) => PricingRule;
  onUpdateRule: (
    id: string,
    data: { name?: string; description?: string; blocks?: PricingBlock[] }
  ) => void;
  onDuplicateRule: (id: string) => PricingRule | null;
  onDeleteRule: (id: string) => void;
}

export const PricingRulesView: React.FC<PricingRulesViewProps> = ({
  rules,
  products,
  onDirtyChange,
  onAddRule,
  onUpdateRule,
  onDuplicateRule,
  onDeleteRule,
}) => {
  const [selectedRuleId, setSelectedRuleId] = useState<string>(
    rules[0]?.id || ''
  );
  const [previewProductId, setPreviewProductId] = useState<string>(
    products[0]?.id || ''
  );

  const activeRule = useMemo(
    () => rules.find((r) => r.id === selectedRuleId) || rules[0],
    [rules, selectedRuleId]
  );

  const [draftName, setDraftName] = useState<string>(activeRule?.name || '');
  const [draftDescription, setDraftDescription] = useState<string>(
    activeRule?.description || ''
  );
  const [draftBlocks, setDraftBlocks] = useState<PricingBlock[]>(
    activeRule?.blocks || []
  );
  const [selectedSliderMargin, setSelectedSliderMargin] = useState<number | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Sync draft state when activeRule changes
  useEffect(() => {
    if (!activeRule) return;
    setDraftName(activeRule.name);
    setDraftDescription(activeRule.description || '');
    setDraftBlocks(activeRule.blocks);
    setSelectedSliderMargin(null);
  }, [activeRule?.id, activeRule?.updated_at]);

  const isDirty = useMemo(() => {
    if (!activeRule) return false;
    if (draftName !== activeRule.name) return true;
    if (draftDescription !== (activeRule.description || '')) return true;
    if (JSON.stringify(draftBlocks) !== JSON.stringify(activeRule.blocks)) {
      return true;
    }
    return false;
  }, [activeRule, draftName, draftDescription, draftBlocks]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
    return () => {
      onDirtyChange?.(false);
    };
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const attemptActionWithGuard = (action: () => void) => {
    if (isDirty) {
      setPendingAction(() => action);
      setShowDiscardConfirm(true);
    } else {
      action();
    }
  };

  const handleSaveChanges = () => {
    if (!activeRule) return;
    onUpdateRule(activeRule.id, {
      name: draftName.trim() || 'Custom Pricing Rule',
      description: draftDescription.trim(),
      blocks: draftBlocks,
    });
    onDirtyChange?.(false);
  };

  const handleCancelChanges = () => {
    if (!activeRule) return;
    setDraftName(activeRule.name);
    setDraftDescription(activeRule.description || '');
    setDraftBlocks(activeRule.blocks);
    setSelectedSliderMargin(null);
    onDirtyChange?.(false);
  };

  const previewProduct = useMemo(
    () => products.find((p) => p.id === previewProductId) || products[0],
    [products, previewProductId]
  );

  const sampleCosts = useMemo(() => {
    if (previewProduct) {
      return {
        materialsCost: previewProduct.total_materials_cost,
        laborCost: previewProduct.total_labor_cost,
        packagingCost: previewProduct.total_packaging_cost,
      };
    }
    return {
      materialsCost: 12.0,
      laborCost: 15.0,
      packagingCost: 1.5,
    };
  }, [previewProduct]);

  const evalResult = useMemo(() => {
    if (!activeRule) {
      return evaluatePricingPipeline([], sampleCosts);
    }
    return evaluatePricingPipeline(draftBlocks, sampleCosts);
  }, [activeRule, draftBlocks, sampleCosts]);

  const batchTiers = useMemo(() => computeBatchTiers(evalResult), [evalResult]);

  const currentClampedMargin = useMemo(() => {
    if (selectedSliderMargin !== null) {
      return selectedSliderMargin;
    }
    const autoMarkupBlock = draftBlocks.find(
      (b) =>
        b.type === 'PERCENT_MODIFIER' &&
        !isFeeBlock(b) &&
        typeof b.auto_target_margin === 'number'
    );
    if (autoMarkupBlock && typeof autoMarkupBlock.auto_target_margin === 'number') {
      return Math.min(80, Math.max(10, Math.round(autoMarkupBlock.auto_target_margin)));
    }
    const rounded = Math.round(evalResult.netMarginPercent);
    return Math.min(80, Math.max(10, isFinite(rounded) ? rounded : 30));
  }, [selectedSliderMargin, draftBlocks, evalResult.netMarginPercent]);

  const isTargetMarginUnachievable = useMemo(() => {
    if (evalResult.isMarginUnachievable) return true;
    if (
      selectedSliderMargin !== null &&
      evalResult.percentageFeesRate + selectedSliderMargin / 100 >= 1.0
    ) {
      return true;
    }
    return false;
  }, [evalResult.isMarginUnachievable, evalResult.percentageFeesRate, selectedSliderMargin]);

  const hasAutoTargetMargin = useMemo(
    () =>
      selectedSliderMargin !== null ||
      draftBlocks.some(
        (b) =>
          b.type === 'PERCENT_MODIFIER' &&
          !isFeeBlock(b) &&
          typeof b.auto_target_margin === 'number'
      ),
    [selectedSliderMargin, draftBlocks]
  );

  const handleTargetMarginSliderChange = (nextMarginPct: number) => {
    setSelectedSliderMargin(nextMarginPct);
    const updatedBlocks = applyTargetMarginToBlocks(
      draftBlocks,
      sampleCosts,
      nextMarginPct
    );
    setDraftBlocks(updatedBlocks);
  };

  const handleCreateNewRule = () => {
    attemptActionWithGuard(() => {
      const created = onAddRule({
        name: 'Boutique Retail',
        description: '',
        blocks: [
          { id: generateId('blk'), type: 'BASE_MATERIALS', label: 'Materials Cost' },
          { id: generateId('blk'), type: 'BASE_LABOR', label: 'Labor Cost' },
          { id: generateId('blk'), type: 'BASE_PACKAGING', label: 'Packaging Cost' },
          {
            id: generateId('blk'),
            type: 'PERCENT_MODIFIER',
            label: 'Profit Markup',
            value: 60,
            target: 'RUNNING_SUBTOTAL',
            role: 'MARKUP',
          },
        ],
      });
      setSelectedRuleId(created.id);
    });
  };

  if (!activeRule) return null;

  return (
    <section className="space-y-8">
      {/* Simplified Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 px-1">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#2D3134] tracking-tight">
              Pricing Rules
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-xs font-normal text-[#64748B] shadow-xs">
              {rules.length} {rules.length === 1 ? 'Rule' : 'Rules'}
            </span>
          </div>
          <p className="text-sm font-normal text-[#64748B] mt-1">
            How you calculate your selling prices
          </p>
        </div>

        <button
          type="button"
          onClick={handleCreateNewRule}
          className="inline-flex items-center gap-1.5 bg-[#2A8C82] hover:bg-[#23736B] text-white font-medium text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 text-[#F4B266]" />
          <span>New Rule</span>
        </button>
      </div>

      {/* Main Split Grid with Balanced Equal Heights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Sidebar: Preview Product Selector at Top & Rule List (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex-1 flex flex-col justify-start space-y-5">
            {/* Simulating With Product Selector pinned at the TOP of the sidebar */}
            {products.length > 0 && (
              <div className="pb-5 border-b border-slate-200 space-y-2">
                <label className="block text-xs font-medium text-[#64748B]">
                  Simulating with:
                </label>
                <select
                  value={previewProduct?.id || ''}
                  onChange={(e) => setPreviewProductId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-[#2A8C82] focus:ring-1 focus:ring-[#2A8C82] outline-none rounded-2xl text-xs font-medium text-[#2D3134] transition-all"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({formatCurrency(p.base_production_cost)} cost)
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="divide-y divide-slate-200">
              {rules.map((rule) => {
                const isSelected = rule.id === activeRule.id;
                const previewEval = evaluatePricingPipeline(
                  isSelected ? draftBlocks : rule.blocks,
                  sampleCosts
                );

                return (
                  <div
                    key={rule.id}
                    onClick={() => {
                      if (rule.id === activeRule.id) return;
                      attemptActionWithGuard(() => setSelectedRuleId(rule.id));
                    }}
                    className={`group py-3.5 px-3.5 first:pt-2.5 last:pb-2.5 rounded-2xl cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#2A8C82]/10 text-[#2D3134]'
                        : 'hover:bg-[#F8F9FA] text-[#2D3134]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3
                          className={`text-sm font-medium leading-snug truncate ${
                            isSelected ? 'text-[#2A8C82] font-semibold' : 'text-[#2D3134]'
                          }`}
                        >
                          {isSelected ? draftName || rule.name : rule.name}
                        </h3>
                        {(isSelected ? draftDescription : rule.description) ? (
                          <p className="text-xs font-normal text-[#64748B] mt-0.5 line-clamp-2">
                            {isSelected ? draftDescription : rule.description}
                          </p>
                        ) : (
                          <p className="text-xs font-normal text-[#64748B] mt-0.5 truncate">
                            {(isSelected ? draftBlocks : rule.blocks)
                              .map(formatBlockPillLabel)
                              .join(' + ')}
                          </p>
                        )}
                      </div>

                      <span className="text-xs font-semibold shrink-0 px-2.5 py-0.5 rounded-full bg-[#E78358]/10 border border-[#E78358]/30 text-[#E78358]">
                        {formatCurrency(previewEval.suggestedRetailPrice)}
                      </span>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#64748B]">
                      <span>
                        {(isSelected ? draftBlocks : rule.blocks).length} steps
                      </span>

                      <div
                        className="flex items-center gap-0.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            attemptActionWithGuard(() => {
                              const copy = onDuplicateRule(rule.id);
                              if (copy) setSelectedRuleId(copy.id);
                            });
                          }}
                          title="Duplicate Rule"
                          className="text-[#64748B] hover:text-[#2D3134] hover:bg-white rounded-lg p-1 transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        {rules.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteRule(rule.id);
                            }}
                            title="Delete Rule"
                            className="text-[#64748B] hover:text-rose-500 hover:bg-rose-50 rounded-lg p-1 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Area: Active Rule Builder Card (8 cols) */}
        <div className="lg:col-span-8 flex flex-col">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col justify-between overflow-visible">
            <div className="p-6 space-y-6">
              {/* Rule Name, Free-Form Personal Notes & Auto-Generated Visual Formula Pipeline */}
              <div className="space-y-4 pb-6 border-b border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#2D3134] mb-1.5">
                      Rule Name
                    </label>
                    <input
                      type="text"
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      placeholder="e.g., Etsy Online Store"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-[#2A8C82] focus:ring-1 focus:ring-[#2A8C82] outline-none rounded-2xl text-sm font-medium text-[#2D3134] placeholder:text-[#64748B] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#2D3134] mb-1.5">
                      Notes
                    </label>
                    <input
                      type="text"
                      value={draftDescription}
                      onChange={(e) => setDraftDescription(e.target.value)}
                      placeholder="e.g., Use this for custom holiday orders..."
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-[#2A8C82] focus:ring-1 focus:ring-[#2A8C82] outline-none rounded-2xl text-xs font-normal text-[#2D3134] placeholder:text-[#64748B] transition-all"
                    />
                  </div>
                </div>

                {/* Auto-Generated Visual Pricing Formula (Breadcrumb Display) */}
                <div className="pt-1">
                  <span className="block text-[11px] font-normal text-[#64748B] mb-2">
                    Pricing Formula
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {draftBlocks.map((block, idx) => {
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
                          {idx < draftBlocks.length - 1 && (
                            <span className="text-[#64748B] font-normal text-xs px-0.5">
                              +
                            </span>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Interactive Price Breakdown */}
              <div>
                <div className="mb-3">
                  <h3 className="text-sm font-medium text-[#2D3134]">
                    Price Breakdown
                  </h3>
                  <p className="text-xs font-normal text-[#64748B]">
                    Configure your production cost steps, profit markup, and selling fees in order.
                  </p>
                </div>

                <RulePipelineStack
                  steps={evalResult.steps}
                  onChangeBlocks={(nextBlocks) => {
                    setSelectedSliderMargin(null);
                    setDraftBlocks(nextBlocks);
                  }}
                />
              </div>

              <div className="space-y-6 pt-4 border-t border-slate-200">
                {/* Interactive Target Net Margin Slider (10% - 80%) */}
                <div className="bg-[#F8F9FA] rounded-2xl p-5 border border-slate-200 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="inline-flex items-center gap-1.5">
                        <label
                          htmlFor="rule-target-margin-slider"
                          className="text-xs font-semibold text-[#2D3134]"
                        >
                          Target Net Margin
                        </label>
                        <span
                          className="relative group/tooltip inline-flex items-center cursor-help text-[#64748B] hover:text-[#2D3134]"
                          tabIndex={0}
                          aria-label="The percentage of the final selling price you want to retain as profit after production costs and applicable selling fees."
                        >
                          <Info className="w-3.5 h-3.5" />
                          <span
                            role="tooltip"
                            className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-60 p-2 rounded-xl bg-[#2D3134] text-white text-[11px] font-normal leading-snug shadow-md opacity-0 group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100 transition-opacity z-30"
                          >
                            The percentage of the final selling price you want to retain as profit after production costs and applicable selling fees.
                          </span>
                        </span>
                      </div>
                      <span className="text-[11px] font-normal text-[#64748B] block">
                        Slide (10%–80%) to dynamically adjust Markup % for your
                        desired net margin
                      </span>
                    </div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#E78358]/10 border border-[#E78358]/30 text-[#E78358] text-xs font-semibold">
                      Target: {currentClampedMargin}% Net Margin
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-medium text-[#64748B] w-8">
                      10%
                    </span>
                    <input
                      id="rule-target-margin-slider"
                      type="range"
                      min={10}
                      max={80}
                      step={1}
                      value={currentClampedMargin}
                      onChange={(e) =>
                        handleTargetMarginSliderChange(
                          parseInt(e.target.value, 10)
                        )
                      }
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#2A8C82]"
                    />
                    <span className="text-[11px] font-medium text-[#64748B] w-8 text-right">
                      80%
                    </span>
                  </div>

                  {hasAutoTargetMargin && !isTargetMarginUnachievable && (
                    <p className="text-[11px] font-normal text-[#2A8C82]">
                      Automatically calculated to achieve your target net margin.
                    </p>
                  )}

                  {isTargetMarginUnachievable && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                      <span>
                        The selected net margin is mathematically unachievable with current fees.
                      </span>
                    </div>
                  )}
                </div>

                {/* Suggested Selling Price & Gross-Up Marketplace Fee Breakdown Card */}
                <div className="bg-[#F8F9FA] rounded-2xl p-6 border border-slate-200 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="inline-flex items-center gap-1.5 text-xs font-normal text-[#64748B]">
                        <Sparkles className="w-3.5 h-3.5 text-[#F4B266]" />
                        <span>
                          Suggested Selling Price (
                          {previewProduct?.name || 'Sample'})
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="text-3xl sm:text-4xl font-semibold text-[#2A8C82] tracking-tight">
                          {formatCurrency(evalResult.suggestedRetailPrice)}
                        </div>
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#E78358]/10 border border-[#E78358]/30 text-[#E78358] text-xs font-semibold">
                          {evalResult.netMarginPercent.toFixed(1)}% Net Margin
                        </span>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-[11px] font-normal text-[#64748B] block">
                        Price Before Marketplace Fees
                      </span>
                      <span className="text-sm font-semibold text-[#2D3134]">
                        {formatCurrency(evalResult.subtotalBeforePercentFees)}
                      </span>
                      {evalResult.percentageFeesRate > 0 && (
                        <span className="block text-[11px] font-normal text-[#2A8C82]">
                          Gross-up: {formatCurrency(evalResult.subtotalBeforePercentFees)} ÷ (1 −{' '}
                          {(evalResult.percentageFeesRate * 100).toFixed(1)}%)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Exact 4-Column Financial Breakdown */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-200">
                    <div>
                      <span className="block text-[11px] font-normal text-[#64748B]">
                        Production Costs
                      </span>
                      <span className="text-sm font-semibold text-[#2D3134] mt-0.5 block">
                        {formatCurrency(evalResult.directCostsTotal)}
                      </span>
                      {evalResult.extraCostsTotal > 0 && (
                        <span className="block text-[10px] font-normal text-[#64748B]">
                          Includes {formatCurrency(evalResult.extraCostsTotal)}{' '}
                          Extra $
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="block text-[11px] font-normal text-[#64748B]">
                        Estimated Selling Fees
                      </span>
                      <span className="text-sm font-semibold text-[#2A8C82] mt-0.5 block">
                        -{formatCurrency(evalResult.platformFeesTotal)}
                      </span>
                      <span className="block text-[10px] font-normal text-[#64748B]">
                        {formatCurrency(evalResult.percentageFeesTotal)} (
                        {(evalResult.percentageFeesRate * 100).toFixed(1)}%) +{' '}
                        {formatCurrency(evalResult.fixedFeesTotal)} fixed
                      </span>
                    </div>

                    <div>
                      <span className="block text-[11px] font-normal text-[#64748B]">
                        Revenue After Fees
                      </span>
                      <span className="text-sm font-semibold text-[#2D3134] mt-0.5 block">
                        {formatCurrency(evalResult.netRevenue)}
                      </span>
                      <span className="block text-[10px] font-normal text-[#64748B]">
                        Selling Price − Estimated Selling Fees
                      </span>
                    </div>

                    <div>
                      <span className="block text-[11px] font-normal text-[#64748B]">
                        Estimated Profit &amp; Margin
                      </span>
                      <span className="text-sm font-semibold text-[#E78358] mt-0.5 block">
                        {formatCurrency(evalResult.netProfit)}{' '}
                        <span className="text-xs font-normal text-[#64748B]">
                          ({evalResult.netMarginPercent.toFixed(1)}%)
                        </span>
                      </span>
                      <span className="block text-[10px] font-normal text-[#64748B]">
                        Revenue After Fees − Production Costs
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bulk Pricing & Profit Estimates Table */}
                <div>
                  <h4 className="text-xs font-medium text-[#2D3134] mb-2">
                    Bulk Pricing &amp; Profit Estimates
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-[#64748B] font-normal">
                          <th className="py-2 px-3 font-normal">Quantity</th>
                          <th className="py-2 px-3 font-normal">Discount</th>
                          <th className="py-2 px-3 font-normal">Unit Price</th>
                          <th className="py-2 px-3 font-normal">Order Total</th>
                          <th className="py-2 px-3 font-normal text-right">
                            Estimated Profit
                          </th>
                          <th className="py-2 px-3 font-normal text-right">
                            Profit Margin %
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {batchTiers.map((tier) => (
                          <tr key={tier.qty}>
                            <td className="py-2.5 px-3 font-medium text-[#2D3134]">
                              {tier.qty} {tier.qty === 1 ? 'unit' : 'units'}
                            </td>
                            <td className="py-2.5 px-3 font-normal text-[#64748B]">
                              {tier.discountPercent > 0
                                ? `-${tier.discountPercent}%`
                                : '0%'}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-[#2D3134]">
                              {formatCurrency(tier.unitPrice)}
                            </td>
                            <td className="py-2.5 px-3 font-normal text-[#64748B]">
                              {formatCurrency(tier.totalRevenue)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-medium text-[#2A8C82]">
                              {formatCurrency(tier.totalProfit)}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <span className="inline-flex items-center justify-end gap-1.5">
                                <span
                                  className={`font-medium ${
                                    tier.warningState === 'NEGATIVE'
                                      ? 'text-rose-600'
                                      : tier.warningState === 'LOW_MARGIN'
                                      ? 'text-amber-700'
                                      : 'text-[#64748B]'
                                  }`}
                                >
                                  {tier.marginPercent.toFixed(1)}%
                                </span>
                                {tier.warningState && (
                                  <span
                                    title={
                                      tier.warningState === 'NEGATIVE'
                                        ? 'Bulk discount reduces net profit below 0'
                                        : 'Bulk discount reduces net margin below 10%'
                                    }
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-medium"
                                  >
                                    <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                                    <span>
                                      {tier.warningState === 'NEGATIVE'
                                        ? 'Loss'
                                        : 'Low (<10%)'}
                                    </span>
                                  </span>
                                )}
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

            {/* Sticky Explicit Save & Cancel Action Footer */}
            <div className="sticky bottom-0 z-20 bg-white/95 backdrop-blur-md border-t border-slate-200 px-6 py-4 rounded-b-2xl flex items-center justify-between gap-4">
              <span className="text-xs font-normal text-[#64748B]">
                {isDirty ? (
                  <span className="inline-flex items-center gap-1.5 text-[#E78358] font-medium">
                    <span className="w-2 h-2 rounded-full bg-[#E78358]" />
                    <span>Unsaved changes</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#F4B266]" />
                    <span>Rule synced</span>
                  </span>
                )}
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCancelChanges}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-[#F8F9FA] text-xs sm:text-sm font-medium text-[#64748B] hover:text-[#2D3134] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveChanges}
                  className="inline-flex items-center gap-1.5 bg-[#2A8C82] hover:bg-[#23736B] text-white font-semibold text-xs sm:text-sm px-6 py-2.5 rounded-xl shadow-sm transition-all"
                >
                  <Check className="w-4 h-4 text-[#F4B266]" />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

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
                  You have uncommitted changes in this pricing rule. If you leave now, your edits will not be saved.
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
                  handleCancelChanges();
                  if (pendingAction) {
                    pendingAction();
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
    </section>
  );
};
