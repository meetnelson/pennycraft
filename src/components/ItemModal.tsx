import React, { useState, useEffect } from 'react';
import {
  X,
  Layers,
  Package,
  Clock,
  Calculator,
  DollarSign,
  Check,
  Sparkles,
  ShoppingBag,
  Link2,
} from 'lucide-react';
import {
  AttentionType,
  LaborRateItem,
  MaterialItem,
  MaterialUnit,
  ModalEntityType,
  PackagingItem,
  PackagingUnit,
  PurchaseUnit,
} from '../types/pricing';
import {
  calculateMinuteRate,
  calculateUnitCost,
  formatCurrency,
  getUnitOption,
  PURCHASE_UNIT_GROUPS,
} from '../utils/calculations';
import { CategoryCombobox } from './CategoryCombobox';

interface ItemModalProps {
  isOpen: boolean;
  initialEntityType: ModalEntityType;
  editingItem: MaterialItem | PackagingItem | LaborRateItem | null;
  materialCategories: string[];
  packagingCategories: string[];
  onClose: () => void;
  onSwitchToCreateProduct?: () => void;
  onSaveMaterial: (
    data: {
      name: string;
      category: string;
      purchase_unit: MaterialUnit;
      purchase_qty: number;
      price_paid: number;
      supplier_url?: string;
    },
    editId?: string
  ) => void;
  onSavePackaging: (
    data: {
      name: string;
      category: string;
      purchase_unit: PackagingUnit;
      purchase_qty: number;
      price_paid: number;
      supplier_url?: string;
    },
    editId?: string
  ) => void;
  onSaveLabor: (
    data: {
      name: string;
      attention_type: AttentionType;
      hourly_rate: number;
    },
    editId?: string
  ) => void;
}

