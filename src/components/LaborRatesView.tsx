import React, { useState } from 'react';
import {
  Clock,
  Plus,
  Edit3,
  Trash2,
  Zap,
  Cpu,
  Check,
  DollarSign,
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
  const [quickEditId, setQuickEditId] = useState<string | null>(null);
  const [quickHourlyValue, setQuickHourlyValue] = useState<string>('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const startQuickEdit = (item: LaborRateItem) => {
    setQuickEditId(item.id);
    setQuickHourlyValue(item.hourly_rate.toFixed(2));
    setConfirmDeleteId(null);
  };

  const saveQuickEdit = (item: LaborRateItem) => {
    const parsed = parseFloat(quickHourlyValue);
    if (!isNaN(parsed) && parsed >= 0) {
      onQuickUpdateRate(item, parsed);
    }
    setQuickEditId(null);
  };

  return (
    <section className="space-y-8">
      {/* Simplified Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-[#303C36] tracking-tight">
              Labor Rates
            </h1>
            <span className="inline-flex items-center px-3 py-0.5 rounded-full bg-white border border-[#E8ECE9] text-[#63726A] text-xs font-medium">
              {items.length} {items.length === 1 ? 'Rate' : 'Rates'}
            </span>
          </div>
          <p className="text-sm font-normal text-[#63726A] mt-1">
            Hourly and per-minute rates for your time.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAdd}
          className="inline-flex items-center gap-1.5 bg-[#42685B] hover:bg-[#36544a] text-white font-medium text-xs sm:text-sm px-5 py-2.5 rounded-full transition-all self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 text-[#E8A184]" />
          <span>Add Labor Rate</span>
        </button>
      </div>

      {/* Labor Rate Cards */}
      {items.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#E8ECE9] p-12 text-center max-w-lg mx-auto my-8">
          <div className="w-11 h-11 rounded-full bg-[#42685B]/10 text-[#42685B] flex items-center justify-center mx-auto mb-3">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="text-base font-medium text-[#303C36]">
            No labor rates configured
          </h3>
          <p className="text-xs font-normal text-[#63726A] mt-1 mb-5">
            Add your hourly rates for manual crafting or batch work.
          </p>
          <button
            type="button"
            onClick={onOpenAdd}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#42685B] text-white text-xs font-medium hover:bg-[#36544a] transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-[#E8A184]" />
            <span>Add Labor Rate</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {items.map((item) => {
            const isExclusive = item.attention_type === 'Exclusive / Focused';
            const isQuickEditing = quickEditId === item.id;
            const isConfirmingDelete = confirmDeleteId === item.id;
            const previewMinuteRate = isQuickEditing
              ? calculateMinuteRate(parseFloat(quickHourlyValue))
              : item.minute_rate;

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_14px_40px_rgb(0,0,0,0.06)] border border-[#E8ECE9] transition-all duration-200 p-6 flex flex-col justify-between"
              >
                <div>
                  {/* Top Badge Row */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium border ${
                        isExclusive
                          ? 'bg-[#FDF3F0] text-[#C66746] border-[#E8A184]/50'
                          : 'bg-[#B8C9BD]/25 text-[#303C36] border-[#B8C9BD]/50'
                      }`}
                    >
                      {isExclusive ? (
                        <Zap className="w-3 h-3" />
                      ) : (
                        <Cpu className="w-3 h-3" />
                      )}
                      <span>{item.attention_type}</span>
                    </span>

                    <span className="text-xs font-normal text-[#63726A]">
                      Auto-divided by 60m
                    </span>
                  </div>

                  {/* Activity Name */}
                  <h3 className="text-lg font-semibold text-[#303C36] mb-4">
                    {item.name}
                  </h3>

                  {/* Clean Divider Rates Breakdown (No Box-in-Box) */}
                  {!isQuickEditing ? (
                    <div className="grid grid-cols-2 gap-4 py-4 border-y border-[#E8ECE9]">
                      <div>
                        <span className="block text-xs font-normal text-[#63726A]">
                          Hourly Rate
                        </span>
                        <div className="mt-1 flex items-baseline gap-1">
                          <span className="text-2xl font-semibold text-[#303C36]">
                            {formatCurrency(item.hourly_rate)}
                          </span>
                          <span className="text-xs font-normal text-[#63726A]">
                            / hr
                          </span>
                        </div>
                      </div>

                      <div className="border-l border-[#E8ECE9] pl-4">
                        <span className="block text-xs font-normal text-[#63726A]">
                          Minute Rate
                        </span>
                        <div className="mt-1 flex items-baseline gap-1 text-[#42685B]">
                          <span className="text-2xl font-semibold">
                            {formatCurrency(item.minute_rate, true)}
                          </span>
                          <span className="text-xs font-normal opacity-80">
                            / min
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-3 border-y border-[#E8ECE9] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#303C36]">
                          Update Hourly Rate
                        </span>
                        <span className="text-xs font-medium text-[#42685B] bg-[#42685B]/10 border border-[#B8C9BD]/60 px-2.5 py-0.5 rounded-full">
                          {formatCurrency(previewMinuteRate, true)} / min
                        </span>
                      </div>

                      <div className="relative">
                        <DollarSign className="w-4 h-4 text-[#63726A] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="number"
                          step="0.50"
                          min="0"
                          autoFocus
                          value={quickHourlyValue}
                          onChange={(e) => setQuickHourlyValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveQuickEdit(item);
                            if (e.key === 'Escape') setQuickEditId(null);
                          }}
                          className="w-full pl-9 pr-14 py-2 bg-[#FAFBFA] border border-[#E8ECE9] focus:border-[#42685B] focus:bg-white rounded-2xl text-sm font-medium text-[#303C36] focus:outline-none transition-all"
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-normal text-[#63726A]">
                          / hour
                        </span>
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setQuickEditId(null)}
                          className="px-3 py-1 rounded-full text-xs font-normal text-[#63726A] hover:bg-[#FAFBFA]"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => saveQuickEdit(item)}
                          className="inline-flex items-center gap-1 px-3.5 py-1 rounded-full text-xs font-medium bg-[#42685B] text-white hover:bg-[#36544a]"
                        >
                          <Check className="w-3 h-3 text-[#E8A184]" />
                          <span>Save Rate</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Quick Time Benchmarks */}
                  <div className="mt-3.5 flex items-center justify-between text-xs font-normal text-[#63726A]">
                    <span>
                      15m ={' '}
                      <strong className="font-medium text-[#303C36]">
                        {formatCurrency(item.minute_rate * 15)}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      30m ={' '}
                      <strong className="font-medium text-[#303C36]">
                        {formatCurrency(item.minute_rate * 30)}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      45m ={' '}
                      <strong className="font-medium text-[#303C36]">
                        {formatCurrency(item.minute_rate * 45)}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="mt-4 pt-3.5 border-t border-[#E8ECE9] flex items-center justify-between">
                  <span className="text-xs font-normal text-[#63726A]">
                    {isExclusive
                      ? '100% hands-on artisan focus'
                      : 'Background / batch machine cycle'}
                  </span>

                  {!isConfirmingDelete ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => startQuickEdit(item)}
                        className="px-3 py-1 rounded-full bg-[#FAFBFA] border border-[#E8ECE9] hover:border-[#B8C9BD] text-[#303C36] text-xs font-medium transition-colors"
                      >
                        Quick Rate
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenEdit(item)}
                        title="Edit labor activity"
                        className="text-[#63726A] hover:text-[#303C36] hover:bg-[#FAFBFA] rounded-lg p-1 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmDeleteId(item.id);
                          setQuickEditId(null);
                        }}
                        title="Delete labor activity"
                        className="text-[#63726A] hover:text-rose-600 hover:bg-rose-50 rounded-lg p-1 transition-colors"
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
                        className="px-2 py-0.5 rounded-full text-[#63726A] text-[11px] font-normal hover:bg-white"
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
