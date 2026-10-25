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
 * Determines whether a PricingBlock represents a Marketplace / Platform Fee
 * (either Percentage Fee % or Fixed Fee $).
 */
export function isFeeBlock(block: PricingBlock): boolean {
  if (
    block.type === 'BASE_MATERIALS' ||
    block.type === 'BASE_LABOR' ||
    block.type === 'BASE_PACKAGING' ||
    block.type === 'DISCOUNT'
  ) {
    return false;
  }
  if (block.role === 'FEE') return true;
  if (
    block.role === 'MARKUP' ||
    block.role === 'MARGIN' ||
    block.role === 'OVERHEAD'
  ) {
    return false;
  }
  const lower = (block.label || '').toLowerCase();
  return lower.includes('fee') || lower.includes('commission');
}

/**
 * Determines whether a Fee PricingBlock is a Percentage Fee (%) vs. Fixed Fee ($).
 * Defaults to true for legacy PERCENT_MODIFIER fee blocks where is_percent is undefined.
 */
export function isPercentFeeBlock(block: PricingBlock): boolean {
  if (!isFeeBlock(block)) return false;
  if (typeof block.is_percent === 'boolean') {
    return block.is_percent;
  }
  return block.type === 'PERCENT_MODIFIER';
}

export function formatBlockPillLabel(block: PricingBlock): string {
  if (block.type === 'BASE_MATERIALS') return 'Materials';
  if (block.type === 'BASE_LABOR') return 'Labor';
  if (block.type === 'BASE_PACKAGING') return 'Packaging';
  if (isFeeBlock(block)) {
    const val = block.value ?? 0;
    if (isPercentFeeBlock(block)) {
      const cleanLabel = block.label
        .replace(/^Platform Fee\s*\((.*)\)$/i, '$1 Fee')
        .trim();
      return `+${val}% ${cleanLabel || 'Fee'}`;
    }
    return `+${formatCurrency(val)} ${block.label || 'Fixed Fee'}`;
  }
  if (block.type === 'PERCENT_MODIFIER') {
    const val = block.value ?? 0;
    const cleanLabel = block.label
      .replace(/^Profit\s+/i, '')
      .replace(/\bMargin\b/gi, 'Markup')
      .replace(/%/g, '')
      .trim();
    return `+${val}% ${cleanLabel || 'Markup'}`;
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
}

/**
 * Evaluates a PricingRule block pipeline using the Gross-up Method for Marketplace Fees:
 * - Subtotal C = (Materials + Packaging + Labor + Markup + Extra $ + Fixed Fees $ - Discounts)
 * - Total Fee Percentage = F_pct (decimal, e.g. 0.10 for 10%)
 * - Final Retail Price = C / (1 - F_pct)
 * - Deducted Marketplace Fees = Final Retail Price * F_pct + Fixed Fees
 * - Net Revenue = Final Retail Price - Deducted Marketplace Fees
 * - Direct Costs = Materials + Packaging + Labor + Extra $
 * - Net Profit = Net Revenue - Direct Costs
 * - Net Margin % = ((Net Revenue - Direct Costs) / Final Retail Price) * 100
 */
export function evaluatePricingPipeline(
  blocks: PricingBlock[],
  costs: {
    materialsCost: number;
    laborCost: number;
    packagingCost: number;
  }
): PipelineEvaluationResult {
  // Pass 1: Compute Subtotal C across all non-percentage-fee blocks and sum F_pct
  let runningC = 0;
  let previousBlockAmount = 0;
  let extraCostsTotal = 0;
  let markupTotal = 0;
  let fixedFeesTotal = 0;
  let discountsTotal = 0;
  let totalFeePercent = 0;

  const preCalculatedDeltas: {
    baseReferenceValue: number;
    deltaAmount: number;
    isPctFee: boolean;
    pctFeeValue: number;
  }[] = [];

  for (const block of blocks) {
    let baseReferenceValue = 0;
    let deltaAmount = 0;
    let isPctFee = false;
    let pctFeeValue = 0;

    if (block.type === 'BASE_MATERIALS') {
      baseReferenceValue = costs.materialsCost;
      deltaAmount = costs.materialsCost;
      runningC += deltaAmount;
      previousBlockAmount = Math.abs(deltaAmount);
    } else if (block.type === 'BASE_LABOR') {
      baseReferenceValue = costs.laborCost;
      deltaAmount = costs.laborCost;
      runningC += deltaAmount;
      previousBlockAmount = Math.abs(deltaAmount);
    } else if (block.type === 'BASE_PACKAGING') {
      baseReferenceValue = costs.packagingCost;
      deltaAmount = costs.packagingCost;
      runningC += deltaAmount;
      previousBlockAmount = Math.abs(deltaAmount);
    } else if (isFeeBlock(block)) {
      const val = Math.max(0, Number(block.value) || 0);
      if (isPercentFeeBlock(block)) {
        isPctFee = true;
        pctFeeValue = val;
        totalFeePercent += val;
      } else {
        // Fixed Fee ($)
        baseReferenceValue = runningC;
        deltaAmount = val;
        fixedFeesTotal += val;
        runningC = Math.max(0, runningC + deltaAmount);
        previousBlockAmount = Math.abs(deltaAmount);
      }
    } else if (block.type === 'PERCENT_MODIFIER') {
      // Operational Markup % on accumulated cost
      const pct = Number(block.value) || 0;
      if (block.target === 'PREVIOUS_BLOCK') {
        baseReferenceValue = previousBlockAmount;
      } else if (block.target === 'BASE_MATERIALS') {
        baseReferenceValue = costs.materialsCost;
      } else {
        baseReferenceValue = runningC;
      }
      deltaAmount = baseReferenceValue * (pct / 100);
      markupTotal += deltaAmount;
      runningC = Math.max(0, runningC + deltaAmount);
      previousBlockAmount = Math.abs(deltaAmount);
    } else if (block.type === 'FIXED_ADD') {
      // Extra $ cost / buffer
      const val = Number(block.value) || 0;
      baseReferenceValue = runningC;
      deltaAmount = val;
      extraCostsTotal += val;
      runningC = Math.max(0, runningC + deltaAmount);
      previousBlockAmount = Math.abs(deltaAmount);
    } else if (block.type === 'DISCOUNT') {
      const val = Math.abs(Number(block.value) || 0);
      if (block.is_percent) {
        if (block.target === 'PREVIOUS_BLOCK') {
          baseReferenceValue = previousBlockAmount;
        } else if (block.target === 'BASE_MATERIALS') {
          baseReferenceValue = costs.materialsCost;
        } else {
          baseReferenceValue = runningC;
        }
        deltaAmount = -(baseReferenceValue * (val / 100));
      } else {
        baseReferenceValue = runningC;
        deltaAmount = -val;
      }
      discountsTotal += Math.abs(deltaAmount);
      runningC = Math.max(0, runningC + deltaAmount);
      previousBlockAmount = Math.abs(deltaAmount);
    }

    preCalculatedDeltas.push({
      baseReferenceValue,
      deltaAmount,
      isPctFee,
      pctFeeValue,
    });
  }

  const subtotalBeforePercentFees = Math.max(0, runningC);
  // Clamp F_pct to < 0.99 to prevent division by zero
  const percentageFeesRate = Math.min(
    0.99,
    Math.max(0, totalFeePercent / 100)
  );
  const suggestedRetailPrice =
    percentageFeesRate > 0
      ? subtotalBeforePercentFees / (1 - percentageFeesRate)
      : subtotalBeforePercentFees;

  const percentageFeesTotal = suggestedRetailPrice * percentageFeesRate;
  const platformFeesTotal = percentageFeesTotal + fixedFeesTotal;

  // Pass 2: Build step-by-step trace where percentage fees reflect their exact grossed-up cut
  const steps: EvaluatedBlockStep[] = [];
  let stepRunningSubtotal = 0;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const info = preCalculatedDeltas[i];
    const baseReferenceValue = info.isPctFee
      ? suggestedRetailPrice
      : info.baseReferenceValue;
    const deltaAmount = info.isPctFee
      ? suggestedRetailPrice * (info.pctFeeValue / 100)
      : info.deltaAmount;

    stepRunningSubtotal = Math.max(0, stepRunningSubtotal + deltaAmount);

    steps.push({
      block,
      baseReferenceValue,
      deltaAmount,
      runningSubtotal: stepRunningSubtotal,
    });
  }

  const totalProductionCost =
    costs.materialsCost + costs.laborCost + costs.packagingCost;
  const directCostsTotal = totalProductionCost + extraCostsTotal;
  const netRevenue = suggestedRetailPrice - platformFeesTotal;
  const netProfit = netRevenue - directCostsTotal;
  const netMarginPercent =
    suggestedRetailPrice > 0 ? (netProfit / suggestedRetailPrice) * 100 : 0;

  return {
    steps,
    totalMaterialsCost: costs.materialsCost,
    totalLaborCost: costs.laborCost,
    totalPackagingCost: costs.packagingCost,
    totalProductionCost,
    extraCostsTotal,
    directCostsTotal,
    markupTotal,
    subtotalBeforePercentFees,
    percentageFeesRate,
    percentageFeesTotal,
    fixedFeesTotal,
    suggestedRetailPrice,
    platformFeesTotal,
    netRevenue,
    discountsTotal,
    netProfit,
    netMarginPercent,
  };
}

