import {
  CascadeAlert,
  LaborRateItem,
  MaterialItem,
  PackagingItem,
  PricingRule,
  ProductItem,
} from '../types/pricing';
import {
  calculateMinuteRate,
  calculateUnitCost,
  computeProductBomTotals,
} from '../utils/calculations';

const daysAgoISO = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

export const INITIAL_MATERIAL_CATEGORIES: string[] = [
  'Paper & Cardstock',
  'Structural Board',
  'Textiles & Bookcloth',
  'Adhesives & Binding',
  'Inks & Pigments',
  'Foil & Embellishments',
];

export const INITIAL_PACKAGING_CATEGORIES: string[] = [
  'Shipping Boxes',
  'Finishing & Ribbons',
  'Stationery & Tags',
  'Protective Wrap',
];

export const INITIAL_PRODUCT_CATEGORIES: string[] = [
  'Planners & Journals',
  'Stationery & Bookmarks',
  'Gift Sets',
  'Custom Commissions',
];

export const INITIAL_MATERIALS: MaterialItem[] = [
  {
    id: '11111111-1111-4111-8111-111111111101',
    name: 'Offset Paper 90gsm',
    category: 'Paper & Cardstock',
    purchase_unit: 'un',
    purchase_qty: 500,
    price_paid: 45.00,
    unit_cost: calculateUnitCost(45.00, 500), // $0.09 / un
    supplier_url: 'https://www.FrenchPaper.com',
    updated_at: daysAgoISO(2),
  },
  {
    id: '11111111-1111-4111-8111-111111111102',
    name: 'Grey Chipboard 2mm',
    category: 'Structural Board',
    purchase_unit: 'un',
    purchase_qty: 25,
    price_paid: 37.50,
    unit_cost: calculateUnitCost(37.50, 25), // $1.50 / un
    updated_at: daysAgoISO(18),
  },
  {
    id: '11111111-1111-4111-8111-111111111103',
    name: 'Natural Bookbinding Linen Cloth',
    category: 'Textiles & Bookcloth',
    purchase_unit: 'm',
    purchase_qty: 10,
    price_paid: 85.00,
    unit_cost: calculateUnitCost(85.00, 10), // $8.50 / m
    supplier_url: 'https://www.talasonline.com',
    updated_at: daysAgoISO(104), // > 90 days to verify stale alert
  },
];

export const INITIAL_PACKAGING: PackagingItem[] = [
  {
    id: '22222222-2222-4222-8222-222222222201',
    name: 'Small Kraft Mailer Box',
    category: 'Shipping Boxes',
    purchase_unit: 'un',
    purchase_qty: 50,
    price_paid: 60.00,
    unit_cost: calculateUnitCost(60.00, 50), // $1.20 / un
    supplier_url: 'https://www.uline.com',
    updated_at: daysAgoISO(12),
  },
  {
    id: '22222222-2222-4222-8222-222222222202',
    name: 'Cotton Ribbon',
    category: 'Finishing & Ribbons',
    purchase_unit: 'm',
    purchase_qty: 100,
    price_paid: 28.00,
    unit_cost: calculateUnitCost(28.00, 100), // $0.28 / m
    updated_at: daysAgoISO(100), // Explicitly set 100 days ago to verify the 90d stale alert
  },
];

export const INITIAL_LABOR_RATES: LaborRateItem[] = [
  {
    id: '33333333-3333-4333-8333-333333333301',
    name: 'Focused Manual Handcrafting',
    attention_type: 'Exclusive / Focused',
    hourly_rate: 25.00,
    minute_rate: calculateMinuteRate(25.00), // $0.4167 / min
    updated_at: daysAgoISO(7),
  },
  {
    id: '33333333-3333-4333-8333-333333333302',
    name: 'Batch & Machine Run',
    attention_type: 'Batch / Passive',
    hourly_rate: 15.00,
    minute_rate: calculateMinuteRate(15.00), // $0.25 / min
    updated_at: daysAgoISO(7),
  },
];

