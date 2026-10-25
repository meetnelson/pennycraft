export type PurchaseUnit =
  // Count / Pieces
  | 'un'
  | 'pack'
  | 'pair'
  // Linear
  | 'cm'
  | 'm'
  | 'in'
  | 'ft'
  | 'yd'
  // Area
  | 'sq ft'
  | 'sq m'
  | 'sq in'
  // Weight
  | 'g'
  | 'kg'
  | 'oz'
  | 'lb'
  // Volume
  | 'ml'
  | 'l'
  | 'fl oz';

export type MaterialUnit = PurchaseUnit;
export type PackagingUnit = PurchaseUnit;

export type AttentionType = 'Exclusive / Focused' | 'Batch / Passive';

export type ActiveTab = 'products' | 'rules' | 'materials' | 'packaging' | 'labor';

export type ModalEntityType = 'materials' | 'packaging' | 'labor';

export interface MaterialItem {
  id: string;
  name: string;
  category: string;
  purchase_unit: MaterialUnit;
  purchase_qty: number;
  price_paid: number;
  unit_cost: number; // price_paid / purchase_qty
  supplier_url?: string;
  updated_at: string; // ISO timestamp
}

export interface PackagingItem {
  id: string;
  name: string;
  category: string;
  purchase_unit: PackagingUnit;
  purchase_qty: number;
  price_paid: number;
  unit_cost: number; // price_paid / purchase_qty
  supplier_url?: string;
  updated_at: string; // ISO timestamp
}

export interface LaborRateItem {
  id: string;
  name: string;
  attention_type: AttentionType;
  hourly_rate: number;
  minute_rate: number; // hourly_rate / 60
  updated_at?: string;
}

// --- PRODUCT BOM ENTITIES ---

export interface ProductMaterialLine {
  material_id: string;
  qty_used: number;
  calculated_cost: number; // qty_used * material.unit_cost
}

export interface ProductPackagingLine {
  packaging_id: string;
  qty_used: number;
  calculated_cost: number; // qty_used * packaging.unit_cost
}

export interface ProductLaborLine {
  labor_id: string;
  minutes_spent: number;
  calculated_cost: number; // (minutes_spent / 60) * labor.hourly_rate
}

export interface ProductItem {
  id: string;
  name: string;
  category: string;
  default_rule_id?: string;
  items_materials: ProductMaterialLine[];
  items_packaging: ProductPackagingLine[];
  items_labor: ProductLaborLine[];
  total_materials_cost: number;
  total_packaging_cost: number;
  total_labor_cost: number;
  base_production_cost: number;
  updated_at: string;
  // Cascade impact fields
  price_stale_flag?: boolean;
  affected_by_names?: string[];
  previous_base_cost?: number;
}

export interface CascadeAlert {
  id: string;
  item_id: string;
  item_name: string;
  item_type: 'Material' | 'Packaging';
  affected_product_ids: string[];
  timestamp: string;
}

// --- PHASE 3: MODULAR PRICING RULE PIPELINE ---

export type PricingBlockType =
  | 'BASE_MATERIALS'
  | 'BASE_LABOR'
  | 'BASE_PACKAGING'
  | 'PERCENT_MODIFIER'
  | 'FIXED_ADD'
  | 'DISCOUNT';

export type PercentTarget =
  | 'RUNNING_SUBTOTAL'
  | 'PREVIOUS_BLOCK'
  | 'BASE_MATERIALS';

export type ModifierRole = 'MARKUP' | 'MARGIN' | 'FEE' | 'OVERHEAD' | 'DISCOUNT';

export interface PricingBlock {
  id: string;
  type: PricingBlockType;
  label: string;
  value?: number; // percentage or dollar value for modifiers
  target?: PercentTarget; // for PERCENT_MODIFIER or percent DISCOUNT
  is_percent?: boolean; // for DISCOUNT and FEE (true = %, false = $)
  role?: ModifierRole; // distinguishes Markup vs Platform Fee vs Extra Overhead
}

export interface PricingRule {
  id: string;
  name: string;
  description?: string;
  blocks: PricingBlock[];
  updated_at?: string;
}

export interface EvaluatedBlockStep {
  block: PricingBlock;
  baseReferenceValue: number;
  deltaAmount: number; // positive for additions, negative for discounts
  runningSubtotal: number;
}

export interface PipelineEvaluationResult {
  steps: EvaluatedBlockStep[];
  totalMaterialsCost: number;
  totalLaborCost: number;
  totalPackagingCost: number;
  totalProductionCost: number;
  extraCostsTotal: number;
  directCostsTotal: number;
  markupTotal: number;
  subtotalBeforePercentFees: number;
  percentageFeesRate: number;
  percentageFeesTotal: number;
  fixedFeesTotal: number;
  suggestedRetailPrice: number;
  platformFeesTotal: number;
  netRevenue: number;
  discountsTotal: number;
  netProfit: number;
  netMarginPercent: number; // (netRevenue - directCostsTotal) / suggestedRetailPrice * 100
}
