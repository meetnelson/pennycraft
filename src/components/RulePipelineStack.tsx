import React, { useState } from 'react';
import {
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  GripVertical,
  Info,
  Sparkles,
} from 'lucide-react';
import {
  EvaluatedBlockStep,
  FeeScope,
  PercentTarget,
  PricingBlock,
} from '../types/pricing';
import {
  createEtsyFeePresetBlocks,
  formatCurrency,
  generateId,
  isFeeBlock,
  isPercentFeeBlock,
} from '../utils/calculations';

interface RulePipelineStackProps {
  steps: EvaluatedBlockStep[];
  onChangeBlocks: (nextBlocks: PricingBlock[]) => void;
  compact?: boolean;
}

export const RulePipelineStack: React.FC<RulePipelineStackProps> = ({
  steps,
  onChangeBlocks,
  compact = false,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const blocks = steps.map((s) => s.block);

  const moveBlock = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    const copy = [...blocks];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);
    onChangeBlocks(copy);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (index: number) => {
    if (draggedIndex !== null && draggedIndex !== index) {
      const copy = [...blocks];
      const [moved] = copy.splice(draggedIndex, 1);
      copy.splice(index, 0, moved);
      onChangeBlocks(copy);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const updateBlock = (index: number, patch: Partial<PricingBlock>) => {
    const copy = blocks.map((b, i) => (i === index ? { ...b, ...patch } : b));
    onChangeBlocks(copy);
  };

  const removeBlock = (index: number) => {
    onChangeBlocks(blocks.filter((_, i) => i !== index));
  };

  const addModifierBlock = (
    preset:
      | 'MARKUP'
      | 'FEE_PERCENT'
      | 'FEE_FIXED'
      | 'ETSY_PRESET'
      | 'FIXED_ADD'
      | 'DISCOUNT'
  ) => {
    if (preset === 'ETSY_PRESET') {
      // Remove existing fee blocks and append the realistic decomposed Etsy fee structure
      const withoutFees = blocks.filter((b) => !isFeeBlock(b));
      onChangeBlocks([...withoutFees, ...createEtsyFeePresetBlocks()]);
      return;
    }

    let newBlock: PricingBlock;
    if (preset === 'MARKUP') {
      newBlock = {
        id: generateId('blk'),
        type: 'PERCENT_MODIFIER',
        label: 'Profit Markup',
        value: 50,
        target: 'RUNNING_SUBTOTAL',
        role: 'MARKUP',
      };
    } else if (preset === 'FEE_PERCENT') {
      newBlock = {
        id: generateId('blk'),
        type: 'PERCENT_MODIFIER',
        label: 'Etsy Selling Fees',
        value: 6.5,
        is_percent: true,
        target: 'RUNNING_SUBTOTAL',
        role: 'FEE',
      };
    } else if (preset === 'FEE_FIXED') {
      newBlock = {
        id: generateId('blk'),
        type: 'FIXED_ADD',
        label: 'Payment Processing (Fixed)',
        value: 0.25,
        is_percent: false,
        role: 'FEE',
        fee_scope: 'PER_ORDER',
      };
    } else if (preset === 'FIXED_ADD') {
      newBlock = {
        id: generateId('blk'),
        type: 'FIXED_ADD',
        label: 'Studio Buffer',
        value: 2.5,
        role: 'OVERHEAD',
      };
    } else {
      newBlock = {
        id: generateId('blk'),
        type: 'DISCOUNT',
        label: 'Wholesale Discount',
        value: 15,
        is_percent: true,
        target: 'RUNNING_SUBTOTAL',
        role: 'DISCOUNT',
      };
    }
    onChangeBlocks([...blocks, newBlock]);
  };

  const isBaseBlock = (type: PricingBlock['type']) =>
    type === 'BASE_MATERIALS' ||
    type === 'BASE_LABOR' ||
    type === 'BASE_PACKAGING';

  const getBlockVisualMeta = (block: PricingBlock) => {
    if (isBaseBlock(block.type)) {
      return {
        cardClass: 'bg-white border-slate-200 border-l-[#2A8C82]',
        dotClass: 'bg-[#2A8C82]',
        labelColor: 'text-[#2D3134]',
        amountColor: 'text-[#2D3134]',
        badgeText: 'Recipe',
        badgeClass: 'bg-[#F8F9FA] border border-slate-200 text-[#64748B]',
      };
    }
    if (isFeeBlock(block)) {
      const isPct = isPercentFeeBlock(block);
      return {
        cardClass: 'bg-white border-slate-200 border-l-[#2A8C82]',
        dotClass: 'bg-[#2A8C82]',
        labelColor: 'text-[#2D3134]',
        amountColor: 'text-[#2A8C82]',
        badgeText: isPct ? 'Fee %' : 'Fee $',
        badgeClass: 'bg-[#2A8C82]/10 text-[#2A8C82] border border-[#2A8C82]/25',
      };
    }
    if (block.type === 'PERCENT_MODIFIER') {
      return {
        cardClass: 'bg-white border-slate-200 border-l-[#E78358]',
        dotClass: 'bg-[#E78358]',
        labelColor: 'text-[#2D3134]',
        amountColor: 'text-[#E78358]',
        badgeText: 'Markup %',
        badgeClass:
          'bg-[#E78358]/10 text-[#E78358] border border-[#E78358]/30',
      };
    }
    if (block.type === 'FIXED_ADD') {
      return {
        cardClass: 'bg-white border-slate-200 border-l-[#F4B266]',
        dotClass: 'bg-[#F4B266]',
        labelColor: 'text-[#2D3134]',
        amountColor: 'text-[#2A8C82]',
        badgeText: 'Extra $',
        badgeClass: 'bg-[#F4B266]/20 text-[#2D3134]',
      };
    }
    return {
      cardClass: 'bg-white border-slate-200 border-l-[#E78358]',
      dotClass: 'bg-[#E78358]',
      labelColor: 'text-[#2D3134]',
      amountColor: 'text-[#E78358]',
      badgeText: 'Discount',
      badgeClass: 'bg-[#E78358]/10 text-[#E78358]',
    };
  };

  return (
    <div className="space-y-3.5">
      {/* Vertical Sequential Stack of Smooth Floating Pill Cards */}
      <div className="space-y-2">
        {steps.map((step, index) => {
          const { block, deltaAmount, runningSubtotal } = step;
          const isBase = isBaseBlock(block.type);
          const isFee = isFeeBlock(block);
          const isPctFee = isPercentFeeBlock(block);
          const isMarkup = block.type === 'PERCENT_MODIFIER' && !isFee;
          const meta = getBlockVisualMeta(block);

          return (
            <div
              key={block.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={() => handleDrop(index)}
              onDragEnd={() => {
                setDraggedIndex(null);
                setDragOverIndex(null);
              }}
              className={`group relative rounded-2xl border border-l-[3px] ${
                meta.cardClass
              } shadow-xs transition-all duration-150 ${
                dragOverIndex === index
                  ? 'ring-2 ring-[#2A8C82]/40 bg-[#F8F9FA]'
                  : 'hover:border-[#2A8C82]/40'
              } ${compact ? 'px-3.5 py-2.5' : 'px-4 py-3'}`}
            >
              <div className="flex items-center justify-between gap-3">
                {/* Left: Drag Handle, Dot, Label & Inline Controls */}
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-[#64748B]/60 group-hover:text-[#64748B] cursor-grab active:cursor-grabbing shrink-0">
                    <GripVertical className="w-3.5 h-3.5" />
                    <span
                      className={`w-2 h-2 rounded-full ${meta.dotClass}`}
                    />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    {isBase ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-medium text-[#2D3134]">
                          {block.label}
                        </span>
                        <span
                          className={`text-[10px] font-normal px-2 py-0.5 rounded-full ${meta.badgeClass}`}
                        >
                          {meta.badgeText}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <input
                          type="text"
                          value={block.label}
                          aria-label={
                            isMarkup
                              ? 'Profit Markup'
                              : isFee
                              ? 'Selling Fee label'
                              : 'Step label'
                          }
                          placeholder={
                            isMarkup
                              ? 'Profit Markup'
                              : isFee
                              ? 'e.g., Etsy Selling Fees'
                              : 'Step label'
                          }
                          onChange={(e) =>
                            updateBlock(index, { label: e.target.value })
                          }
                          className={`text-xs sm:text-sm font-medium ${meta.labelColor} bg-white rounded-lg px-2.5 py-1 border border-slate-200 focus:border-[#2A8C82] focus:ring-1 focus:ring-[#2A8C82] outline-none min-w-[115px] max-w-[185px] transition-all`}
                        />

                        {/* Value Input Pill */}
                        <div className="inline-flex items-center bg-white border border-slate-200 focus-within:border-[#2A8C82] focus-within:ring-1 focus-within:ring-[#2A8C82] rounded-lg px-2.5 py-1 transition-all">
                          {((block.type === 'FIXED_ADD' && !isFee) ||
                            (isFee && !isPctFee)) && (
                            <span className="text-[11px] text-[#64748B] mr-0.5">
                              +$
                            </span>
                          )}
                          {block.type === 'DISCOUNT' && !block.is_percent && (
                            <span className="text-[11px] text-[#64748B] mr-0.5">
                              -$
                            </span>
                          )}
                          {block.type === 'DISCOUNT' && block.is_percent && (
                            <span className="text-[11px] text-[#E78358] mr-0.5">
                              -
                            </span>
                          )}
                          {(isMarkup || (isFee && isPctFee)) && (
                            <span
                              className={`text-[11px] mr-0.5 ${
                                isFee ? 'text-[#2A8C82]' : 'text-[#E78358]'
                              }`}
                            >
                              +
                            </span>
                          )}
                          <input
                            type="number"
                            step="any"
                            min="0"
                            aria-label={
                              isMarkup ? 'Markup %' : `${block.label} value`
                            }
                            value={block.value ?? 0}
                            onChange={(e) =>
                              updateBlock(index, {
                                value: parseFloat(e.target.value) || 0,
                                auto_target_margin: undefined,
                              })
                            }
                            className="w-12 bg-white text-xs font-medium text-[#2D3134] outline-none text-right"
                          />
                          {(isMarkup ||
                            (isFee && isPctFee) ||
                            (block.type === 'DISCOUNT' &&
                              block.is_percent)) && (
                            <span className="text-[11px] text-[#64748B] ml-0.5">
                              %
                            </span>
                          )}
                        </div>

                        {/* Fee Type Toggle (% vs $) */}
                        {isFee && (
                          <div className="inline-flex items-center bg-[#F8F9FA] p-0.5 rounded-lg border border-slate-200">
                            <button
                              type="button"
                              onClick={() =>
                                updateBlock(index, {
                                  type: 'PERCENT_MODIFIER',
                                  role: 'FEE',
                                  is_percent: true,
                                })
                              }
                              title="Calculates the selling price needed to cover percentage-based fees while preserving your intended profit."
                              className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
                                isPctFee
                                  ? 'bg-[#2A8C82] text-white shadow-2xs'
                                  : 'text-[#64748B] hover:text-[#2D3134]'
                              }`}
                            >
                              %
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updateBlock(index, {
                                  type: 'FIXED_ADD',
                                  role: 'FEE',
                                  is_percent: false,
                                  fee_scope: block.fee_scope || 'PER_ORDER',
                                })
                              }
                              title="Accounts for a fixed fee charged per transaction or item, depending on its configuration."
                              className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
                                !isPctFee
                                  ? 'bg-[#2A8C82] text-white shadow-2xs'
                                  : 'text-[#64748B] hover:text-[#2D3134]'
                              }`}
                            >
                              $
                            </button>
                          </div>
                        )}

                        {/* Discount Type Switch (% vs $) */}
                        {block.type === 'DISCOUNT' && (
                          <button
                            type="button"
                            onClick={() =>
                              updateBlock(index, {
                                is_percent: !block.is_percent,
                              })
                            }
                            className="text-[11px] font-normal text-[#64748B] hover:text-[#2D3134] px-2 py-1 rounded-lg bg-white border border-slate-200 transition-colors"
                          >
                            {block.is_percent ? '%' : '$'}
                          </button>
                        )}

                        {/* Target Selector for Markup % or Percent Discount */}
                        {(isMarkup ||
                          (block.type === 'DISCOUNT' && block.is_percent)) && (
                          <select
                            value={block.target || 'RUNNING_SUBTOTAL'}
                            onChange={(e) =>
                              updateBlock(index, {
                                target: e.target.value as PercentTarget,
                                auto_target_margin: undefined,
                              })
                            }
                            className="text-[11px] font-normal text-[#64748B] bg-white border border-slate-200 focus:border-[#2A8C82] focus:ring-1 focus:ring-[#2A8C82] outline-none rounded-lg px-2.5 py-1 transition-all"
                          >
                            <option value="RUNNING_SUBTOTAL">
                              on subtotal
                            </option>
                            <option value="PREVIOUS_BLOCK">
                              on prev step
                            </option>
                            <option value="BASE_MATERIALS">
                              on materials
                            </option>
                          </select>
                        )}

                        {/* "% of Selling Price" Badge + Accessible Tooltip for Percentage Fees */}
                        {isFee && isPctFee && (
                          <span
                            title="Calculates the selling price needed to cover percentage-based fees while preserving your intended profit."
                            className="inline-flex items-center gap-1 text-[11px] font-normal text-[#2A8C82] bg-[#2A8C82]/10 border border-[#2A8C82]/25 px-2 py-0.5 rounded-full cursor-help"
                          >
                            <span>% of Selling Price</span>
                            <Info className="w-3 h-3 opacity-75" />
                          </span>
                        )}

                        {/* Fixed Fee Scope Selector (per order vs per item) + Tooltip */}
                        {isFee && !isPctFee && (
                          <div className="inline-flex items-center gap-1">
                            <select
                              value={block.fee_scope || 'PER_ORDER'}
                              onChange={(e) =>
                                updateBlock(index, {
                                  fee_scope: e.target.value as FeeScope,
                                })
                              }
                              aria-label="Fixed fee scope"
                              className="text-[11px] font-normal text-[#2A8C82] bg-[#2A8C82]/10 border border-[#2A8C82]/25 outline-none rounded-full px-2.5 py-0.5 cursor-pointer"
                            >
                              <option value="PER_ORDER">per order</option>
                              <option value="PER_ITEM">per item</option>
                            </select>
                            <span
                              title="Accounts for a fixed fee charged per transaction or item, depending on its configuration."
                              className="text-[#2A8C82] cursor-help p-0.5"
                            >
                              <Info className="w-3 h-3" />
                            </span>
                          </div>
                        )}

                        {/* Operational Multiplier Badge + Accessible Tooltip for Markup % */}
                        {isMarkup && (
                          <span
                            title="Adds a percentage to the accumulated cost at this step."
                            className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#E78358]/10 text-[#E78358] border border-[#E78358]/30 cursor-help"
                          >
                            <span>Markup %</span>
                            <Info className="w-3 h-3 opacity-75" />
                          </span>
                        )}
                      </div>
                    )}

                    {/* Auto-calculated helper note when Target Net Margin slider adjusted this Markup step */}
                    {isMarkup &&
                      typeof block.auto_target_margin === 'number' && (
                        <p className="text-[11px] font-normal text-[#2A8C82]">
                          Automatically calculated to achieve your target net
                          margin ({block.auto_target_margin}%).
                        </p>
                      )}
                  </div>
                </div>

                {/* Right: Evaluated Delta, Running Subtotal & Subtle Ghost Controls */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <div className="text-right">
                    <span
                      className={`text-xs sm:text-sm font-medium ${meta.amountColor}`}
                    >
                      {deltaAmount >= 0 ? '+' : '-'}
                      {formatCurrency(Math.abs(deltaAmount))}
                    </span>
                    <span className="block text-[10px] font-normal text-[#64748B]">
                      {formatCurrency(runningSubtotal)}
                    </span>
                  </div>

                  {/* Subtle Ghost Reorder & Delete Controls */}
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveBlock(index, -1)}
                      title="Move step up"
                      className="text-[#64748B] hover:text-[#2D3134] hover:bg-[#F8F9FA] rounded-lg p-1 disabled:opacity-25 transition-colors"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === blocks.length - 1}
                      onClick={() => moveBlock(index, 1)}
                      title="Move step down"
                      className="text-[#64748B] hover:text-[#2D3134] hover:bg-[#F8F9FA] rounded-lg p-1 disabled:opacity-25 transition-colors"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    {!isBase && (
                      <button
                        type="button"
                        onClick={() => removeBlock(index)}
                        title="Remove step"
                        className="text-[#64748B] hover:text-rose-500 hover:bg-rose-50 rounded-lg p-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* "+ Add Step" Pill Bar */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-normal text-[#64748B]">Add step:</span>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => addModifierBlock('MARKUP')}
            title="Adds a percentage to the accumulated cost at this step."
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-[#E78358] bg-[#E78358]/10 border border-[#E78358]/30 hover:bg-[#E78358]/15 transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#E78358]" />
            <Plus className="w-3 h-3" />
            <span>Markup %</span>
          </button>

          <button
            type="button"
            onClick={() => addModifierBlock('FEE_PERCENT')}
            title="Calculates the selling price needed to cover percentage-based fees while preserving your intended profit."
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-[#2A8C82] bg-[#2A8C82]/10 border border-[#2A8C82]/30 hover:bg-[#2A8C82]/15 transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#2A8C82]" />
            <Plus className="w-3 h-3" />
            <span>Fee %</span>
          </button>

          <button
            type="button"
            onClick={() => addModifierBlock('FEE_FIXED')}
            title="Accounts for a fixed fee charged per transaction or item, depending on its configuration."
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-[#2A8C82] bg-white border border-[#2A8C82]/30 hover:bg-[#2A8C82]/10 transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#2A8C82]" />
            <Plus className="w-3 h-3" />
            <span>Fee $</span>
          </button>

          <button
            type="button"
            onClick={() => addModifierBlock('ETSY_PRESET')}
            title="Apply standard Canadian / International Etsy fee breakdown: 6.5% Transaction Fee, 3% + $0.25 Payment Processing, 0.5% Regulatory Operating Fee"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-[#2A8C82] bg-[#2A8C82]/5 border border-[#2A8C82]/30 hover:bg-[#2A8C82]/15 transition-colors"
          >
            <Sparkles className="w-3 h-3 text-[#F4B266]" />
            <span>Etsy Selling Fees Preset</span>
          </button>

          <button
            type="button"
            onClick={() => addModifierBlock('FIXED_ADD')}
            title="Add extra fixed production/overhead cost ($)"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-[#2D3134] bg-[#F4B266]/20 border border-[#F4B266]/40 hover:bg-[#F4B266]/30 transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#F4B266]" />
            <Plus className="w-3 h-3" />
            <span>Extra $</span>
          </button>

          <button
            type="button"
            onClick={() => addModifierBlock('DISCOUNT')}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-[#E78358] bg-white border border-slate-200 hover:border-[#E78358] transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#E78358]" />
            <Plus className="w-3 h-3" />
            <span>Discount</span>
          </button>
        </div>
      </div>

      {/* Explanatory Text below the formula builder */}
      <p className="text-xs font-normal text-[#64748B] leading-relaxed pt-1">
        Markups increase your accumulated costs to build profit. Selling fees
        are calculated from the final selling price, so they&apos;re covered
        without reducing your target profit.
      </p>
    </div>
  );
};
