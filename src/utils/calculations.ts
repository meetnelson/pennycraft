import {
  EvaluatedBlockStep,
  LaborRateItem,
  MaterialItem,
  PackagingItem,
  PipelineEvaluationResult,
  PricingBlock,
  ProductLaborLine,
  ProductMaterialLine,
  ProductPackagingLine,
  PurchaseUnit,
} from '../types/pricing';

export interface UnitOption {
  value: PurchaseUnit;
  label: string;
  group: 'Count / Pieces' | 'Linear' | 'Area' | 'Weight' | 'Volume';
  shortName: string;
  presetQuantities: { label: string; qty: number }[];
}

export const PURCHASE_UNIT_GROUPS: {
  group: 'Count / Pieces' | 'Linear' | 'Area' | 'Weight' | 'Volume';
  options: UnitOption[];
}[] = [
  {
    group: 'Count / Pieces',
    options: [
      {
        value: 'un',
        label: 'un — Units / Sheets / Pieces',
        group: 'Count / Pieces',
        shortName: 'un',
        presetQuantities: [
          { label: '25 pcs', qty: 25 },
          { label: '50 pcs', qty: 50 },
          { label: '100 sheets', qty: 100 },
          { label: '500 ream', qty: 500 },
        ],
      },
      {
        value: 'pack',
        label: 'pack — Pack / Set',
        group: 'Count / Pieces',
        shortName: 'pack',
        presetQuantities: [
          { label: '1 pack', qty: 1 },
          { label: '5 packs', qty: 5 },
          { label: '10 packs', qty: 10 },
          { label: '24 packs', qty: 24 },
        ],
      },
      {
        value: 'pair',
        label: 'pair — Pair',
        group: 'Count / Pieces',
        shortName: 'pair',
        presetQuantities: [
          { label: '1 pair', qty: 1 },
          { label: '10 pairs', qty: 10 },
          { label: '25 pairs', qty: 25 },
          { label: '50 pairs', qty: 50 },
        ],
      },
    ],
  },
  {
    group: 'Linear',
    options: [
      {
        value: 'cm',
        label: 'cm — Centimeters',
        group: 'Linear',
        shortName: 'cm',
        presetQuantities: [
          { label: '100 cm (1 m)', qty: 100 },
          { label: '300 cm (3 m)', qty: 300 },
          { label: '500 cm (5 m)', qty: 500 },
          { label: '1000 cm (10 m)', qty: 1000 },
        ],
      },
      {
        value: 'm',
        label: 'm — Meters',
        group: 'Linear',
        shortName: 'm',
        presetQuantities: [
          { label: '5 m roll', qty: 5 },
          { label: '10 m roll', qty: 10 },
          { label: '25 m spool', qty: 25 },
          { label: '100 m spool', qty: 100 },
        ],
      },
      {
        value: 'in',
        label: 'in — Inches',
        group: 'Linear',
        shortName: 'in',
        presetQuantities: [
          { label: '12 in (1 ft)', qty: 12 },
          { label: '36 in (1 yd)', qty: 36 },
          { label: '120 in (10 ft)', qty: 120 },
          { label: '360 in (10 yd)', qty: 360 },
        ],
      },
      {
        value: 'ft',
        label: 'ft — Feet',
        group: 'Linear',
        shortName: 'ft',
        presetQuantities: [
          { label: '3 ft (1 yd)', qty: 3 },
          { label: '10 ft roll', qty: 10 },
          { label: '25 ft roll', qty: 25 },
          { label: '50 ft roll', qty: 50 },
        ],
      },
      {
        value: 'yd',
        label: 'yd — Yards',
        group: 'Linear',
        shortName: 'yd',
        presetQuantities: [
          { label: '1 yd', qty: 1 },
          { label: '5 yd bolt', qty: 5 },
          { label: '10 yd spool', qty: 10 },
          { label: '25 yd spool', qty: 25 },
        ],
      },
    ],
  },
  {
    group: 'Area',
    options: [
      {
        value: 'sq ft',
        label: 'sq ft — Square Feet',
        group: 'Area',
        shortName: 'sq ft',
        presetQuantities: [
          { label: '1 sq ft', qty: 1 },
          { label: '6 sq ft sheet', qty: 6 },
          { label: '12 sq ft hide', qty: 12 },
          { label: '25 sq ft roll', qty: 25 },
        ],
      },
      {
        value: 'sq m',
        label: 'sq m — Square Meters',
        group: 'Area',
        shortName: 'sq m',
        presetQuantities: [
          { label: '1 sq m', qty: 1 },
          { label: '2 sq m', qty: 2 },
          { label: '5 sq m', qty: 5 },
          { label: '10 sq m', qty: 10 },
        ],
      },
      {
        value: 'sq in',
        label: 'sq in — Square Inches',
        group: 'Area',
        shortName: 'sq in',
        presetQuantities: [
          { label: '93.5 sq in (A4/Letter)', qty: 93.5 },
          { label: '144 sq in (1 sq ft)', qty: 144 },
          { label: '576 sq in (2x2 ft)', qty: 576 },
        ],
      },
    ],
  },
  {
    group: 'Weight',
    options: [
      {
        value: 'g',
        label: 'g — Grams',
        group: 'Weight',
        shortName: 'g',
        presetQuantities: [
          { label: '100 g', qty: 100 },
          { label: '250 g', qty: 250 },
          { label: '500 g', qty: 500 },
          { label: '1000 g (1 kg)', qty: 1000 },
        ],
      },
      {
        value: 'kg',
        label: 'kg — Kilograms',
        group: 'Weight',
        shortName: 'kg',
        presetQuantities: [
          { label: '1 kg', qty: 1 },
          { label: '2.5 kg', qty: 2.5 },
          { label: '5 kg bag', qty: 5 },
          { label: '10 kg bulk', qty: 10 },
        ],
      },
      {
        value: 'oz',
        label: 'oz — Ounces',
        group: 'Weight',
        shortName: 'oz',
        presetQuantities: [
          { label: '4 oz', qty: 4 },
          { label: '8 oz (0.5 lb)', qty: 8 },
          { label: '16 oz (1 lb)', qty: 16 },
          { label: '32 oz (2 lb)', qty: 32 },
        ],
      },
      {
        value: 'lb',
        label: 'lb — Pounds',
        group: 'Weight',
        shortName: 'lb',
        presetQuantities: [
          { label: '1 lb', qty: 1 },
          { label: '5 lb bag', qty: 5 },
          { label: '10 lb box', qty: 10 },
          { label: '25 lb bulk', qty: 25 },
        ],
      },
    ],
  },
  {
    group: 'Volume',
    options: [
      {
        value: 'ml',
        label: 'ml — Milliliters',
        group: 'Volume',
        shortName: 'ml',
        presetQuantities: [
          { label: '50 ml bottle', qty: 50 },
          { label: '250 ml', qty: 250 },
          { label: '500 ml', qty: 500 },
          { label: '1000 ml (1 L)', qty: 1000 },
        ],
      },
      {
        value: 'l',
        label: 'l — Liters',
        group: 'Volume',
        shortName: 'l',
        presetQuantities: [
          { label: '1 l', qty: 1 },
          { label: '2 l', qty: 2 },
          { label: '5 l jug', qty: 5 },
        ],
      },
      {
        value: 'fl oz',
        label: 'fl oz — Fluid Ounces',
        group: 'Volume',
        shortName: 'fl oz',
        presetQuantities: [
          { label: '2 fl oz', qty: 2 },
          { label: '8 fl oz (1 cup)', qty: 8 },
          { label: '16 fl oz (1 pt)', qty: 16 },
          { label: '32 fl oz (1 qt)', qty: 32 },
          { label: '128 fl oz (1 gal)', qty: 128 },
        ],
      },
    ],
  },
];

