import {
  EvaluatedBlockStep,
  PipelineEvaluationResult,
  PricingBlock,
} from '../types/pricing';

/**
 * Standard 2-decimal cent rounding
 */
export function roundToCent(value: number): number {
  if (!isFinite(value) || isNaN(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Rounds UP to the next cent ($0.01) so target profit or target net margin
 * never falls below the user's selected threshold due to standard rounding.
 */
export function ceilToCent(value: number): number {
  if (!isFinite(value) || isNaN(value) || value <= 0) return 0;
  return Math.ceil(Math.max(0, value * 100 - 1e-7)) / 100;
}

/**
 * Determines whether a PricingBlock represents a Marketplace / Selling Fee
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
  return (
    lower.includes('fee') ||
    lower.includes('commission') ||
    lower.includes('transaction') ||
    lower.includes('processing') ||
    lower.includes('regulatory')
  );
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

/**
 * Determines whether a Fixed Fee ($) block applies once per order transaction ('PER_ORDER')
 * or per unit sold ('PER_ITEM').
 * Payment processing fixed fees ($0.25) default to 'PER_ORDER'.
 */
export function getFixedFeeScope(
  block: PricingBlock
): 'PER_ORDER' | 'PER_ITEM' {
  if (block.fee_scope === 'PER_ITEM' || block.fee_scope === 'PER_ORDER') {
    return block.fee_scope;
  }
  const lower = (block.label || '').toLowerCase();
  if (lower.includes('per item') || lower.includes('listing')) {
    return 'PER_ORDER';
  }
  return 'PER_ORDER';
}

/**
 * Generalized Gross-Up Formula:
 * SellingPrice = (TotalCosts + DesiredProfit + FixedFees) / (1 - TotalPercentageFees)
 * Rounds UP to the next cent if standard rounding would cause achieved profit to fall below DesiredProfit when fixed fees or strict targets are present.
 */
export function calculateGrossUpSellingPrice(params: {
  totalCosts: number;
  desiredProfit: number;
  fixedFees: number;
  totalPercentageFees: number; // decimal, e.g. 0.105 for 10.5%
  strictProfitProtection?: boolean;
}): {
  sellingPrice: number;
  rawSellingPrice: number;
  estimatedSellingFees: number;
  revenueAfterFees: number;
  estimatedNetProfit: number;
  estimatedNetMarginPercent: number;
  isUnachievable: boolean;
} {
  const totalCosts = Math.max(0, Number(params.totalCosts) || 0);
  const desiredProfit = Number(params.desiredProfit) || 0;
  const fixedFees = Math.max(0, Number(params.fixedFees) || 0);
  const pctRate = Math.max(0, Number(params.totalPercentageFees) || 0);

  if (pctRate >= 1.0) {
    const fallbackPrice = roundToCent(totalCosts + desiredProfit + fixedFees);
    return {
      sellingPrice: fallbackPrice,
      rawSellingPrice: fallbackPrice,
      estimatedSellingFees: roundToCent(fallbackPrice + fixedFees),
      revenueAfterFees: 0,
      estimatedNetProfit: -totalCosts,
      estimatedNetMarginPercent: -100,
      isUnachievable: true,
    };
  }

  const numerator = Math.max(0, totalCosts + desiredProfit + fixedFees);
  const rawSellingPrice = pctRate > 0 ? numerator / (1 - pctRate) : numerator;

  const standardPrice = roundToCent(rawSellingPrice);
  const exactProfitAtStandard =
    standardPrice * (1 - pctRate) - fixedFees - totalCosts;

  const shouldCeil =
    (params.strictProfitProtection || fixedFees > 0) &&
    exactProfitAtStandard < desiredProfit - 1e-4;

  const sellingPrice = shouldCeil
    ? ceilToCent(rawSellingPrice)
    : standardPrice;

  const estimatedSellingFees = roundToCent(
    sellingPrice * pctRate + fixedFees
  );
  const revenueAfterFees = roundToCent(sellingPrice - estimatedSellingFees);
  const estimatedNetProfit = roundToCent(revenueAfterFees - totalCosts);
  const estimatedNetMarginPercent =
    sellingPrice > 0 ? (estimatedNetProfit / sellingPrice) * 100 : 0;

  return {
    sellingPrice,
    rawSellingPrice,
    estimatedSellingFees,
    revenueAfterFees,
    estimatedNetProfit,
    estimatedNetMarginPercent,
    isUnachievable: false,
  };
}

/**
 * Accurate Target Net Margin Formula:
 * SellingPrice = (TotalProductionCosts + FixedFees) / (1 - TotalPercentageFees - M_net)
 * Always rounds the final suggested selling price UP to the next cent ($0.01)
 * if standard rounding would cause the achieved net margin to fall below the selected target.
 */
export function calculateTargetNetMarginPrice(params: {
  totalProductionCosts: number;
  fixedFees: number;
  totalPercentageFees: number; // decimal, e.g. 0.10 for 10%
  targetNetMargin: number; // decimal, e.g. 0.32 for 32%
}): {
  sellingPrice: number;
  rawSellingPrice: number;
  estimatedSellingFees: number;
  revenueAfterFees: number;
  estimatedNetProfit: number;
  estimatedNetMarginPercent: number;
  requiredProfitDollar: number;
  requiredMarkupPercent: number;
  isUnachievable: boolean;
} {
  const costs = Math.max(0, Number(params.totalProductionCosts) || 0);
  const fixedFees = Math.max(0, Number(params.fixedFees) || 0);
  const pctFees = Math.max(0, Number(params.totalPercentageFees) || 0);
  const mNet = Math.max(0, Number(params.targetNetMargin) || 0);

  if (pctFees + mNet >= 1.0) {
    const safeDenom = 0.01;
    const clampedPrice = ceilToCent((costs + fixedFees) / safeDenom);
    const fees = roundToCent(clampedPrice * Math.min(0.99, pctFees) + fixedFees);
    const rev = roundToCent(clampedPrice - fees);
    const profit = roundToCent(rev - costs);
    const margin = clampedPrice > 0 ? (profit / clampedPrice) * 100 : 0;
    return {
      sellingPrice: clampedPrice,
      rawSellingPrice: clampedPrice,
      estimatedSellingFees: fees,
      revenueAfterFees: rev,
      estimatedNetProfit: profit,
      estimatedNetMarginPercent: margin,
      requiredProfitDollar: Math.max(0, profit),
      requiredMarkupPercent: costs > 0 ? (Math.max(0, profit) / costs) * 100 : 0,
      isUnachievable: true,
    };
  }

  const denom = 1 - pctFees - mNet;
  const rawSellingPrice = (costs + fixedFees) / denom;
  const standardPrice = roundToCent(rawSellingPrice);

  // Check if standard rounding causes achieved net margin to fall below M_net
  const exactProfitAtStd = standardPrice * (1 - pctFees) - fixedFees - costs;
  const exactMarginAtStd =
    standardPrice > 0 ? exactProfitAtStd / standardPrice : 0;

  const stdFeesRounded = roundToCent(standardPrice * pctFees + fixedFees);
  const stdRevRounded = roundToCent(standardPrice - stdFeesRounded);
  const stdProfitRounded = roundToCent(stdRevRounded - costs);
  const stdMarginRounded =
    standardPrice > 0 ? stdProfitRounded / standardPrice : 0;

  const sellingPrice =
    exactMarginAtStd < mNet - 1e-6 || stdMarginRounded < mNet - 1e-6
      ? ceilToCent(rawSellingPrice)
      : standardPrice;

  const estimatedSellingFees = roundToCent(sellingPrice * pctFees + fixedFees);
  const revenueAfterFees = roundToCent(sellingPrice - estimatedSellingFees);
  const estimatedNetProfit = roundToCent(revenueAfterFees - costs);
  const estimatedNetMarginPercent =
    sellingPrice > 0 ? (estimatedNetProfit / sellingPrice) * 100 : 0;

  // Required operational profit before percentage fees so C / (1 - pctFees) reaches sellingPrice
  const requiredProfitDollar = Math.max(
    0,
    sellingPrice * (1 - pctFees) - fixedFees - costs
  );
  const requiredMarkupPercent =
    costs > 0 ? (requiredProfitDollar / costs) * 100 : 0;

  return {
    sellingPrice,
    rawSellingPrice,
    estimatedSellingFees,
    revenueAfterFees,
    estimatedNetProfit,
    estimatedNetMarginPercent,
    requiredProfitDollar,
    requiredMarkupPercent,
    isUnachievable: false,
  };
}

/**
 * Evaluates a PricingRule block pipeline using the Generalized Gross-up Method:
 * - SellingPrice = (TotalCosts + DesiredProfit + FixedFees) / (1 - TotalPercentageFees)
 * - If a Markup step has auto_target_margin set, uses the exact Target Net Margin formula:
 *   SellingPrice = (TotalProductionCosts + FixedFees) / (1 - TotalPercentageFees - M_net)
 */
export function evaluatePricingPipeline(
  blocks: PricingBlock[],
  costs: {
    materialsCost: number;
    laborCost: number;
    packagingCost: number;
  }
): PipelineEvaluationResult {
  let runningC = 0;
  let previousBlockAmount = 0;
  let extraCostsTotal = 0;
  let markupTotal = 0;
  let fixedFeesTotal = 0;
  let fixedFeesPerOrderTotal = 0;
  let fixedFeesPerItemTotal = 0;
  let discountsTotal = 0;
  let totalFeePercent = 0;
  let autoTargetMarginPercent: number | undefined = undefined;

  const preCalculatedDeltas: {
    baseReferenceValue: number;
    deltaAmount: number;
    isPctFee: boolean;
    pctFeeValue: number;
    isMarkup: boolean;
  }[] = [];

  for (const block of blocks) {
    let baseReferenceValue = 0;
    let deltaAmount = 0;
    let isPctFee = false;
    let pctFeeValue = 0;
    let isMarkup = false;

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
        if (block.fee_scope === 'PER_ITEM') {
          fixedFeesPerItemTotal += val;
        } else {
          fixedFeesPerOrderTotal += val;
        }
        runningC = Math.max(0, runningC + deltaAmount);
        previousBlockAmount = Math.abs(deltaAmount);
      }
    } else if (block.type === 'PERCENT_MODIFIER') {
      // Operational Profit Markup % on accumulated cost
      isMarkup = true;
      if (typeof block.auto_target_margin === 'number') {
        autoTargetMarginPercent = block.auto_target_margin;
      }
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
      isMarkup,
    });
  }

  const totalProductionCost = roundToCent(
    costs.materialsCost + costs.laborCost + costs.packagingCost
  );
  const directCostsTotal = roundToCent(totalProductionCost + extraCostsTotal);
  const percentageFeesRate = Math.max(0, totalFeePercent / 100);

  let suggestedRetailPrice = 0;
  let isMarginUnachievable = false;

  if (
    typeof autoTargetMarginPercent === 'number' &&
    discountsTotal === 0
  ) {
    const targetRes = calculateTargetNetMarginPrice({
      totalProductionCosts: directCostsTotal,
      fixedFees: fixedFeesTotal,
      totalPercentageFees: percentageFeesRate,
      targetNetMargin: autoTargetMarginPercent / 100,
    });
    suggestedRetailPrice = targetRes.sellingPrice;
    isMarginUnachievable = targetRes.isUnachievable;
  } else {
    const desiredNetMarkup = markupTotal - discountsTotal;
    const grossRes = calculateGrossUpSellingPrice({
      totalCosts: directCostsTotal,
      desiredProfit: desiredNetMarkup,
      fixedFees: fixedFeesTotal,
      totalPercentageFees: percentageFeesRate,
    });
    suggestedRetailPrice = grossRes.sellingPrice;
    isMarginUnachievable = grossRes.isUnachievable;
  }

  const subtotalBeforePercentFees = Math.max(0, runningC);
  const percentageFeesTotal = suggestedRetailPrice * percentageFeesRate;
  const platformFeesTotal = roundToCent(percentageFeesTotal + fixedFeesTotal);
  const netRevenue = roundToCent(suggestedRetailPrice - platformFeesTotal);
  const netProfit = roundToCent(netRevenue - directCostsTotal);
  const netMarginPercent =
    suggestedRetailPrice > 0 ? (netProfit / suggestedRetailPrice) * 100 : 0;

  // Build step-by-step breakdown trace
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
    fixedFeesPerOrderTotal,
    fixedFeesPerItemTotal,
    suggestedRetailPrice,
    platformFeesTotal,
    netRevenue,
    discountsTotal,
    netProfit,
    netMarginPercent,
    isMarginUnachievable,
  };
}

