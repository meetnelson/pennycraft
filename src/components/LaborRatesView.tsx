import React, { useState, useMemo } from 'react';
import {
  Clock,
  Plus,
  Edit3,
  Trash2,
  Zap,
  Cpu,
  Check,
  DollarSign,
  ArrowUpDown,
} from 'lucide-react';
import { LaborRateItem } from '../types/pricing';
import { calculateMinuteRate, formatCurrency } from '../utils/calculations';

interface LaborRatesViewProps {
  items: LaborRateItem[];
  onOpenAdd: () => void;
  onOpenEdit: (item: LaborRateItem) => void;
  onQuickUpdateRate: (item: LaborRateItem, newHourlyRate: number) => void;
  onDelete: (id: string) => void;
}

export const LaborRatesView: React.FC<LaborRatesViewProps> = ({
  items,
  onOpenAdd,
  onOpenEdit,
  onQuickUpdateRate,
  onDelete,
}) => {
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [inlineHourlyValue, setInlineHourlyValue] = useState<string>('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const cmp = a.name.localeCompare(b.name, undefined, {
        sensitivity: 'base',
      });
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [items, sortOrder]);

  const startInlineEdit = (item: LaborRateItem) => {
    setInlineEditId(item.id);
    setInlineHourlyValue(item.hourly_rate.toFixed(2));
    setConfirmDeleteId(null);
  };

  const saveInlineEdit = (item: LaborRateItem) => {
    const parsed = parseFloat(inlineHourlyValue);
    if (!isNaN(parsed) && parsed > 0 && parsed !== item.hourly_rate) {
      onQuickUpdateRate(item, parsed);
    }
    setInlineEditId(null);
  };

  return (
    <section className="space-y-8">
      {/* Simplified Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-[#2D3134] tracking-tight">
              Labor Rates
            </h1>
            <span className="inline-flex items-center px-3 py-0.5 rounded-full bg-white border border-slate-200 text-[#64748B] text-xs font-medium shadow-xs">
              {items.length} {items.length === 1 ? 'Rate' : 'Rates'}
            </span>
          </div>
          <p className="text-sm font-normal text-[#64748B] mt-1">
            Hourly and per-minute rates for your time. Click any hourly rate to edit inline or open the edit form.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Alphabetical Sort Toggle (A-Z / Z-A) */}
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
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-slate-200 hover:border-[#2A8C82]/40 rounded-xl text-xs font-medium text-[#2D3134] shadow-xs transition-all"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-[#2A8C82]" />
            <span>{sortOrder === 'asc' ? 'A-Z' : 'Z-A'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenAdd}
            className="inline-flex items-center gap-1.5 bg-[#2A8C82] hover:bg-[#23736B] text-white font-medium text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-[#F4B266]" />
            <span>Add Labor Rate</span>
          </button>
        </div>
      </div>

      {/* Labor Rate Cards */}
      {sortedItems.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center max-w-lg mx-auto my-8">
          <div className="w-11 h-11 rounded-full bg-[#2A8C82]/10 text-[#2A8C82] flex items-center justify-center mx-auto mb-3">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="text-base font-medium text-[#2D3134]">
            No labor rates configured
          </h3>
          <p className="text-xs font-normal text-[#64748B] mt-1 mb-5">
            Add your hourly rates for manual crafting or batch work.
          </p>
          <button
            type="button"
            onClick={onOpenAdd}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2A8C82] text-white text-xs font-medium hover:bg-[#23736B] shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-[#F4B266]" />
            <span>Add Labor Rate</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sortedItems.map((item) => {
            const isExclusive = item.attention_type === 'Exclusive / Focused';
            const isInlineEditing = inlineEditId === item.id;
            const isConfirmingDelete = confirmDeleteId === item.id;
            const previewMinuteRate = isInlineEditing
              ? calculateMinuteRate(parseFloat(inlineHourlyValue))
              : item.minute_rate;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl shadow-sm hover:shadow-md border border-slate-200 transition-all duration-200 p-6 flex flex-col justify-between"
              >
                <div>
                  {/* Top Badge Row */}
                  <div className="flex items-center justify-between gap-2 mb-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium border ${
                        isExclusive
                          ? 'bg-[#E78358]/10 text-[#E78358] border-[#E78358]/30'
                          : 'bg-[#F8F9FA] text-[#2D3134] border-slate-200'
                      }`}
                    >
                      {isExclusive ? (
                        <Zap className="w-3 h-3" />
                      ) : (
                        <Cpu className="w-3 h-3" />
                      )}
                      <span>{item.attention_type}</span>
                    </span>

                    <span className="text-xs font-normal text-[#64748B]">
                      Auto-divided by 60m
                    </span>
                  </div>

                  {/* Activity Name */}
                  <h3 className="text-lg font-semibold text-[#2D3134] mb-4">
                    {item.name}
                  </h3>

                  {/* Direct Inline Editable Hourly Rate + Auto-Calculated Minute Rate */}
                  <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-200">
                    <div>
                      <span className="block text-xs font-normal text-[#64748B]">
                        Hourly Rate
                      </span>
                      {!isInlineEditing ? (
                        <button
                          type="button"
                          onClick={() => startInlineEdit(item)}
                          title="Click to edit hourly rate directly"
                          className="mt-1 flex items-baseline gap-1 group text-left rounded-xl px-2 -ml-2 py-0.5 hover:bg-[#F8F9FA] transition-colors"
                        >
                          <span className="text-2xl font-semibold text-[#2D3134] group-hover:text-[#2A8C82] transition-colors">
                            {formatCurrency(item.hourly_rate)}
                          </span>
                          <span className="text-xs font-normal text-[#64748B]">
                            / hr
                          </span>
                          <Edit3 className="w-3 h-3 text-[#64748B] opacity-0 group-hover:opacity-100 ml-1 transition-opacity" />
                        </button>
                      ) : (
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <div className="relative flex-1 max-w-[130px]">
                            <DollarSign className="w-3.5 h-3.5 text-[#64748B] absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="number"
                              step="0.50"
                              min="0.01"
                              autoFocus
                              value={inlineHourlyValue}
                              onChange={(e) =>
                                setInlineHourlyValue(e.target.value)
                              }
                              onBlur={() => saveInlineEdit(item)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveInlineEdit(item);
                                if (e.key === 'Escape') setInlineEditId(null);
                              }}
                              className="w-full pl-7 pr-2.5 py-1.5 bg-white border border-slate-200 focus:border-[#2A8C82] focus:ring-1 focus:ring-[#2A8C82] outline-none rounded-xl text-sm font-semibold text-[#2D3134]"
                            />
                          </div>
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              saveInlineEdit(item);
                            }}
                            className="p-1.5 rounded-xl bg-[#2A8C82] text-white hover:bg-[#23736B] transition-colors"
                            title="Save rate"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="border-l border-slate-200 pl-4">
                      <span className="block text-xs font-normal text-[#64748B]">
                        Minute Rate
                      </span>
                      <div className="mt-1 flex items-baseline gap-1 text-[#2A8C82] py-0.5">
                        <span className="text-2xl font-semibold">
                          {formatCurrency(previewMinuteRate, true)}
                        </span>
                        <span className="text-xs font-normal opacity-80">
                          / min
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Time Benchmarks */}
                  <div className="mt-3.5 flex items-center justify-between text-xs font-normal text-[#64748B]">
                    <span>
                      15m ={' '}
                      <strong className="font-medium text-[#2D3134]">
                        {formatCurrency(previewMinuteRate * 15)}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      30m ={' '}
                      <strong className="font-medium text-[#2D3134]">
                        {formatCurrency(previewMinuteRate * 30)}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      45m ={' '}
                      <strong className="font-medium text-[#2D3134]">
                        {formatCurrency(previewMinuteRate * 45)}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Card Footer Actions (Clean & Direct — No Redundant "Quick Rate" Button) */}
                <div className="mt-4 pt-3.5 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-normal text-[#64748B]">
                    {isExclusive
                      ? '100% hands-on artisan focus'
                      : 'Background / batch machine cycle'}
                  </span>

                  {!isConfirmingDelete ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onOpenEdit(item)}
                        title="Edit labor activity"
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 hover:bg-[#F8F9FA] hover:border-[#2A8C82]/40 text-[#2D3134] text-xs font-medium transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#64748B]" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmDeleteId(item.id);
                          setInlineEditId(null);
                        }}
                        title="Delete labor activity"
                        className="text-[#64748B] hover:text-rose-600 hover:bg-rose-50 rounded-lg p-1.5 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100">
                      <span className="text-[11px] font-medium text-rose-700">
                        Delete?
                      </span>
                      <button
                        type="button"
                        onClick={() => onDelete(item.id)}
                        className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[11px] font-medium hover:bg-rose-700"
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-0.5 rounded-full text-[#64748B] text-[11px] font-normal hover:bg-white"
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
