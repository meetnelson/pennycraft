import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Copy,
  Trash2,
  Sparkles,
  Check,
  AlertTriangle,
} from 'lucide-react';
import {
  PricingBlock,
  PricingRule,
  ProductItem,
} from '../types/pricing';
import {
  computeBatchTiers,
  evaluatePricingPipeline,
  formatCurrency,
  generateId,
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
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Sync draft state when activeRule changes
  useEffect(() => {
    if (!activeRule) return;
    setDraftName(activeRule.name);
    setDraftDescription(activeRule.description || '');
    setDraftBlocks(activeRule.blocks);
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
            label: 'Boutique Margin',
            value: 60,
            target: 'RUNNING_SUBTOTAL',
            role: 'MARGIN',
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

                {/* Auto-Generated Visual Formula Pipeline (Breadcrumb Display) */}
                <div className="pt-1">
                  <span className="block text-[11px] font-normal text-[#64748B] mb-2">
                    Formula Pipeline
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {draftBlocks.map((block, idx) => {
                      const isMarginBlock =
                        block.type === 'PERCENT_MODIFIER' &&
                        block.role !== 'FEE' &&
                        !block.label.toLowerCase().includes('fee') &&
                        !block.label.toLowerCase().includes('commission');
                      return (
                        <React.Fragment key={block.id}>
                          <span
                            className={
                              isMarginBlock
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

              {/* Interactive Price Steps */}
              <div>
                <div className="mb-3">
                  <h3 className="text-sm font-medium text-[#2D3134]">
                    Price Steps
                  </h3>
                  <p className="text-xs font-normal text-[#64748B]">
                    Calculated from top to bottom
                  </p>
                </div>

                <RulePipelineStack
                  steps={evalResult.steps}
                  onChangeBlocks={(nextBlocks) => setDraftBlocks(nextBlocks)}
                />
              </div>

              <div className="space-y-6 pt-4 border-t border-slate-200">
                {/* Target Price Hero Card */}
                <div className="bg-[#F8F9FA] rounded-2xl p-6 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 text-xs font-normal text-[#64748B]">
                      <Sparkles className="w-3.5 h-3.5 text-[#F4B266]" />
                      <span>
                        Suggested Price ({previewProduct?.name || 'Sample'})
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="text-3xl sm:text-4xl font-semibold text-[#2A8C82] tracking-tight">
                        {formatCurrency(evalResult.suggestedRetailPrice)}
                      </div>
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#E78358]/10 border border-[#E78358]/30 text-[#E78358] text-xs font-semibold">
                        +{evalResult.netMarginPercent.toFixed(0)}% margin
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                    <div>
                      <span className="block text-[11px] font-normal text-[#64748B]">
                        Cost to Make
                      </span>
                      <span className="text-sm font-semibold text-[#2D3134] mt-0.5 block">
                        {formatCurrency(evalResult.totalProductionCost)}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[11px] font-normal text-[#64748B]">
                        Net Profit
                      </span>
                      <span className="text-sm font-semibold text-[#E78358] mt-0.5 block">
                        {formatCurrency(evalResult.netProfit)}{' '}
                        <span className="text-xs font-normal text-[#64748B]">
                          ({evalResult.netMarginPercent.toFixed(0)}%)
                        </span>
                      </span>
                    </div>

                    <div>
                      <span className="block text-[11px] font-normal text-[#64748B]">
                        Fees
                      </span>
                      <span className="text-sm font-semibold text-[#2A8C82] mt-0.5 block">
                        {formatCurrency(evalResult.platformFeesTotal)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Lightweight Batch Discounts Table */}
                <div>
                  <h4 className="text-xs font-normal text-[#64748B] mb-2">
                    Quantity Estimates
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-[#64748B] font-normal">
                          <th className="py-2 px-3 font-normal">Quantity</th>
                          <th className="py-2 px-3 font-normal">Unit Price</th>
                          <th className="py-2 px-3 font-normal">Total</th>
                          <th className="py-2 px-3 font-normal text-right">
                            Profit
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {batchTiers.map((tier) => (
                          <tr key={tier.qty}>
                            <td className="py-2.5 px-3 font-medium text-[#2D3134]">
                              {tier.label}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-[#2D3134]">
                              {formatCurrency(tier.unitPrice)}
                            </td>
                            <td className="py-2.5 px-3 font-normal text-[#64748B]">
                              {formatCurrency(tier.totalRevenue)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-medium text-[#2A8C82]">
                              {formatCurrency(tier.totalProfit)}{' '}
                              <span className="text-[#64748B] font-normal">
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