export const ALL_PURCHASE_UNITS: UnitOption[] = PURCHASE_UNIT_GROUPS.flatMap(
  (g) => g.options
);

export function getUnitOption(unit: PurchaseUnit): UnitOption | undefined {
  return ALL_PURCHASE_UNITS.find((u) => u.value === unit);
}

/**
 * Automatically calculates unit_cost = price_paid / purchase_qty
 */
export function calculateUnitCost(pricePaid: number, purchaseQty: number): number {
  if (!purchaseQty || purchaseQty <= 0 || isNaN(pricePaid) || isNaN(purchaseQty)) {
    return 0;
  }
  return pricePaid / purchaseQty;
}

/**
 * Automatically calculates minute_rate = hourly_rate / 60
 */
export function calculateMinuteRate(hourlyRate: number): number {
  if (!hourlyRate || hourlyRate < 0 || isNaN(hourlyRate)) {
    return 0;
  }
  return hourlyRate / 60;
}

/**
 * Computes all Product BOM line costs and totals given current catalog items
 */
export function computeProductBomTotals(
  rawMaterials: { material_id: string; qty_used: number }[],
  rawPackaging: { packaging_id: string; qty_used: number }[],
  rawLabor: { labor_id: string; minutes_spent: number }[],
  materialsCatalog: MaterialItem[],
  packagingCatalog: PackagingItem[],
  laborCatalog: LaborRateItem[]
): {
  items_materials: ProductMaterialLine[];
  items_packaging: ProductPackagingLine[];
  items_labor: ProductLaborLine[];
  total_materials_cost: number;
  total_packaging_cost: number;
  total_labor_cost: number;
  base_production_cost: number;
} {
  const items_materials: ProductMaterialLine[] = rawMaterials.map((line) => {
    const mat = materialsCatalog.find((m) => m.id === line.material_id);
    const qty = Math.max(0, Number(line.qty_used) || 0);
    const calculated_cost = mat ? qty * mat.unit_cost : 0;
    return {
      material_id: line.material_id,
      qty_used: qty,
      calculated_cost,
    };
  });

  const items_packaging: ProductPackagingLine[] = rawPackaging.map((line) => {
    const pkg = packagingCatalog.find((p) => p.id === line.packaging_id);
    const qty = Math.max(0, Number(line.qty_used) || 0);
    const calculated_cost = pkg ? qty * pkg.unit_cost : 0;
    return {
      packaging_id: line.packaging_id,
      qty_used: qty,
      calculated_cost,
    };
  });

  const items_labor: ProductLaborLine[] = rawLabor.map((line) => {
    const lab = laborCatalog.find((l) => l.id === line.labor_id);
    const mins = Math.max(0, Number(line.minutes_spent) || 0);
    const calculated_cost = lab ? (mins / 60) * lab.hourly_rate : 0;
    return {
      labor_id: line.labor_id,
      minutes_spent: mins,
      calculated_cost,
    };
  });

  const total_materials_cost = items_materials.reduce(
    (sum, item) => sum + item.calculated_cost,
    0
  );
  const total_packaging_cost = items_packaging.reduce(
    (sum, item) => sum + item.calculated_cost,
    0
  );
  const total_labor_cost = items_labor.reduce(
    (sum, item) => sum + item.calculated_cost,
    0
  );
  const base_production_cost =
    total_materials_cost + total_packaging_cost + total_labor_cost;

  return {
    items_materials,
    items_packaging,
    items_labor,
    total_materials_cost,
    total_packaging_cost,
    total_labor_cost,
    base_production_cost,
  };
}