export interface BatchTierRow {
  qty: number;
  discountPercent: number;
  label: string;
  unitPrice: number;
  totalRevenue: number; // Displayed Order Total = Displayed Unit Price * Quantity
  orderFeesTotal: number;
  orderProductionCosts: number;
  unitProfit: number;
  totalProfit: number; // Estimated Profit
  marginPercent: number; // Profit Margin %
  warningState: 'NEGATIVE' | 'LOW_MARGIN' | null;
}

/**
 * Generates the Bulk Pricing & Profit Estimates rows:
 * - Bulk discounts apply to the Selling Price, not to production costs.
 * - Per-item costs scale directly with quantity.
 * - Fixed per-order fees (like the $0.25 processing fee) apply ONCE per order transaction, not multiplied by item quantity.
 * - Percentage fees apply to the order subtotal after bulk discount.
 * - Guarantees: Displayed Unit Price * Quantity = Displayed Order Total.
 */
export function computeBatchTiers(
  evalResult: PipelineEvaluationResult
): BatchTierRow[] {
  const tiers = [
    { qty: 1, discountPercent: 0, label: '1 unit' },
    { qty: 5, discountPercent: 5, label: '5 units' },
    { qty: 10, discountPercent: 10, label: '10 units' },
    { qty: 25, discountPercent: 15, label: '25 units' },
  ];

  const baseSellingPrice = roundToCent(evalResult.suggestedRetailPrice);

  return tiers.map((t) => {
    const unitPrice = roundToCent(
      baseSellingPrice * (1 - t.discountPercent / 100)
    );
    // Strict guarantee: Displayed Unit Price * Quantity = Displayed Order Total
    const totalRevenue = roundToCent(unitPrice * t.qty);

    // Per-item production costs scale directly with quantity
    const orderProductionCosts = roundToCent(
      evalResult.directCostsTotal * t.qty
    );

    // Percentage fees apply to the order subtotal after bulk discount;
    // Fixed per-order fees apply once per order transaction; per-item fixed fees scale with qty.
    const orderPercentageFees = totalRevenue * evalResult.percentageFeesRate;
    const orderFixedFees =
      evalResult.fixedFeesPerOrderTotal +
      evalResult.fixedFeesPerItemTotal * t.qty;
    const orderFeesTotal = roundToCent(orderPercentageFees + orderFixedFees);

    const orderRevenueAfterFees = roundToCent(totalRevenue - orderFeesTotal);
    const totalProfit = roundToCent(
      orderRevenueAfterFees - orderProductionCosts
    );
    const unitProfit = t.qty > 0 ? roundToCent(totalProfit / t.qty) : 0;
    const marginPercent =
      totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    let warningState: 'NEGATIVE' | 'LOW_MARGIN' | null = null;
    if (totalProfit < 0 || marginPercent < 0) {
      warningState = 'NEGATIVE';
    } else if (marginPercent < 10) {
      warningState = 'LOW_MARGIN';
    }

    return {
      ...t,
      unitPrice,
      totalRevenue,
      orderFeesTotal,
      orderProductionCosts,
      unitProfit,
      totalProfit,
      marginPercent,
      warningState,
    };
  });
}