export interface TargetMarginSimulationResult {
  targetMarginPercent: number;
  suggestedRetailPrice: number;
  deductedMarketplaceFees: number;
  percentageFeesTotal: number;
  fixedFeesTotal: number;
  netRevenue: number;
  directCostsTotal: number;
  netProfit: number;
  resultingMarginPercent: number;
  equivalentMarkupPercent: number;
}

/**
 * Computes the Suggested Retail Price, Marketplace Fees, Net Revenue, Net Profit,
 * and equivalent Markup % needed to achieve a Target Net Profit Margin (10% - 80%).
 */
export function evaluateTargetMarginSimulation(
  evalResult: PipelineEvaluationResult,
  targetMarginPercent: number
): TargetMarginSimulationResult {
  const clampedTarget = Math.min(80, Math.max(10, targetMarginPercent));
  const m = clampedTarget / 100;
  const fPct = evalResult.percentageFeesRate;
  const dCost = evalResult.directCostsTotal;
  const fFixed = evalResult.fixedFeesTotal;

  // P * (1 - F_pct - m) = DirectCosts + FixedFees
  const denom = Math.max(0.01, 1 - fPct - m);
  const suggestedRetailPrice = (dCost + fFixed) / denom;
  const percentageFeesTotal = suggestedRetailPrice * fPct;
  const deductedMarketplaceFees = percentageFeesTotal + fFixed;
  const netRevenue = suggestedRetailPrice - deductedMarketplaceFees;
  const netProfit = netRevenue - dCost;
  const resultingMarginPercent =
    suggestedRetailPrice > 0 ? (netProfit / suggestedRetailPrice) * 100 : 0;
  const equivalentMarkupPercent =
    dCost > 0 ? (Math.max(0, netProfit) / dCost) * 100 : 0;

  return {
    targetMarginPercent: clampedTarget,
    suggestedRetailPrice,
    deductedMarketplaceFees,
    percentageFeesTotal,
    fixedFeesTotal: fFixed,
    netRevenue,
    directCostsTotal: dCost,
    netProfit,
    resultingMarginPercent,
    equivalentMarkupPercent,
  };
}

