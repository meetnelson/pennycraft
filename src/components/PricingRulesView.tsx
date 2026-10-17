import React, { useState, useMemo } from 'react';
import {
  Plus,
  Copy,
  Trash2,
  Sparkles,
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
    return evaluatePricingPipeline(activeRule.blocks, sampleCosts);
  }, [activeRule, sampleCosts]);

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
  };

  if (!activeRule) return null;

  return (
    <section className="space-y-8">
      {/* Simplified Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 px-1">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-800 tracking-tight">
              Pricing Rules
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-white border border-slate-200/60 text-xs font-normal text-slate-500">
              {rules.length} {rules.length === 1 ? 'Rule' : 'Rules'}
            </span>
          </div>
          <p className="text-sm font-normal text-slate-400 mt-1">
            How you calculate your selling prices
          </p>
        </div>

        <button
          type="button"
          onClick={handleCreateNewRule}
          className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs sm:text-sm px-4 py-2 rounded-full transition-all self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 text-[#E07A5F]" />
          <span>New Rule</span>
        </button>
      </div>

      {/* Main Split Grid with Balanced Equal Heights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Sidebar: Preview Product Selector at Top & Rule List (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 flex-1 flex flex-col justify-start space-y-5">
            {/* Simulating With Product Selector pinned at the TOP of the sidebar */}
            {products.length > 0 && (
              <div className="pb-5 border-b border-slate-100 space-y-2">
                <label className="block text-xs font-medium text-slate-500">
                  Simulating with:
                </label>
                <select
                  value={previewProduct?.id || ''}
                  onChange={(e) => setPreviewProductId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200/60 focus:border-slate-300 focus:bg-white rounded-2xl text-xs font-medium text-slate-800 focus:outline-none transition-all"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({formatCurrency(p.base_production_cost)} cost)
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="divide-y divide-slate-100">
              {rules.map((rule) => {
                const isSelected = rule.id === activeRule.id;
                const previewEval = evaluatePricingPipeline(
                  rule.blocks,
                  sampleCosts
                );

                return (
                  <div
                    key={rule.id}
                    onClick={() => setSelectedRuleId(rule.id)}
                    className={`group py-3.5 px-3.5 first:pt-2.5 last:pb-2.5 rounded-2xl cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-100/80 text-slate-900'
                        : 'hover:bg-slate-50/70 text-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-sm font-medium leading-snug truncate">
                          {rule.name}
                        </h3>
                        {rule.description ? (
                          <p className="text-xs font-normal text-slate-400 mt-0.5 line-clamp-2">
                            {rule.description}
                          </p>
                        ) : (
                          <p className="text-xs font-normal text-slate-400 mt-0.5 truncate">
                            {rule.blocks.map(formatBlockPillLabel).join(' + ')}
                          </p>
                        )}
                      </div>

                      <span className="text-xs font-medium shrink-0 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                        {formatCurrency(previewEval.suggestedRetailPrice)}
                      </span>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{rule.blocks.length} steps</span>

                      <div
                        className="flex items-center gap-0.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            const copy = onDuplicateRule(rule.id);
                            if (copy) setSelectedRuleId(copy.id);
                          }}
                          title="Duplicate Rule"
                          className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg p-1 transition-colors"
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
                            className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg p-1 transition-colors"
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
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 flex-1 flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              {/* Rule Name, Free-Form Personal Notes & Auto-Generated Visual Formula Pipeline */}
              <div className="space-y-4 pb-6 border-b border-slate-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-normal text-slate-400 mb-1.5">
                      Rule Name
                    </label>
                    <input
                      type="text"
                      value={activeRule.name}
                      onChange={(e) =>
                        onUpdateRule(activeRule.id, { name: e.target.value })
                      }
                      placeholder="e.g., Etsy Online Store"
                      className="w-full px-4 py-2.5 bg-slate-50/70 border border-transparent focus:border-slate-300 focus:bg-white rounded-2xl text-sm font-medium text-slate-800 focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-normal text-slate-400 mb-1.5">
                      Notes
                    </label>
                    <input
                      type="text"
                      value={activeRule.description || ''}
                      onChange={(e) =>
                        onUpdateRule(activeRule.id, {
                          description: e.target.value,
                        })
                      }
                      placeholder="e.g., Use this for custom holiday orders..."
                      className="w-full px-4 py-2.5 bg-slate-50/70 border border-transparent focus:border-slate-300 focus:bg-white rounded-2xl text-xs font-normal text-slate-600 placeholder:text-slate-400 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Auto-Generated Visual Formula Pipeline (Breadcrumb Display) */}
                <div className="pt-1">
                  <span className="block text-[11px] font-normal text-slate-400 mb-2">
                    Formula Pipeline
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
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
                </div>
              </div>

              {/* Interactive Price Steps */}
              <div>
                <div className="mb-3">
                  <h3 className="text-sm font-medium text-slate-800">
                    Price Steps
                  </h3>
                  <p className="text-xs font-normal text-slate-400">
                    Calculated from top to bottom
                  </p>
                </div>

                <RulePipelineStack
                  steps={evalResult.steps}
                  onChangeBlocks={(nextBlocks) =>
                    onUpdateRule(activeRule.id, { blocks: nextBlocks })
                  }
                />
              </div>
            </div>

            <div className="space-y-6 pt-2 border-t border-slate-100">
              {/* Luminous Hero Result Card */}
              <div className="bg-[#F4F7FB]/80 rounded-3xl p-6 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-xs font-normal text-slate-500">
                    <Sparkles className="w-3.5 h-3.5 text-[#E07A5F]" />
                    <span>
                      Suggested Price ({previewProduct?.name || 'Sample'})
                    </span>
                  </div>
                  <div className="text-3xl sm:text-4xl font-semibold text-slate-800 tracking-tight">
                    {formatCurrency(evalResult.suggestedRetailPrice)}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                  <div>
                    <span className="block text-[11px] font-normal text-slate-400">
                      Cost to Make
                    </span>
                    <span className="text-sm font-semibold text-slate-700 mt-0.5 block">
                      {formatCurrency(evalResult.totalProductionCost)}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[11px] font-normal text-slate-400">
                      Net Profit
                    </span>
                    <span className="text-sm font-semibold text-emerald-600 mt-0.5 block">
                      {formatCurrency(evalResult.netProfit)}{' '}
                      <span className="text-xs font-normal text-slate-400">
                        ({evalResult.netMarginPercent.toFixed(0)}%)
                      </span>
                    </span>
                  </div>

                  <div>
                    <span className="block text-[11px] font-normal text-slate-400">
                      Fees
                    </span>
                    <span className="text-sm font-semibold text-indigo-600 mt-0.5 block">
                      {formatCurrency(evalResult.platformFeesTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Lightweight Batch Discounts Table */}
              <div>
                <h4 className="text-xs font-normal text-slate-400 mb-2">
                  Quantity Estimates
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-normal">
                        <th className="py-2 px-3 font-normal">Quantity</th>
                        <th className="py-2 px-3 font-normal">Unit Price</th>
                        <th className="py-2 px-3 font-normal">Total</th>
                        <th className="py-2 px-3 font-normal text-right">
                          Profit
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {batchTiers.map((tier) => (
                        <tr key={tier.qty}>
                          <td className="py-2.5 px-3 font-medium text-slate-700">
                            {tier.label}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-800">
                            {formatCurrency(tier.unitPrice)}
                          </td>
                          <td className="py-2.5 px-3 font-normal text-slate-500">
                            {formatCurrency(tier.totalRevenue)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-medium text-emerald-600">
                            {formatCurrency(tier.totalProfit)}{' '}
                            <span className="text-slate-400 font-normal">
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
      </div>
    </section>
  );
};