/**
 * Verification Suite for the 4 Required Mathematical Benchmarks (Tests A, B, C, D)
 */
export function runPricingEngineVerificationSuite(): {
  passed: boolean;
  results: { name: string; passed: boolean; details: string }[];
} {
  const results: { name: string; passed: boolean; details: string }[] = [];

  // Test A (Base Markup & Fees):
  // Materials $0.18, Labor $6.25, Markup 60.8%, Packaging $0.60, Fee 10.5% -> Selling Price ~CA$12.22, Profit ~CA$3.91, Margin ~32%.
  const testABlocks: PricingBlock[] = [
    { id: 'a1', type: 'BASE_MATERIALS', label: 'Materials Cost' },
    { id: 'a2', type: 'BASE_LABOR', label: 'Labor Cost' },
    {
      id: 'a3',
      type: 'PERCENT_MODIFIER',
      label: 'Profit Markup',
      value: 60.8,
      target: 'RUNNING_SUBTOTAL',
      role: 'MARKUP',
    },
    { id: 'a4', type: 'BASE_PACKAGING', label: 'Packaging Cost' },
    {
      id: 'a5',
      type: 'PERCENT_MODIFIER',
      label: 'Etsy Selling Fees',
      value: 10.5,
      is_percent: true,
      role: 'FEE',
    },
  ];
  const evalA = evaluatePricingPipeline(testABlocks, {
    materialsCost: 0.18,
    laborCost: 6.25,
    packagingCost: 0.6,
  });
  const passA =
    Math.abs(evalA.suggestedRetailPrice - 12.22) <= 0.01 &&
    Math.abs(evalA.netProfit - 3.91) <= 0.01 &&
    Math.abs(Math.round(evalA.netMarginPercent) - 32) <= 1;
  results.push({
    name: 'Test A (Base Markup & Fees)',
    passed: passA,
    details: `Selling Price: $${evalA.suggestedRetailPrice.toFixed(2)} (expected ~$12.22), Profit: $${evalA.netProfit.toFixed(2)} (expected ~$3.91), Margin: ${evalA.netMarginPercent.toFixed(1)}% (expected ~32%)`,
  });

  // Test B (Fixed Fee Gross-up):
  // Costs $7.03, Target Profit $3.91, Fee 10%, Fixed Fee $0.25 -> Selling Price CA$12.44.
  const evalB = calculateGrossUpSellingPrice({
    totalCosts: 7.03,
    desiredProfit: 3.91,
    fixedFees: 0.25,
    totalPercentageFees: 0.1,
    strictProfitProtection: true,
  });
  const passB = evalB.sellingPrice === 12.44;
  results.push({
    name: 'Test B (Fixed Fee Gross-up)',
    passed: passB,
    details: `Selling Price: $${evalB.sellingPrice.toFixed(2)} (expected $12.44)`,
  });

  // Test C (Target Margin with Fixed Fee):
  // Costs $7.03, Target Margin 32%, Fee 10%, Fixed Fee $0.25 -> Suggested Selling Price CA$12.56.
  const evalC = calculateTargetNetMarginPrice({
    totalProductionCosts: 7.03,
    fixedFees: 0.25,
    totalPercentageFees: 0.1,
    targetNetMargin: 0.32,
  });
  const passC = evalC.sellingPrice === 12.56;
  results.push({
    name: 'Test C (Target Margin with Fixed Fee)',
    passed: passC,
    details: `Suggested Selling Price: $${evalC.sellingPrice.toFixed(2)} (expected $12.56), Achieved Margin: ${evalC.estimatedNetMarginPercent.toFixed(2)}%`,
  });

  // Test D (Bulk Scale):
  // 5 units in 1 order only applies the $0.25 fixed payment fee once for the whole order, scaling item materials and labor by 5.
  const testDBlocks: PricingBlock[] = [
    { id: 'd1', type: 'BASE_MATERIALS', label: 'Materials Cost' },
    { id: 'd2', type: 'BASE_LABOR', label: 'Labor Cost' },
    { id: 'd3', type: 'BASE_PACKAGING', label: 'Packaging Cost' },
    {
      id: 'd4',
      type: 'PERCENT_MODIFIER',
      label: 'Profit Markup',
      value: 50,
      target: 'RUNNING_SUBTOTAL',
      role: 'MARKUP',
    },
    {
      id: 'd5',
      type: 'PERCENT_MODIFIER',
      label: 'Etsy Percentage Fees',
      value: 10,
      is_percent: true,
      role: 'FEE',
    },
    {
      id: 'd6',
      type: 'FIXED_ADD',
      label: 'Payment Processing Fixed Fee',
      value: 0.25,
      is_percent: false,
      role: 'FEE',
      fee_scope: 'PER_ORDER',
    },
  ];
  const evalD = evaluatePricingPipeline(testDBlocks, {
    materialsCost: 0.18,
    laborCost: 6.25,
    packagingCost: 0.6,
  });
  const tiersD = computeBatchTiers(evalD);
  const tier5 = tiersD.find((t) => t.qty === 5)!;
  const expectedOrderTotal5 = roundToCent(tier5.unitPrice * 5);
  const expectedProductionCosts5 = roundToCent(7.03 * 5);
  const expectedOrderFees5 = roundToCent(expectedOrderTotal5 * 0.1 + 0.25); // $0.25 applied ONCE!
  const passD =
    tier5.totalRevenue === expectedOrderTotal5 &&
    tier5.orderProductionCosts === expectedProductionCosts5 &&
    tier5.orderFeesTotal === expectedOrderFees5;
  results.push({
    name: 'Test D (Bulk Scale)',
    passed: passD,
    details: `5-unit Order Total: $${tier5.totalRevenue.toFixed(2)} (${tier5.unitPrice.toFixed(2)} * 5), Order Production Costs: $${tier5.orderProductionCosts.toFixed(2)} ($7.03 * 5), Order Fees: $${tier5.orderFeesTotal.toFixed(2)} (10% of order + $0.25 once)`,
  });

  return {
    passed: results.every((r) => r.passed),
    results,
  };
}