export const INITIAL_PRICING_RULES: PricingRule[] = [
  {
    id: '44444444-4444-4444-8444-444444444401',
    name: 'Etsy Online Store',
    description: '',
    updated_at: daysAgoISO(3),
    blocks: [
      {
        id: 'blk-etsy-mat',
        type: 'BASE_MATERIALS',
        label: 'Materials Cost',
      },
      {
        id: 'blk-etsy-lab',
        type: 'BASE_LABOR',
        label: 'Labor Cost',
      },
      {
        id: 'blk-etsy-pkg',
        type: 'BASE_PACKAGING',
        label: 'Packaging Cost',
      },
      {
        id: 'blk-etsy-margin',
        type: 'PERCENT_MODIFIER',
        label: 'Profit Markup',
        value: 50,
        target: 'RUNNING_SUBTOTAL',
        role: 'MARKUP',
      },
      {
        id: 'blk-etsy-tx-fee',
        type: 'PERCENT_MODIFIER',
        label: 'Transaction Fee (Etsy)',
        value: 6.5,
        is_percent: true,
        target: 'RUNNING_SUBTOTAL',
        role: 'FEE',
      },
      {
        id: 'blk-etsy-proc-pct',
        type: 'PERCENT_MODIFIER',
        label: 'Payment Processing (%)',
        value: 3.0,
        is_percent: true,
        target: 'RUNNING_SUBTOTAL',
        role: 'FEE',
      },
      {
        id: 'blk-etsy-proc-fixed',
        type: 'FIXED_ADD',
        label: 'Payment Processing (Fixed)',
        value: 0.25,
        is_percent: false,
        role: 'FEE',
        fee_scope: 'PER_ORDER',
      },
      {
        id: 'blk-etsy-reg-fee',
        type: 'PERCENT_MODIFIER',
        label: 'Regulatory Operating Fee',
        value: 0.5,
        is_percent: true,
        target: 'RUNNING_SUBTOTAL',
        role: 'FEE',
      },
    ],
  },
  {
    id: '44444444-4444-4444-8444-444444444402',
    name: 'Wholesale Simple',
    description: '',
    updated_at: daysAgoISO(5),
    blocks: [
      {
        id: 'blk-ws-mat',
        type: 'BASE_MATERIALS',
        label: 'Materials Cost',
      },
      {
        id: 'blk-ws-mat-markup',
        type: 'PERCENT_MODIFIER',
        label: 'Materials Markup',
        value: 100,
        target: 'PREVIOUS_BLOCK',
        role: 'MARKUP',
      },
      {
        id: 'blk-ws-lab',
        type: 'BASE_LABOR',
        label: 'Labor Cost',
      },
      {
        id: 'blk-ws-pkg',
        type: 'BASE_PACKAGING',
        label: 'Packaging Cost',
      },
    ],
  },
];

const plannerBom = computeProductBomTotals(
  [
    { material_id: '11111111-1111-4111-8111-111111111101', qty_used: 80 }, // 80 sheets * $0.09 = $7.20
    { material_id: '11111111-1111-4111-8111-111111111102', qty_used: 2 }, // 2 boards * $1.50 = $3.00
    { material_id: '11111111-1111-4111-8111-111111111103', qty_used: 0.35 }, // 0.35 m * $8.50 = $2.975
  ],
  [
    { packaging_id: '22222222-2222-4222-8222-222222222201', qty_used: 1 }, // 1 box * $1.20 = $1.20
    { packaging_id: '22222222-2222-4222-8222-222222222202', qty_used: 0.8 }, // 0.8 m * $0.28 = $0.224
  ],
  [
    { labor_id: '33333333-3333-4333-8333-333333333301', minutes_spent: 36 }, // 36m @ $25/hr = $15.00
    { labor_id: '33333333-3333-4333-8333-333333333302', minutes_spent: 12 }, // 12m @ $15/hr = $3.00
  ],
  INITIAL_MATERIALS,
  INITIAL_PACKAGING,
  INITIAL_LABOR_RATES
);

const bookmarkBom = computeProductBomTotals(
  [
    { material_id: '11111111-1111-4111-8111-111111111101', qty_used: 6 }, // 6 sheets * $0.09 = $0.54
    { material_id: '11111111-1111-4111-8111-111111111102', qty_used: 1 }, // 1 board * $1.50 = $1.50
  ],
  [
    { packaging_id: '22222222-2222-4222-8222-222222222202', qty_used: 1.5 }, // 1.5 m * $0.28 = $0.42
  ],
  [
    { labor_id: '33333333-3333-4333-8333-333333333301', minutes_spent: 15 }, // 15m @ $25/hr = $6.25
  ],
  INITIAL_MATERIALS,
  INITIAL_PACKAGING,
  INITIAL_LABOR_RATES
);

export const INITIAL_PRODUCTS: ProductItem[] = [
  {
    id: '55555555-5555-4555-8555-555555555501',
    name: 'Floral Hardcover Planner A5',
    category: 'Planners & Journals',
    default_rule_id: '44444444-4444-4444-8444-444444444401',
    ...plannerBom,
    updated_at: daysAgoISO(6),
    price_stale_flag: true,
    affected_by_names: ['Offset Paper 90gsm'],
    previous_base_cost: Number((plannerBom.base_production_cost - 0.80).toFixed(2)),
  },
  {
    id: '55555555-5555-4555-8555-555555555502',
    name: 'Handmade Bookmark Set',
    category: 'Stationery & Bookmarks',
    default_rule_id: '44444444-4444-4444-8444-444444444401',
    ...bookmarkBom,
    updated_at: daysAgoISO(9),
    price_stale_flag: true,
    affected_by_names: ['Offset Paper 90gsm'],
    previous_base_cost: Number((bookmarkBom.base_production_cost - 0.06).toFixed(2)),
  },
];

export const INITIAL_CASCADE_ALERTS: CascadeAlert[] = [
  {
    id: '66666666-6666-4666-8666-666666666601',
    item_id: '11111111-1111-4111-8111-111111111101',
    item_name: 'Offset Paper 90gsm',
    item_type: 'Material',
    affected_product_ids: [
      '55555555-5555-4555-8555-555555555501',
      '55555555-5555-4555-8555-555555555502',
    ],
    timestamp: daysAgoISO(2),
  },
];
