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
            <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">
              Labor Rates
            </h1>
            <span className="inline-flex items-center px-3 py-0.5 rounded-full bg-slate-200/60 text-slate-600 text-xs font-medium">
              {items.length} {items.length === 1 ? 'Rate' : 'Rates'}
            </span>
          </div>
          <p className="text-sm font-normal text-slate-400 mt-1">
            Hourly and per-minute rates for your time.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAdd}
          className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs sm:text-sm px-5 py-2.5 rounded-full transition-all self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 text-[#E07A5F]" />
          <span>Add Labor Rate</span>
        </button>
      </div>

      {/* Labor Rate Cards */}
      {items.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-12 text-center max-w-lg mx-auto my-8">
          <div className="w-11 h-11 rounded-full bg-coral-50 text-[#E07A5F] flex items-center justify-center mx-auto mb-3">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="text-base font-medium text-slate-800">
            No labor rates configured
          </h3>
          <p className="text-xs font-normal text-slate-400 mt-1 mb-5">
            Add your hourly rates for manual crafting or batch work.
          </p>
          <button
            type="button"
            onClick={onOpenAdd}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-slate-800 text-white text-xs font-medium hover:bg-slate-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-[#E07A5F]" />
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
                className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_14px_40px_rgb(0,0,0,0.06)] border border-slate-100 transition-all duration-200 p-6 flex flex-col justify-between"
              >
                <div>
                  {/* Top Badge Row */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium border ${
                        isExclusive
                          ? 'bg-coral-50 text-[#E07A5F] border-coral-100'
                          : 'bg-slate-100/80 text-slate-600 border-slate-200/50'
                      }`}
                    >
                      {isExclusive ? (
                        <Zap className="w-3 h-3" />
                      ) : (
                        <Cpu className="w-3 h-3" />
                      )}
                      <span>{item.attention_type}</span>
                    </span>

                    <span className="text-xs font-normal text-slate-400">
                      Auto-divided by 60m
                    </span>
                  </div>

                  {/* Activity Name */}
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">
                    {item.name}
                  </h3>

                  {/* Clean Divider Rates Breakdown (No Box-in-Box) */}
                  {!isQuickEditing ? (
                    <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-100">
                      <div>
                        <span className="block text-xs font-normal text-slate-400">
                          Hourly Rate
                        </span>
                        <div className="mt-1 flex items-baseline gap-1">
                          <span className="text-2xl font-semibold text-slate-800">
                            {formatCurrency(item.hourly_rate)}
                          </span>
                          <span className="text-xs font-normal text-slate-400">
                            / hr
                          </span>
                        </div>
                      </div>

                      <div className="border-l border-slate-100 pl-4">
                        <span className="block text-xs font-normal text-slate-400">
                          Minute Rate
                        </span>
                        <div className="mt-1 flex items-baseline gap-1 text-emerald-600">
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
                    <div className="py-3 border-y border-slate-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-600">
                          Update Hourly Rate
                        </span>
                        <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full">
                          {formatCurrency(previewMinuteRate, true)} / min
                        </span>
                      </div>

                      <div className="relative">
                        <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
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
                          className="w-full pl-9 pr-14 py-2 bg-slate-50/70 border border-transparent focus:border-slate-300 focus:bg-white rounded-2xl text-sm font-medium text-slate-800 focus:outline-none transition-all"
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-normal text-slate-400">
                          / hour
                        </span>
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setQuickEditId(null)}
                          className="px-3 py-1 rounded-full text-xs font-normal text-slate-500 hover:bg-slate-100/70"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => saveQuickEdit(item)}
                          className="inline-flex items-center gap-1 px-3.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-white hover:bg-slate-700"
                        >
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Save Rate</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Quick Time Benchmarks */}
                  <div className="mt-3.5 flex items-center justify-between text-xs font-normal text-slate-400">
                    <span>
                      15m ={' '}
                      <strong className="font-medium text-slate-600">
                        {formatCurrency(item.minute_rate * 15)}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      30m ={' '}
                      <strong className="font-medium text-slate-600">
                        {formatCurrency(item.minute_rate * 30)}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      45m ={' '}
                      <strong className="font-medium text-slate-600">
                        {formatCurrency(item.minute_rate * 45)}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-normal text-slate-400">
                    {isExclusive
                      ? '100% hands-on artisan focus'
                      : 'Background / batch machine cycle'}
                  </span>

                  {!isConfirmingDelete ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => startQuickEdit(item)}
                        className="px-3 py-1 rounded-full bg-slate-50/80 hover:bg-slate-100 text-slate-600 text-xs font-medium transition-colors"
                      >
                        Quick Rate
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenEdit(item)}
                        title="Edit labor activity"
                        className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg p-1 transition-colors"
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
                        className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg p-1 transition-colors"
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
                        className="px-2 py-0.5 rounded-full text-slate-600 text-[11px] font-normal hover:bg-white"
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
