import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Layers,
  Package,
  Clock,
  Calculator,
  DollarSign,
  Check,
  Sparkles,
  ShoppingBag,
  Link2,
  AlertTriangle,
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
  templateItem?: MaterialItem | PackagingItem | null;
  existingMaterials?: MaterialItem[];
  existingPackaging?: PackagingItem[];
  materialCategories: string[];
  packagingCategories: string[];
  onClose: () => void;
  onSwitchToCreateProduct?: () => void;
  onOpenCategoryManager?: (scope: 'materials' | 'packaging') => void;
  onDirtyChange?: (isDirty: boolean) => void;
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
  templateItem = null,
  existingMaterials = [],
  existingPackaging = [],
  materialCategories,
  packagingCategories,
  onClose,
  onSwitchToCreateProduct,
  onOpenCategoryManager,
  onDirtyChange,
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
  const [confirmDuplicateNameSave, setConfirmDuplicateNameSave] =
    useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const initialSnapshot = useMemo(() => {
    if (!editingItem) {
      if (templateItem) {
        return {
          name: `${templateItem.name} (Copy)`,
          category: templateItem.category,
          purchaseUnit: templateItem.purchase_unit,
          purchaseQty: String(templateItem.purchase_qty),
          pricePaid: String(templateItem.price_paid),
          supplierUrl: templateItem.supplier_url || '',
          attentionType: 'Exclusive / Focused' as AttentionType,
          hourlyRate: '',
        };
      }
      return {
        name: '',
        category: '',
        purchaseUnit: 'un' as PurchaseUnit,
        purchaseQty: '',
        pricePaid: '',
        supplierUrl: '',
        attentionType: 'Exclusive / Focused' as AttentionType,
        hourlyRate: '',
      };
    }
    if ('hourly_rate' in editingItem) {
      return {
        name: editingItem.name,
        category: '',
        purchaseUnit: 'un' as PurchaseUnit,
        purchaseQty: '',
        pricePaid: '',
        supplierUrl: '',
        attentionType: editingItem.attention_type,
        hourlyRate: String(editingItem.hourly_rate),
      };
    }
    return {
      name: editingItem.name,
      category: editingItem.category,
      purchaseUnit: editingItem.purchase_unit,
      purchaseQty: String(editingItem.purchase_qty),
      pricePaid: String(editingItem.price_paid),
      supplierUrl: editingItem.supplier_url || '',
      attentionType: 'Exclusive / Focused' as AttentionType,
      hourlyRate: '',
    };
  }, [editingItem, templateItem]);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setConfirmDuplicateNameSave(false);
    setShowDiscardConfirm(false);
    setPendingAction(null);
    setEntityType(initialEntityType);

    setName(initialSnapshot.name);
    setCategory(initialSnapshot.category);
    setPurchaseUnit(initialSnapshot.purchaseUnit);
    setPurchaseQty(initialSnapshot.purchaseQty);
    setPricePaid(initialSnapshot.pricePaid);
    setSupplierUrl(initialSnapshot.supplierUrl);
    setAttentionType(initialSnapshot.attentionType);
    setHourlyRate(initialSnapshot.hourlyRate);
  }, [isOpen, initialEntityType, initialSnapshot]);

  // Real-time duplicate name detection (case-insensitive) for Materials and Packaging
  const duplicateExistingItem = useMemo(() => {
    if (entityType === 'labor') return null;
    const trimmed = name.trim();
    if (!trimmed) return null;
    const pool =
      entityType === 'materials' ? existingMaterials : existingPackaging;
    return (
      pool.find(
        (item) =>
          item.id !== editingItem?.id &&
          item.name.trim().toLowerCase() === trimmed.toLowerCase()
      ) || null
    );
  }, [
    entityType,
    name,
    existingMaterials,
    existingPackaging,
    editingItem?.id,
  ]);

  useEffect(() => {
    setConfirmDuplicateNameSave(false);
  }, [name, entityType]);

  const isDirty = useMemo(() => {
    if (!isOpen) return false;
    if (entityType === 'labor') {
      return (
        name !== initialSnapshot.name ||
        attentionType !== initialSnapshot.attentionType ||
        hourlyRate !== initialSnapshot.hourlyRate
      );
    }
    return (
      name !== initialSnapshot.name ||
      category !== initialSnapshot.category ||
      purchaseUnit !== initialSnapshot.purchaseUnit ||
      purchaseQty !== initialSnapshot.purchaseQty ||
      pricePaid !== initialSnapshot.pricePaid ||
      supplierUrl !== initialSnapshot.supplierUrl
    );
  }, [
    isOpen,
    entityType,
    name,
    category,
    purchaseUnit,
    purchaseQty,
    pricePaid,
    supplierUrl,
    attentionType,
    hourlyRate,
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

  if (!isOpen) return null;

  const isEditing = Boolean(editingItem);
  const parsedQty = parseFloat(purchaseQty);
  const parsedPrice = parseFloat(pricePaid);
  const parsedHourly = parseFloat(hourlyRate);

  const liveUnitCost = calculateUnitCost(parsedPrice, parsedQty);
  const liveMinuteRate = calculateMinuteRate(parsedHourly);
  const selectedUnitMeta = getUnitOption(purchaseUnit);

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

  const handleEntityTypeSwitch = (nextType: ModalEntityType) => {
    if (isEditing || nextType === entityType) return;
    attemptActionWithGuard(() => {
      setEntityType(nextType);
      setError(null);
      setName('');
      setCategory('');
      setPurchaseQty('');
      setPricePaid('');
      setSupplierUrl('');
      setHourlyRate('');
    });
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
      onDirtyChange?.(false);
      onClose();
      return;
    }

    if (!category.trim()) {
      setError('Please select or type a category.');
      return;
    }

    if (duplicateExistingItem && !confirmDuplicateNameSave) {
      setError(
        `A material named '${name.trim()}' already exists. Please rename it or confirm intentional duplicate below.`
      );
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

    onDirtyChange?.(false);
    onClose();
  };

  const entityLabel =
    entityType === 'materials'
      ? 'Material'
      : entityType === 'packaging'
      ? 'Packaging'
      : 'Labor Rate';

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 pb-12 animate-fadeIn">
      {/* Dedicated View Top Navigation & Sticky Header */}
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

          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-[#2D3134] tracking-tight">
              {isEditing
                ? `Edit ${entityLabel}: ${editingItem?.name}`
                : `Add New ${entityLabel}`}
            </h1>
            <p className="text-xs font-normal text-[#64748B]">
              {isEditing
                ? 'Updating price refreshes freshness date & flags affected products'
                : 'Automatic unit cost across Imperial, Metric & Area units'}
            </p>
          </div>
        </div>

        {/* Entity Switcher Pills (only shown when adding a new item) */}
        {!isEditing && (
          <div className="flex flex-wrap items-center gap-1.5">
            {onSwitchToCreateProduct && (
              <button
                type="button"
                onClick={() =>
                  attemptActionWithGuard(() => {
                    onClose();
                    onSwitchToCreateProduct();
                  })
                }
                className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-normal text-[#64748B] hover:text-[#2D3134] hover:bg-[#F8F9FA] border border-transparent hover:border-slate-200 transition-all"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-[#E78358]" />
                <span>Product</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleEntityTypeSwitch('materials')}
              className={`inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs transition-all ${
                entityType === 'materials'
                  ? 'bg-[#2A8C82]/10 text-[#2A8C82] font-semibold border border-[#2A8C82]/25'
                  : 'text-[#64748B] hover:text-[#2D3134] hover:bg-[#F8F9FA] font-normal'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#E78358]" />
              <span>Material</span>
            </button>

            <button
              type="button"
              onClick={() => handleEntityTypeSwitch('packaging')}
              className={`inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs transition-all ${
                entityType === 'packaging'
                  ? 'bg-[#2A8C82]/10 text-[#2A8C82] font-semibold border border-[#2A8C82]/25'
                  : 'text-[#64748B] hover:text-[#2D3134] hover:bg-[#F8F9FA] font-normal'
              }`}
            >
              <Package className="w-3.5 h-3.5 text-[#F4B266]" />
              <span>Packaging</span>
            </button>

            <button
              type="button"
              onClick={() => handleEntityTypeSwitch('labor')}
              className={`inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs transition-all ${
                entityType === 'labor'
                  ? 'bg-[#2A8C82]/10 text-[#2A8C82] font-semibold border border-[#2A8C82]/25'
                  : 'text-[#64748B] hover:text-[#2D3134] hover:bg-[#F8F9FA] font-normal'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-[#2A8C82]" />
              <span>Labor Rate</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Dedicated Clean Form Card */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-visible"
      >
        <div className="p-6 sm:p-8 lg:p-10 space-y-6">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50/80 border border-rose-100 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Item Name */}
          <div>
            <label className="block text-xs font-medium text-[#2D3134] mb-2">
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
              className={`w-full px-4 py-3 bg-white border ${
                duplicateExistingItem
                  ? 'border-[#E78358] focus:border-[#E78358] focus:ring-[#E78358]'
                  : 'border-slate-200 focus:border-[#2A8C82] focus:ring-[#2A8C82]'
              } focus:ring-1 outline-none rounded-2xl text-sm font-normal text-[#2D3134] placeholder:text-[#64748B] transition-all`}
            />

            {/* Inline Duplicate Item Name Warning Badge & Quick Variant Rename */}
            {duplicateExistingItem && (
              <div
                role="alert"
                className="mt-3 p-3.5 rounded-2xl bg-[#E78358]/10 border border-[#E78358]/30 text-xs space-y-2.5"
              >
                <div className="flex items-start gap-2.5 text-[#2D3134]">
                  <AlertTriangle className="w-4 h-4 text-[#E78358] shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    A material named &apos;
                    <strong className="font-semibold">{name.trim()}</strong>
                    &apos; already exists. Consider adding a specific variant
                    (e.g., color, thickness, or brand).
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pl-6">
                  <button
                    type="button"
                    onClick={() => {
                      setName(`${name.trim()} (Variant)`);
                      setError(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#F8F9FA] text-[#2A8C82] border border-[#2A8C82]/30 text-xs font-semibold shadow-xs transition-colors"
                  >
                    <span>
                      Rename to &apos;{name.trim()} (Variant)&apos;
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setConfirmDuplicateNameSave((prev) => !prev);
                      setError(null);
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                      confirmDuplicateNameSave
                        ? 'bg-[#2A8C82] text-white border-[#2A8C82]'
                        : 'bg-white text-[#64748B] hover:text-[#2D3134] border-slate-200'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>
                      {confirmDuplicateNameSave
                        ? 'Confirmed: Keep duplicate name'
                        : 'Keep duplicate name anyway'}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {entityType !== 'labor' ? (
            <>
              {/* Dynamic Category Combobox */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-medium text-[#2D3134]">
                    Category
                  </label>
                  <div className="flex items-center gap-3">
                    {onOpenCategoryManager && (
                      <button
                        type="button"
                        onClick={() =>
                          onOpenCategoryManager(
                            entityType === 'materials'
                              ? 'materials'
                              : 'packaging'
                          )
                        }
                        className="text-[11px] font-medium text-[#2A8C82] hover:underline"
                      >
                        Manage Categories
                      </button>
                    )}
                    <span className="text-[11px] font-normal text-[#64748B]">
                      Select or click + Add New Category
                    </span>
                  </div>
                </div>
                <CategoryCombobox
                  value={category}
                  onChange={setCategory}
                  categories={
                    entityType === 'materials'
                      ? materialCategories
                      : packagingCategories
                  }
                  onOpenCategoryManager={
                    onOpenCategoryManager
                      ? () =>
                          onOpenCategoryManager(
                            entityType === 'materials'
                              ? 'materials'
                              : 'packaging'
                          )
                      : undefined
                  }
                  placeholder={
                    entityType === 'materials'
                      ? 'Select or type category (e.g., Paper & Cardstock)...'
                      : 'Select or type category (e.g., Shipping Boxes)...'
                  }
                />
              </div>

              {/* Purchase Unit, Quantity, and Total Price Paid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Purchase Unit */}
                <div>
                  <label className="block text-xs font-medium text-[#2D3134] mb-2">
                    Purchase Unit
                  </label>
                  <select
                    value={purchaseUnit}
                    onChange={(e) =>
                      setPurchaseUnit(e.target.value as PurchaseUnit)
                    }
                    className="w-full px-3.5 py-3 bg-white border border-slate-200 focus:border-[#2A8C82] focus:ring-1 focus:ring-[#2A8C82] outline-none rounded-2xl text-sm font-medium text-[#2D3134] transition-all"
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
                  <label className="block text-xs font-medium text-[#2D3134] mb-2">
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
                    className="w-full px-3.5 py-3 bg-white border border-slate-200 focus:border-[#2A8C82] focus:ring-1 focus:ring-[#2A8C82] outline-none rounded-2xl text-sm font-medium text-[#2D3134] placeholder:text-[#64748B] transition-all"
                  />
                </div>

                {/* Price Paid */}
                <div>
                  <label className="block text-xs font-medium text-[#2D3134] mb-2">
                    Total Price Paid
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={pricePaid}
                      onChange={(e) => setPricePaid(e.target.value)}
                      placeholder="45.00"
                      className="w-full pl-9 pr-3.5 py-3 bg-white border border-slate-200 focus:border-[#2A8C82] focus:ring-1 focus:ring-[#2A8C82] outline-none rounded-2xl text-sm font-medium text-[#2D3134] placeholder:text-[#64748B] transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Conversion & Package Quantity Presets */}
              {selectedUnitMeta &&
                selectedUnitMeta.presetQuantities.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-normal text-[#64748B] mr-1">
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
                              ? 'bg-[#2A8C82] text-white border-[#2A8C82] font-medium'
                              : 'bg-white text-[#64748B] border-slate-200 hover:text-[#2D3134] hover:border-[#2A8C82]/40 font-normal'
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
                <label className="block text-xs font-medium text-[#2D3134] mb-2">
                  Where to buy / Supplier Link (Optional)
                </label>
                <div className="relative">
                  <Link2 className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="url"
                    name="supplier_url"
                    value={supplierUrl}
                    onChange={(e) => setSupplierUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 focus:border-[#2A8C82] focus:ring-1 focus:ring-[#2A8C82] outline-none rounded-2xl text-sm font-normal text-[#2D3134] placeholder:text-[#64748B] transition-all"
                  />
                </div>
              </div>

              {/* Immediate Live Unit Cost Feedback */}
              <div className="p-5 rounded-2xl bg-[#F8F9FA] border border-slate-200 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#2A8C82]/10 border border-[#2A8C82]/25 text-[#2A8C82] flex items-center justify-center shrink-0">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-[#2D3134]">
                      Auto-Calculated Unit Cost
                    </p>
                    <p className="text-xs font-normal text-[#64748B]">
                      {!isNaN(parsedPrice) &&
                      !isNaN(parsedQty) &&
                      parsedQty > 0
                        ? `${formatCurrency(parsedPrice)} ÷ ${parsedQty} ${purchaseUnit}`
                        : 'Enter package quantity & price'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-2xl sm:text-3xl font-bold text-[#2A8C82]">
                    {formatCurrency(liveUnitCost, true)}
                  </span>
                  <span className="block text-xs font-normal text-[#64748B]">
                    per {purchaseUnit}
                  </span>
                </div>
              </div>
            </>
          ) : (
            /* Labor Rate Form Fields */
            <>
              <div>
                <label className="block text-xs font-medium text-[#2D3134] mb-2">
                  Attention Type
                </label>
                <select
                  value={attentionType}
                  onChange={(e) =>
                    setAttentionType(e.target.value as AttentionType)
                  }
                  className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-[#2A8C82] focus:ring-1 focus:ring-[#2A8C82] outline-none rounded-2xl text-sm font-medium text-[#2D3134] transition-all"
                >
                  <option value="Exclusive / Focused">
                    Exclusive / Focused
                  </option>
                  <option value="Batch / Passive">Batch / Passive</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#2D3134] mb-2">
                  Hourly Rate ($ / hr)
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    required
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    placeholder="25.00"
                    className="w-full pl-9 pr-20 py-3 bg-white border border-slate-200 focus:border-[#2A8C82] focus:ring-1 focus:ring-[#2A8C82] outline-none rounded-2xl text-sm font-medium text-[#2D3134] placeholder:text-[#64748B] transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-normal text-[#64748B]">
                    per hour
                  </span>
                </div>
              </div>

              {/* Immediate Live Minute Rate Feedback */}
              <div className="p-5 rounded-2xl bg-[#F8F9FA] border border-slate-200 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#2A8C82]/10 border border-[#2A8C82]/25 text-[#2A8C82] flex items-center justify-center shrink-0">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-[#2D3134]">
                      Auto-Calculated Minute Rate
                    </p>
                    <p className="text-xs font-normal text-[#64748B]">
                      {!isNaN(parsedHourly) && parsedHourly > 0
                        ? `${formatCurrency(parsedHourly)} ÷ 60 minutes`
                        : 'Enter an hourly rate'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-2xl sm:text-3xl font-bold text-[#2A8C82]">
                    {formatCurrency(liveMinuteRate, true)}
                  </span>
                  <span className="block text-xs font-normal text-[#64748B]">
                    per minute
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Sticky Action Footer — Always Pinned & Visible */}
        <div className="sticky bottom-0 z-20 bg-white/95 backdrop-blur-md border-t border-slate-200 px-6 sm:px-8 py-4 rounded-b-2xl flex items-center justify-between gap-4">
          <span className="text-xs font-normal text-[#64748B]">
            {isDirty ? (
              <span className="inline-flex items-center gap-1.5 text-[#E78358] font-medium">
                <span className="w-2 h-2 rounded-full bg-[#E78358]" />
                <span>Unsaved changes</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#F4B266]" />
                <span>All fields ready</span>
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
                  You have uncommitted changes in this form. If you leave now, your edits will not be saved.
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