export const ItemModal: React.FC<ItemModalProps> = ({
  isOpen,
  initialEntityType,
  editingItem,
  materialCategories,
  packagingCategories,
  onClose,
  onSwitchToCreateProduct,
  onSaveMaterial,
  onSavePackaging,
  onSaveLabor,
}) => {
  const [entityType, setEntityType] =
    useState<ModalEntityType>(initialEntityType);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [purchaseUnit, setPurchaseUnit] = useState<PurchaseUnit>('un');
  const [purchaseQty, setPurchaseQty] = useState<string>('');
  const [pricePaid, setPricePaid] = useState<string>('');
  const [supplierUrl, setSupplierUrl] = useState<string>('');

  const [attentionType, setAttentionType] = useState<AttentionType>(
    'Exclusive / Focused'
  );
  const [hourlyRate, setHourlyRate] = useState<string>('');

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setEntityType(initialEntityType);

    if (editingItem) {
      setName(editingItem.name);
      if ('hourly_rate' in editingItem) {
        setAttentionType(editingItem.attention_type);
        setHourlyRate(String(editingItem.hourly_rate));
        setSupplierUrl('');
      } else {
        setCategory(editingItem.category);
        setPurchaseQty(String(editingItem.purchase_qty));
        setPricePaid(String(editingItem.price_paid));
        setPurchaseUnit(editingItem.purchase_unit);
        setSupplierUrl(editingItem.supplier_url || '');
      }
    } else {
      setName('');
      setCategory('');
      setPurchaseUnit('un');
      setPurchaseQty('');
      setPricePaid('');
      setSupplierUrl('');
      setAttentionType('Exclusive / Focused');
      setHourlyRate('');
    }
  }, [
    isOpen,
    initialEntityType,
    editingItem,
    materialCategories,
    packagingCategories,
  ]);

  if (!isOpen) return null;

  const isEditing = Boolean(editingItem);
  const parsedQty = parseFloat(purchaseQty);
  const parsedPrice = parseFloat(pricePaid);
  const parsedHourly = parseFloat(hourlyRate);

  const liveUnitCost = calculateUnitCost(parsedPrice, parsedQty);
  const liveMinuteRate = calculateMinuteRate(parsedHourly);
  const selectedUnitMeta = getUnitOption(purchaseUnit);

  const handleEntityTypeSwitch = (nextType: ModalEntityType) => {
    if (isEditing) return;
    setEntityType(nextType);
    setError(null);
    setName('');
    setCategory('');
    setPurchaseQty('');
    setPricePaid('');
    setSupplierUrl('');
    setHourlyRate('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter a descriptive name for this item.');
      return;
    }

    if (entityType === 'labor') {
      if (isNaN(parsedHourly) || parsedHourly <= 0) {
        setError('Please enter a valid hourly rate greater than $0.');
        return;
      }
      onSaveLabor(
        {
          name: name.trim(),
          attention_type: attentionType,
          hourly_rate: parsedHourly,
        },
        editingItem?.id
      );
      onClose();
      return;
    }

    if (!category.trim()) {
      setError('Please select or type a category.');
      return;
    }

    if (isNaN(parsedQty) || parsedQty <= 0) {
      setError('Purchase quantity must be greater than 0.');
      return;
    }

    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setError('Total price paid must be $0.00 or greater.');
      return;
    }

    const normalizedUrl = supplierUrl.trim()
      ? /^https?:\/\//i.test(supplierUrl.trim())
        ? supplierUrl.trim()
        : `https://${supplierUrl.trim()}`
      : undefined;

    if (entityType === 'materials') {
      onSaveMaterial(
        {
          name: name.trim(),
          category: category.trim(),
          purchase_unit: purchaseUnit,
          purchase_qty: parsedQty,
          price_paid: parsedPrice,
          supplier_url: normalizedUrl,
        },
        editingItem?.id
      );
    } else {
      onSavePackaging(
        {
          name: name.trim(),
          category: category.trim(),
          purchase_unit: purchaseUnit,
          purchase_qty: parsedQty,
          price_paid: parsedPrice,
          supplier_url: normalizedUrl,
        },
        editingItem?.id
      );
    }

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#303C36]/20 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-[0_14px_40px_rgb(0,0,0,0.06)] w-full max-w-xl overflow-hidden border border-[#E8ECE9]">
        {/* Modal Header */}
        <div className="px-7 pt-7 pb-5 flex items-center justify-between border-b border-[#E8ECE9]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#42685B]/10 border border-[#B8C9BD]/60 text-[#42685B] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-[#303C36]">
                {isEditing ? 'Edit Studio Item' : 'Add New Studio Item'}
              </h2>
              <p className="text-xs font-normal text-[#63726A]">
                {isEditing
                  ? 'Updating price refreshes freshness date & flags affected products'
                  : 'Automatic unit cost across Imperial, Metric & Area units'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-[#63726A] hover:text-[#303C36] hover:bg-[#FAFBFA] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Entity Switcher Pills (only shown when adding a new item) */}
        {!isEditing && (
          <div className="px-7 pt-5">
            <div className="flex flex-wrap items-center gap-1.5">
              {onSwitchToCreateProduct && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSwitchToCreateProduct();
                  }}
                  className="inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-full text-xs font-normal text-[#63726A] hover:text-[#303C36] hover:bg-[#FAFBFA] transition-all"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-[#E8A184]" />
                  <span>Product</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleEntityTypeSwitch('materials')}
                className={`inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-full text-xs transition-all ${
                  entityType === 'materials'
                    ? 'bg-[#42685B]/10 text-[#42685B] font-semibold border border-[#B8C9BD]/60'
                    : 'text-[#63726A] hover:text-[#303C36] hover:bg-[#FAFBFA] font-normal'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-[#E8A184]" />
                <span>Material</span>
              </button>

              <button
                type="button"
                onClick={() => handleEntityTypeSwitch('packaging')}
                className={`inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-full text-xs transition-all ${
                  entityType === 'packaging'
                    ? 'bg-[#42685B]/10 text-[#42685B] font-semibold border border-[#B8C9BD]/60'
                    : 'text-[#63726A] hover:text-[#303C36] hover:bg-[#FAFBFA] font-normal'
                }`}
              >
                <Package className="w-3.5 h-3.5 text-[#E8A184]" />
                <span>Packaging</span>
              </button>

              <button
                type="button"
                onClick={() => handleEntityTypeSwitch('labor')}
                className={`inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-full text-xs transition-all ${
                  entityType === 'labor'
                    ? 'bg-[#42685B]/10 text-[#42685B] font-semibold border border-[#B8C9BD]/60'
                    : 'text-[#63726A] hover:text-[#303C36] hover:bg-[#FAFBFA] font-normal'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-[#E8A184]" />
                <span>Labor Rate</span>
              </button>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-7 space-y-5">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50/80 border border-rose-100 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Item Name */}
          <div>
            <label className="block text-xs font-normal text-[#63726A] mb-1.5">
              {entityType === 'materials'
                ? 'Material Name'
                : entityType === 'packaging'
                ? 'Packaging Name'
                : 'Activity Name'}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                entityType === 'materials'
                  ? 'e.g., Offset Paper 90gsm, Vegetable Tanned Leather'
                  : entityType === 'packaging'
                  ? 'e.g., Small Kraft Mailer Box, Cotton Ribbon'
                  : 'e.g., Focused Manual Handcrafting'
              }
              className="w-full px-4 py-2.5 bg-[#FAFBFA] border border-[#E8ECE9] focus:border-[#42685B] focus:bg-white rounded-2xl text-sm font-normal text-[#303C36] placeholder:text-[#63726A]/70 focus:outline-none transition-all"
            />
          </div>

          {entityType !== 'labor' ? (
            <>
              {/* Dynamic Category Combobox */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-normal text-[#63726A]">
                    Category
                  </label>
                  <span className="text-[11px] font-normal text-[#63726A]">
                    Type a new name to auto-save
                  </span>
                </div>
                <CategoryCombobox
                  value={category}
                  onChange={setCategory}
                  categories={
                    entityType === 'materials'
                      ? materialCategories
                      : packagingCategories
                  }
                  placeholder={
                    entityType === 'materials'
                      ? 'Select or type category (e.g., Paper & Cardstock)...'
                      : 'Select or type category (e.g., Shipping Boxes)...'
                  }
                />
              </div>

              {/* Purchase Unit, Quantity, and Total Price Paid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Purchase Unit */}
                <div>
                  <label className="block text-xs font-normal text-[#63726A] mb-1.5">
                    Purchase Unit
                  </label>
                  <select
                    value={purchaseUnit}
                    onChange={(e) =>
                      setPurchaseUnit(e.target.value as PurchaseUnit)
                    }
                    className="w-full px-3.5 py-2.5 bg-[#FAFBFA] border border-[#E8ECE9] focus:border-[#42685B] focus:bg-white rounded-2xl text-sm font-medium text-[#303C36] focus:outline-none transition-all"
                  >
                    {PURCHASE_UNIT_GROUPS.map((grp) => (
                      <optgroup key={grp.group} label={grp.group}>
                        {grp.options.map((u) => (
                          <option key={u.value} value={u.value}>
                            {u.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {/* Purchase Quantity */}
                <div>
                  <label className="block text-xs font-normal text-[#63726A] mb-1.5">
                    Package Qty ({purchaseUnit})
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.001"
                    required
                    value={purchaseQty}
                    onChange={(e) => setPurchaseQty(e.target.value)}
                    placeholder="e.g., 500"
                    className="w-full px-3.5 py-2.5 bg-[#FAFBFA] border border-[#E8ECE9] focus:border-[#42685B] focus:bg-white rounded-2xl text-sm font-medium text-[#303C36] focus:outline-none transition-all"
                  />
                </div>

                {/* Price Paid */}
                <div>
                  <label className="block text-xs font-normal text-[#63726A] mb-1.5">
                    Total Price Paid
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-[#63726A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={pricePaid}
                      onChange={(e) => setPricePaid(e.target.value)}
                      placeholder="45.00"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-[#FAFBFA] border border-[#E8ECE9] focus:border-[#42685B] focus:bg-white rounded-2xl text-sm font-medium text-[#303C36] focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Conversion & Package Quantity Presets */}
              {selectedUnitMeta &&
                selectedUnitMeta.presetQuantities.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[11px] font-normal text-[#63726A] mr-1">
                      {selectedUnitMeta.group} Presets:
                    </span>
                    {selectedUnitMeta.presetQuantities.map((preset) => {
                      const isActive = Number(purchaseQty) === preset.qty;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setPurchaseQty(String(preset.qty))}
                          className={`px-3 py-1 rounded-full text-[11px] transition-all border ${
                            isActive
                              ? 'bg-[#42685B] text-white border-[#42685B] font-medium'
                              : 'bg-[#FAFBFA] text-[#63726A] border-[#E8ECE9] hover:text-[#303C36] hover:bg-[#B8C9BD]/20 font-normal'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                )}

              {/* Optional Supplier / Affiliate Link */}
              <div>
                <label className="block text-xs font-normal text-[#63726A] mb-1.5">
                  Where to buy / Link (Optional)
                </label>
                <div className="relative">
                  <Link2 className="w-4 h-4 text-[#63726A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="url"
                    name="supplier_url"
                    value={supplierUrl}
                    onChange={(e) => setSupplierUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full pl-9 pr-4 py-2.5 bg-[#FAFBFA] border border-[#E8ECE9] focus:border-[#42685B] focus:bg-white rounded-2xl text-xs font-normal text-[#303C36] placeholder:text-[#63726A]/70 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Immediate Live Unit Cost Feedback */}
              <div className="pt-4 border-t border-[#E8ECE9] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-[#42685B]/10 border border-[#B8C9BD]/60 text-[#42685B] flex items-center justify-center shrink-0">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#303C36]">
                      Auto-Calculated Unit Cost
                    </p>
                    <p className="text-xs font-normal text-[#63726A]">
                      {!isNaN(parsedPrice) &&
                      !isNaN(parsedQty) &&
                      parsedQty > 0
                        ? `${formatCurrency(parsedPrice)} ÷ ${parsedQty} ${purchaseUnit}`
                        : 'Enter package quantity & price'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-semibold text-[#42685B]">
                    {formatCurrency(liveUnitCost, true)}
                  </span>
                  <span className="block text-xs font-normal text-[#63726A]">
                    per {purchaseUnit}
                  </span>
                </div>
              </div>
            </>
          ) : (
            /* Labor Rate Form Fields */
            <>
              <div>
                <label className="block text-xs font-normal text-[#63726A] mb-1.5">
                  Attention Type
                </label>
                <select
                  value={attentionType}
                  onChange={(e) =>
                    setAttentionType(e.target.value as AttentionType)
                  }
                  className="w-full px-4 py-2.5 bg-[#FAFBFA] border border-[#E8ECE9] focus:border-[#42685B] focus:bg-white rounded-2xl text-sm font-medium text-[#303C36] focus:outline-none transition-all"
                >
                  <option value="Exclusive / Focused">
                    Exclusive / Focused
                  </option>
                  <option value="Batch / Passive">Batch / Passive</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-normal text-[#63726A] mb-1.5">
                  Hourly Rate ($ / hr)
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-[#63726A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    required
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    placeholder="25.00"
                    className="w-full pl-9 pr-16 py-2.5 bg-[#FAFBFA] border border-[#E8ECE9] focus:border-[#42685B] focus:bg-white rounded-2xl text-sm font-medium text-[#303C36] focus:outline-none transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-normal text-[#63726A]">
                    per hour
                  </span>
                </div>
              </div>

              {/* Immediate Live Minute Rate Feedback */}
              <div className="pt-4 border-t border-[#E8ECE9] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-[#42685B]/10 border border-[#B8C9BD]/60 text-[#42685B] flex items-center justify-center shrink-0">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#303C36]">
                      Auto-Calculated Minute Rate
                    </p>
                    <p className="text-xs font-normal text-[#63726A]">
                      {!isNaN(parsedHourly) && parsedHourly > 0
                        ? `${formatCurrency(parsedHourly)} ÷ 60 minutes`
                        : 'Enter an hourly rate'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-semibold text-[#42685B]">
                    {formatCurrency(liveMinuteRate, true)}
                  </span>
                  <span className="block text-xs font-normal text-[#63726A]">
                    per minute
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-[#E8ECE9] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs sm:text-sm font-normal text-[#63726A] hover:text-[#303C36] hover:bg-[#FAFBFA] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 bg-[#42685B] hover:bg-[#36544a] text-white font-medium text-xs sm:text-sm px-6 py-2.5 rounded-full shadow-xs transition-all"
            >
              <Check className="w-3.5 h-3.5 text-[#E8A184]" />
              <span>{isEditing ? 'Save Changes' : 'Create Item'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
