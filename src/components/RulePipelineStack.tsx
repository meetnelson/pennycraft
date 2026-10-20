import React, { useState } from 'react';
import {
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  GripVertical,
} from 'lucide-react';
import {
  EvaluatedBlockStep,
  PercentTarget,
  PricingBlock,
} from '../types/pricing';
import { formatCurrency, generateId } from '../utils/calculations';

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
    preset: 'MARGIN' | 'FEE' | 'FIXED_ADD' | 'DISCOUNT'
  ) => {
    let newBlock: PricingBlock;
    if (preset === 'MARGIN') {
      newBlock = {
        id: generateId('blk'),
        type: 'PERCENT_MODIFIER',
        label: 'Profit Margin',
        value: 50,
        target: 'RUNNING_SUBTOTAL',
        role: 'MARGIN',
      };
    } else if (preset === 'FEE') {
      newBlock = {
        id: generateId('blk'),
        type: 'PERCENT_MODIFIER',
        label: 'Platform Fee (Etsy)',
        value: 6.5,
        target: 'RUNNING_SUBTOTAL',
        role: 'FEE',
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
        cardClass: 'bg-white border-[#E8ECE9] border-l-[#B8C9BD]',
        dotClass: 'bg-[#42685B]',
        labelColor: 'text-[#303C36]',
        amountColor: 'text-[#303C36]',
        badgeText: 'Recipe',
        badgeClass: 'bg-[#FAFBFA] border border-[#E8ECE9] text-[#63726A]',
      };
    }
    if (block.type === 'PERCENT_MODIFIER') {
      const isFee =
        block.role === 'FEE' ||
        block.label.toLowerCase().includes('fee') ||
        block.label.toLowerCase().includes('commission');
      if (isFee) {
        return {
          cardClass: 'bg-white border-[#E8ECE9] border-l-[#42685B]',
          dotClass: 'bg-[#42685B]',
          labelColor: 'text-[#303C36]',
          amountColor: 'text-[#42685B]',
          badgeText: 'Fee',
          badgeClass: 'bg-[#42685B]/10 text-[#42685B]',
        };
      }
      return {
        cardClass: 'bg-[#FDF3F0] border-[#E8A184]/50 border-l-[#E8A184]',
        dotClass: 'bg-[#E8A184]',
        labelColor: 'text-[#C66746]',
        amountColor: 'text-[#C66746]',
        badgeText: 'Margin',
        badgeClass: 'bg-white/80 text-[#C66746] border border-[#E8A184]/40',
      };
    }
    if (block.type === 'FIXED_ADD') {
      return {
        cardClass: 'bg-white border-[#E8ECE9] border-l-[#B8C9BD]',
        dotClass: 'bg-[#B8C9BD]',
        labelColor: 'text-[#303C36]',
        amountColor: 'text-[#42685B]',
        badgeText: 'Extra',
        badgeClass: 'bg-[#B8C9BD]/25 text-[#303C36]',
      };
    }
    return {
      cardClass: 'bg-white border-[#E8ECE9] border-l-[#E8A184]',
      dotClass: 'bg-[#E8A184]',
      labelColor: 'text-[#303C36]',
      amountColor: 'text-[#C66746]',
      badgeText: 'Discount',
      badgeClass: 'bg-[#FDF3F0] text-[#C66746]',
    };
  };

  return (
    <div className="space-y-3.5">
      {/* Vertical Sequential Stack of Smooth Floating Pill Cards */}
      <div className="space-y-2">
        {steps.map((step, index) => {
          const { block, deltaAmount, runningSubtotal } = step;
          const isBase = isBaseBlock(block.type);
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
              } shadow-[0_4px_20px_rgb(0,0,0,0.025)] transition-all duration-150 ${
                dragOverIndex === index
                  ? 'ring-2 ring-[#B8C9BD] bg-[#FAFBFA]'
                  : 'hover:border-[#B8C9BD]'
              } ${compact ? 'px-3.5 py-2.5' : 'px-4 py-3'}`}
            >
              <div className="flex items-center justify-between gap-3">
                {/* Left: Drag Handle, Dot, Label & Inline Controls */}
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-[#B8C9BD] group-hover:text-[#63726A] cursor-grab active:cursor-grabbing shrink-0">
                    <GripVertical className="w-3.5 h-3.5" />
                    <span
                      className={`w-2 h-2 rounded-full ${meta.dotClass}`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    {isBase ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-medium text-[#303C36]">
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
                          onChange={(e) =>
                            updateBlock(index, { label: e.target.value })
                          }
                          className={`text-xs sm:text-sm font-medium ${meta.labelColor} bg-transparent rounded-lg px-1.5 py-0.5 border border-transparent hover:border-[#E8ECE9] focus:border-[#B8C9BD] focus:bg-white focus:outline-none min-w-[110px] max-w-[175px] transition-all`}
                        />

                        {/* Value Input Pill */}
                        <div className="inline-flex items-center bg-white/80 border border-[#E8ECE9] focus-within:border-[#42685B] focus-within:bg-white rounded-full px-2.5 py-0.5 transition-all">
                          {block.type === 'FIXED_ADD' && (
                            <span className="text-[11px] text-[#63726A] mr-0.5">
                              +$
                            </span>
                          )}
                          {block.type === 'DISCOUNT' && !block.is_percent && (
                            <span className="text-[11px] text-[#63726A] mr-0.5">
                              -$
                            </span>
                          )}
                          {block.type === 'DISCOUNT' && block.is_percent && (
                            <span className="text-[11px] text-[#C66746] mr-0.5">
                              -
                            </span>
                          )}
                          {block.type === 'PERCENT_MODIFIER' && (
                            <span className="text-[11px] text-[#C66746] mr-0.5">
                              +
                            </span>
                          )}
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={block.value ?? 0}
                            onChange={(e) =>
                              updateBlock(index, {
                                value: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-11 bg-transparent text-xs font-medium text-[#303C36] focus:outline-none text-right"
                          />
                          {(block.type === 'PERCENT_MODIFIER' ||
                            (block.type === 'DISCOUNT' && block.is_percent)) && (
                            <span className="text-[11px] text-[#63726A] ml-0.5">
                              %
                            </span>
                          )}
                        </div>

                        {/* Discount Type Switch (% vs $) */}
                        {block.type === 'DISCOUNT' && (
                          <button
                            type="button"
                            onClick={() =>
                              updateBlock(index, {
                                is_percent: !block.is_percent,
                              })
                            }
                            className="text-[11px] font-normal text-[#63726A] hover:text-[#303C36] px-2 py-0.5 rounded-full bg-[#FAFBFA] border border-[#E8ECE9] transition-colors"
                          >
                            {block.is_percent ? '%' : '$'}
                          </button>
                        )}

                        {/* Target Selector for Percent Modifiers */}
                        {(block.type === 'PERCENT_MODIFIER' ||
                          (block.type === 'DISCOUNT' && block.is_percent)) && (
                          <select
                            value={block.target || 'RUNNING_SUBTOTAL'}
                            onChange={(e) =>
                              updateBlock(index, {
                                target: e.target.value as PercentTarget,
                              })
                            }
                            className="text-[11px] font-normal text-[#63726A] bg-white/80 border border-[#E8ECE9] hover:border-[#B8C9BD] focus:border-[#42685B] focus:bg-white rounded-full px-2.5 py-0.5 focus:outline-none transition-all"
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
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Evaluated Delta, Running Subtotal & Subtle Ghost Controls */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <div className="text-right">
                    <span className={`text-xs sm:text-sm font-medium ${meta.amountColor}`}>
                      {deltaAmount >= 0 ? '+' : '-'}
                      {formatCurrency(Math.abs(deltaAmount))}
                    </span>
                    <span className="block text-[10px] font-normal text-[#63726A]">
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
                      className="text-[#63726A] hover:text-[#303C36] hover:bg-[#FAFBFA] rounded-lg p-1 disabled:opacity-25 transition-colors"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === blocks.length - 1}
                      onClick={() => moveBlock(index, 1)}
                      title="Move step down"
                      className="text-[#63726A] hover:text-[#303C36] hover:bg-[#FAFBFA] rounded-lg p-1 disabled:opacity-25 transition-colors"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    {!isBase && (
                      <button
                        type="button"
                        onClick={() => removeBlock(index)}
                        title="Remove step"
                        className="text-[#63726A] hover:text-rose-500 hover:bg-rose-50 rounded-lg p-1 transition-colors"
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
        <span className="text-xs font-normal text-[#63726A]">Add step:</span>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => addModifierBlock('MARGIN')}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-[#C66746] bg-[#FDF3F0] border border-[#E8A184]/50 hover:bg-[#F9E3DC] transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#E8A184]" />
            <Plus className="w-3 h-3" />
            <span>Margin %</span>
          </button>

          <button
            type="button"
            onClick={() => addModifierBlock('FEE')}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-[#42685B] bg-[#42685B]/10 border border-[#B8C9BD]/60 hover:bg-[#42685B]/15 transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#42685B]" />
            <Plus className="w-3 h-3" />
            <span>Fee %</span>
          </button>

          <button
            type="button"
            onClick={() => addModifierBlock('FIXED_ADD')}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-[#303C36] bg-[#B8C9BD]/25 border border-[#B8C9BD]/60 hover:bg-[#B8C9BD]/40 transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#63726A]" />
            <Plus className="w-3 h-3" />
            <span>Extra $</span>
          </button>

          <button
            type="button"
            onClick={() => addModifierBlock('DISCOUNT')}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-[#C66746] bg-[#FAFBFA] border border-[#E8ECE9] hover:border-[#E8A184] transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#E8A184]" />
            <Plus className="w-3 h-3" />
            <span>Discount</span>
          </button>
        </div>
      </div>
    </div>
  );
};