/**
 * Evaluates a sequential PricingRule block pipeline from top to bottom
 */
export function evaluatePricingPipeline(
  blocks: PricingBlock[],
  costs: {
    materialsCost: number;
    laborCost: number;
    packagingCost: number;
  }
): PipelineEvaluationResult {
  const steps: EvaluatedBlockStep[] = [];
  let runningSubtotal = 0;
  let previousBlockAmount = 0;
  let platformFeesTotal = 0;
  let discountsTotal = 0;

  for (const block of blocks) {
    let baseReferenceValue = 0;
    let deltaAmount = 0;

    switch (block.type) {
      case 'BASE_MATERIALS': {
        baseReferenceValue = costs.materialsCost;
        deltaAmount = costs.materialsCost;
        break;
      }
      case 'BASE_LABOR': {
        baseReferenceValue = costs.laborCost;
        deltaAmount = costs.laborCost;
        break;
      }
      case 'BASE_PACKAGING': {
        baseReferenceValue = costs.packagingCost;
        deltaAmount = costs.packagingCost;
        break;
      }
      case 'PERCENT_MODIFIER': {
        const pct = Number(block.value) || 0;
        if (block.target === 'PREVIOUS_BLOCK') {
          baseReferenceValue = previousBlockAmount;
        } else if (block.target === 'BASE_MATERIALS') {
          baseReferenceValue = costs.materialsCost;
        } else {
          baseReferenceValue = runningSubtotal;
        }
        deltaAmount = baseReferenceValue * (pct / 100);

        const isFee =
          block.role === 'FEE' ||
          block.label.toLowerCase().includes('fee') ||
          block.label.toLowerCase().includes('commission');
        if (isFee && deltaAmount > 0) {
          platformFeesTotal += deltaAmount;
        }
        break;
      }
      case 'FIXED_ADD': {
        const val = Number(block.value) || 0;
        baseReferenceValue = runningSubtotal;
        deltaAmount = val;
        break;
      }
      case 'DISCOUNT': {
        const val = Math.abs(Number(block.value) || 0);
        if (block.is_percent) {
          if (block.target === 'PREVIOUS_BLOCK') {
            baseReferenceValue = previousBlockAmount;
          } else if (block.target === 'BASE_MATERIALS') {
            baseReferenceValue = costs.materialsCost;
          } else {
            baseReferenceValue = runningSubtotal;
          }
          deltaAmount = -(baseReferenceValue * (val / 100));
        } else {
          baseReferenceValue = runningSubtotal;
          deltaAmount = -val;
        }
        discountsTotal += Math.abs(deltaAmount);
        break;
      }
    }

    runningSubtotal = Math.max(0, runningSubtotal + deltaAmount);
    previousBlockAmount = Math.abs(deltaAmount);

    steps.push({
      block,
      baseReferenceValue,
      deltaAmount,
      runningSubtotal,
    });
  }

  const totalProductionCost =
    costs.materialsCost + costs.laborCost + costs.packagingCost;
  const suggestedRetailPrice = runningSubtotal;
  const netProfit =
    suggestedRetailPrice - totalProductionCost - platformFeesTotal;
  const netMarginPercent =
    suggestedRetailPrice > 0 ? (netProfit / suggestedRetailPrice) * 100 : 0;

  return {
    steps,
    totalMaterialsCost: costs.materialsCost,
    totalLaborCost: costs.laborCost,
    totalPackagingCost: costs.packagingCost,
    totalProductionCost,
    suggestedRetailPrice,
    platformFeesTotal,
    discountsTotal,
    netProfit,
    netMarginPercent,
  };
}