/**
 * Updates the Markup % step in a PricingBlock[] array so that the pipeline
 * achieves the specified targetMarginPercent (10% - 80%).
 */
export function applyTargetMarginToBlocks(
  blocks: PricingBlock[],
  costs: {
    materialsCost: number;
    laborCost: number;
    packagingCost: number;
  },
  targetMarginPercent: number
): PricingBlock[] {
  const currentEval = evaluatePricingPipeline(blocks, costs);
  const sim = evaluateTargetMarginSimulation(currentEval, targetMarginPercent);
  const desiredMarkupDollar = Math.max(
    0,
    sim.netProfit + currentEval.discountsTotal
  );

  const markupIdx = blocks.findIndex(
    (b) => b.type === 'PERCENT_MODIFIER' && !isFeeBlock(b)
  );

  if (markupIdx !== -1) {
    const stepInfo = currentEval.steps[markupIdx];
    const baseRef =
      stepInfo && stepInfo.baseReferenceValue > 0
        ? stepInfo.baseReferenceValue
        : currentEval.directCostsTotal;
    const newMarkupPct =
      baseRef > 0
        ? Math.max(0, Number(((desiredMarkupDollar / baseRef) * 100).toFixed(1)))
        : 50;

    return blocks.map((b, idx) =>
      idx === markupIdx ? { ...b, value: newMarkupPct } : b
    );
  }

  // If no Markup block exists, insert one before any Fee blocks
  const baseRef =
    currentEval.directCostsTotal > 0 ? currentEval.directCostsTotal : 1;
  const newMarkupPct = Math.max(
    0,
    Number(((desiredMarkupDollar / baseRef) * 100).toFixed(1))
  );
  const newMarkupBlock: PricingBlock = {
    id: generateId('blk'),
    type: 'PERCENT_MODIFIER',
    label: 'Markup %',
    value: newMarkupPct,
    target: 'RUNNING_SUBTOTAL',
    role: 'MARKUP',
  };

  const firstFeeIdx = blocks.findIndex((b) => isFeeBlock(b));
  if (firstFeeIdx === -1) {
    return [...blocks, newMarkupBlock];
  }
  const next = [...blocks];
  next.splice(firstFeeIdx, 0, newMarkupBlock);
  return next;
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

  return tiers.map((t) => {
    const unitPrice =
      evalResult.suggestedRetailPrice * (1 - t.discountPercent / 100);
    const totalRevenue = unitPrice * t.qty;
    const unitFee =
      unitPrice * evalResult.percentageFeesRate + evalResult.fixedFeesTotal;
    const unitNetRevenue = unitPrice - unitFee;
    const unitProfit = unitNetRevenue - evalResult.directCostsTotal;
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