export interface BatchTierRow {
  qty: number;
  discountPercent: number;
  label: string;
  unitPrice: number;
  totalRevenue: number;
  unitProfit: number;
  totalProfit: number;
  marginPercent: number;
}

/**
 * Generates the Batch / Tier Simulator rows:
 * 1 unit (0%), 5 units (-5%), 10 units (-10%), 25 units (-15%)
 */
export function computeBatchTiers(
  evalResult: PipelineEvaluationResult
): BatchTierRow[] {
  const tiers = [
    { qty: 1, discountPercent: 0, label: '1 unit' },
    { qty: 5, discountPercent: 5, label: '5 units (-5%)' },
    { qty: 10, discountPercent: 10, label: '10 units (-10%)' },
    { qty: 25, discountPercent: 15, label: '25 units (-15%)' },
  ];

  // Fee ratio relative to suggested retail price so platform fees scale naturally with discounted price
  const feeRatio =
    evalResult.suggestedRetailPrice > 0
      ? evalResult.platformFeesTotal / evalResult.suggestedRetailPrice
      : 0;

  return tiers.map((t) => {
    const unitPrice =
      evalResult.suggestedRetailPrice * (1 - t.discountPercent / 100);
    const totalRevenue = unitPrice * t.qty;
    const unitFee = unitPrice * feeRatio;
    const unitProfit = unitPrice - evalResult.totalProductionCost - unitFee;
    const totalProfit = unitProfit * t.qty;
    const marginPercent = unitPrice > 0 ? (unitProfit / unitPrice) * 100 : 0;

    return {
      ...t,
      unitPrice,
      totalRevenue,
      unitProfit,
      totalProfit,
      marginPercent,
    };
  });
}

/**
 * Checks if a timestamp is older than 90 days from today
 */
export function isPriceStale(updatedAt: string | number, thresholdDays = 90): boolean {
  const days = getDaysSinceUpdate(updatedAt);
  return days > thresholdDays;
}

/**
 * Returns full integer days elapsed since updatedAt
 */
export function getDaysSinceUpdate(updatedAt: string | number): number {
  const date = new Date(updatedAt);
  if (isNaN(date.getTime())) return 0;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Formats currency cleanly. Uses up to 4 decimals when unit cost is small (e.g. $0.0045),
 * or standard 2 decimals for normal amounts (e.g. $45.00, $0.09).
 */
export function formatCurrency(value: number, allowSubCent = false): string {
  if (isNaN(value) || !isFinite(value)) return '$0.00';

  if (allowSubCent && value > 0 && value < 0.01) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(value);
  }

  const rounded2 = Math.round(value * 100) / 100;
  const diff = Math.abs(value - rounded2);
  if (allowSubCent && value < 1 && diff > 0.0005) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 3,
    }).format(value);
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formats ISO date string into readable English format (e.g., "Oct 16, 2026")
 */
export function formatDate(updatedAt: string | number): string {
  const date = new Date(updatedAt);
  if (isNaN(date.getTime())) return 'Unknown';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(value: string | undefined | null): boolean {
  if (!value) return false;
  return UUID_REGEX.test(value);
}

/**
 * Generates a valid RFC 4122 v4 UUID compatible with Supabase uuid columns
 */
export function generateId(_prefix = 'item'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

