import { useState, useEffect, useCallback, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import {
  AttentionType,
  CascadeAlert,
  LaborRateItem,
  MaterialItem,
  MaterialUnit,
  PackagingItem,
  PackagingUnit,
  PricingBlock,
  PricingRule,
  ProductItem,
} from '../types/pricing';
import {
  INITIAL_CASCADE_ALERTS,
  INITIAL_LABOR_RATES,
  INITIAL_MATERIALS,
  INITIAL_MATERIAL_CATEGORIES,
  INITIAL_PACKAGING,
  INITIAL_PACKAGING_CATEGORIES,
  INITIAL_PRICING_RULES,
  INITIAL_PRODUCTS,
  INITIAL_PRODUCT_CATEGORIES,
} from '../data/mockData';
import {
  calculateMinuteRate,
  calculateUnitCost,
  computeProductBomTotals,
  generateId,
  isValidUuid,
} from '../utils/calculations';
import { supabase, isSupabaseConfigured } from '../lib/supabase/client';

const STORAGE_KEYS = {
  MATERIALS: 'pennycraft_materials_v3',
  PACKAGING: 'pennycraft_packaging_v3',
  LABOR_RATES: 'pennycraft_labor_rates_v3',
  PRODUCTS: 'pennycraft_products_v3',
  PRICING_RULES: 'pennycraft_pricing_rules_v3',
  CASCADE_ALERTS: 'pennycraft_cascade_alerts_v3',
  MATERIAL_CATEGORIES: 'pennycraft_material_categories_v3',
  PACKAGING_CATEGORIES: 'pennycraft_packaging_categories_v3',
  PRODUCT_CATEGORIES: 'pennycraft_product_categories_v3',
  SUPPLIER_URLS: 'pennycraft_supplier_urls_v1',
};

const LEGACY_ID_MAP: Record<string, string> = {
  'mat-offset-90': '11111111-1111-4111-8111-111111111101',
  'mat-chipboard-2mm': '11111111-1111-4111-8111-111111111102',
  'mat-bookcloth-linen': '11111111-1111-4111-8111-111111111103',
  'pkg-kraft-mailer': '22222222-2222-4222-8222-222222222201',
  'pkg-cotton-ribbon': '22222222-2222-4222-8222-222222222202',
  'lab-focused-manual': '33333333-3333-4333-8333-333333333301',
  'lab-batch-machine': '33333333-3333-4333-8333-333333333302',
  'rule-etsy-online': '44444444-4444-4444-8444-444444444401',
  'rule-wholesale-simple': '44444444-4444-4444-8444-444444444402',
  'prod-floral-planner-a5': '55555555-5555-4555-8555-555555555501',
  'prod-bookmark-set': '55555555-5555-4555-8555-555555555502',
  'cascade-demo-offset': '66666666-6666-4666-8666-666666666601',
};

function resolveUuid(rawId: string, dynamicMap: Map<string, string>): string {
  if (isValidUuid(rawId)) return rawId;
  if (LEGACY_ID_MAP[rawId]) return LEGACY_ID_MAP[rawId];
  const existing = dynamicMap.get(rawId);
  if (existing) return existing;
  const fresh = generateId();
  dynamicMap.set(rawId, fresh);
  return fresh;
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`Failed to parse localStorage key "${key}":`, err);
    return fallback;
  }
}

function loadNormalizedInitialData() {
  const idMap = new Map<string, string>();

  const rawMaterials = loadFromStorage(STORAGE_KEYS.MATERIALS, INITIAL_MATERIALS);
  const rawPackaging = loadFromStorage(STORAGE_KEYS.PACKAGING, INITIAL_PACKAGING);
  const rawLabor = loadFromStorage(STORAGE_KEYS.LABOR_RATES, INITIAL_LABOR_RATES);
  const rawRules = loadFromStorage(
    STORAGE_KEYS.PRICING_RULES,
    INITIAL_PRICING_RULES
  );
  const rawProducts = loadFromStorage(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  const rawAlerts = loadFromStorage(
    STORAGE_KEYS.CASCADE_ALERTS,
    INITIAL_CASCADE_ALERTS
  );
  const supplierUrlMap = loadFromStorage<Record<string, string>>(
    STORAGE_KEYS.SUPPLIER_URLS,
    {}
  );

  const legacyFormulaDescriptions = new Set([
    'Materials + Labor + Packaging + 50% Margin on running subtotal + 6.5% Etsy Fee',
    'Materials + 100% markup on materials + Labor + Packaging',
    'Materials + Time + Packaging + 60% Margin',
    'Base BOM + 60% Margin',
  ]);

  const materials: MaterialItem[] = rawMaterials.map((m) => {
    const id = resolveUuid(m.id, idMap);
    return {
      ...m,
      id,
      supplier_url: m.supplier_url || supplierUrlMap[id] || undefined,
    };
  });

  const packaging: PackagingItem[] = rawPackaging.map((p) => {
    const id = resolveUuid(p.id, idMap);
    return {
      ...p,
      id,
      supplier_url: p.supplier_url || supplierUrlMap[id] || undefined,
    };
  });

  const laborRates: LaborRateItem[] = rawLabor.map((l) => ({
    ...l,
    id: resolveUuid(l.id, idMap),
  }));

  const pricingRules: PricingRule[] = rawRules.map((r) => ({
    ...r,
    id: resolveUuid(r.id, idMap),
    description:
      r.description && legacyFormulaDescriptions.has(r.description.trim())
        ? ''
        : r.description,
  }));

  const products: ProductItem[] = rawProducts.map((prod) => ({
    ...prod,
    id: resolveUuid(prod.id, idMap),
    default_rule_id: prod.default_rule_id
      ? resolveUuid(prod.default_rule_id, idMap)
      : pricingRules[0]?.id,
    items_materials: (prod.items_materials || []).map((m) => ({
      ...m,
      material_id: resolveUuid(m.material_id, idMap),
    })),
    items_packaging: (prod.items_packaging || []).map((p) => ({
      ...p,
      packaging_id: resolveUuid(p.packaging_id, idMap),
    })),
    items_labor: (prod.items_labor || []).map((l) => ({
      ...l,
      labor_id: resolveUuid(l.labor_id, idMap),
    })),
  }));

  const cascadeAlerts: CascadeAlert[] = rawAlerts.map((a) => ({
    ...a,
    id: resolveUuid(a.id, idMap),
    item_id: resolveUuid(a.item_id, idMap),
    affected_product_ids: (a.affected_product_ids || []).map((pid) =>
      resolveUuid(pid, idMap)
    ),
  }));

  return {
    materials,
    packaging,
    laborRates,
    pricingRules,
    products,
    cascadeAlerts,
    supplierUrlMap,
  };
}

export function usePennyCraftStore() {
  const initial = useRef(loadNormalizedInitialData()).current;

  const [materials, setMaterials] = useState<MaterialItem[]>(initial.materials);
  const [packaging, setPackaging] = useState<PackagingItem[]>(initial.packaging);
  const [laborRates, setLaborRates] = useState<LaborRateItem[]>(
    initial.laborRates
  );
  const [products, setProducts] = useState<ProductItem[]>(initial.products);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>(
    initial.pricingRules
  );
  const [cascadeAlerts, setCascadeAlerts] = useState<CascadeAlert[]>(
    initial.cascadeAlerts
  );

  const [materialCategories, setMaterialCategories] = useState<string[]>(() =>
    loadFromStorage(STORAGE_KEYS.MATERIAL_CATEGORIES, INITIAL_MATERIAL_CATEGORIES)
  );
  const [packagingCategories, setPackagingCategories] = useState<string[]>(() =>
    loadFromStorage(
      STORAGE_KEYS.PACKAGING_CATEGORIES,
      INITIAL_PACKAGING_CATEGORIES
    )
  );
  const [productCategories, setProductCategories] = useState<string[]>(() =>
    loadFromStorage(STORAGE_KEYS.PRODUCT_CATEGORIES, INITIAL_PRODUCT_CATEGORIES)
  );

  // Supabase Auth & Cloud Sync State
  const [user, setUser] = useState<User | null>(null);
  const [isSyncingCloud, setIsSyncingCloud] = useState<boolean>(false);
  const migratedUserIdRef = useRef<string | null>(null);

  // Keep latest state refs for migration on login
  const latestStateRef = useRef({
    materials,
    packaging,
    laborRates,
    pricingRules,
    products,
  });
  useEffect(() => {
    latestStateRef.current = {
      materials,
      packaging,
      laborRates,
      pricingRules,
      products,
    };
  }, [materials, packaging, laborRates, pricingRules, products]);

  // Save supplier_url map in localStorage as a fallback in case DB column is optional
  const saveSupplierUrlLocal = useCallback((id: string, url?: string) => {
    try {
      const map = loadFromStorage<Record<string, string>>(
        STORAGE_KEYS.SUPPLIER_URLS,
        {}
      );
      if (url) {
        map[id] = url;
      } else {
        delete map[id];
      }
      localStorage.setItem(STORAGE_KEYS.SUPPLIER_URLS, JSON.stringify(map));
    } catch (e) {
      console.warn('Failed to save supplier URL map locally:', e);
    }
  }, []);

  // --- SUPABASE CLOUD HELPERS (TABLE PREFIX: penny_) ---

  const upsertCloudItem = useCallback(
    async (
      item: MaterialItem | PackagingItem,
      type: 'material' | 'packaging',
      uid: string
    ) => {
      if (!supabase) return;
      const basePayload = {
        id: item.id,
        user_id: uid,
        type,
        name: item.name,
        category: item.category,
        purchase_unit: item.purchase_unit,
        purchase_qty: item.purchase_qty,
        price_paid: item.price_paid,
        unit_cost: item.unit_cost,
        updated_at: item.updated_at,
      };

      if (item.supplier_url !== undefined) {
        const { error } = await supabase
          .from('penny_items')
          .upsert({ ...basePayload, supplier_url: item.supplier_url || null });
        if (!error) return;
        // If column supplier_url doesn't exist yet in DB (42703), fallback gracefully
      }

      await supabase.from('penny_items').upsert(basePayload);
    },
    []
  );

  const upsertCloudLabor = useCallback(
    async (item: LaborRateItem, uid: string) => {
      if (!supabase) return;
      await supabase.from('penny_labor_rates').upsert({
        id: item.id,
        user_id: uid,
        name: item.name,
        attention_type: item.attention_type,
        hourly_rate: item.hourly_rate,
        minute_rate: item.minute_rate,
        updated_at: item.updated_at || new Date().toISOString(),
      });
    },
    []
  );

  const upsertCloudRule = useCallback(
    async (rule: PricingRule, uid: string) => {
      if (!supabase) return;
      await supabase.from('penny_pricing_rules').upsert({
        id: rule.id,
        user_id: uid,
        name: rule.name,
        notes: rule.description || '',
        blocks: rule.blocks,
        updated_at: rule.updated_at || new Date().toISOString(),
      });
    },
    []
  );

  const upsertCloudProduct = useCallback(
    async (prod: ProductItem, uid: string) => {
      if (!supabase) return;
      await supabase.from('penny_products').upsert({
        id: prod.id,
        user_id: uid,
        name: prod.name,
        category: prod.category,
        default_rule_id: isValidUuid(prod.default_rule_id)
          ? prod.default_rule_id
          : null,
        items_materials: prod.items_materials,
        items_packaging: prod.items_packaging,
        items_labor: prod.items_labor,
        total_materials_cost: prod.total_materials_cost,
        total_packaging_cost: prod.total_packaging_cost,
        total_labor_cost: prod.total_labor_cost,
        base_production_cost: prod.base_production_cost,
        updated_at: prod.updated_at,
      });
    },
    []
  );

  // Sync & Migrate on Login
  const syncAndMigrateWithCloud = useCallback(
    async (activeUser: User) => {
      if (!supabase || migratedUserIdRef.current === activeUser.id) return;
      migratedUserIdRef.current = activeUser.id;
      setIsSyncingCloud(true);

      try {
        const uid = activeUser.id;

        // 1. Ensure profile exists in public.penny_profiles
        await supabase.from('penny_profiles').upsert({
          id: uid,
          updated_at: new Date().toISOString(),
        });

        // 2. Fetch existing cloud records for this user
        const [itemsRes, laborRes, rulesRes, productsRes] = await Promise.all([
          supabase.from('penny_items').select('*').eq('user_id', uid),
          supabase.from('penny_labor_rates').select('*').eq('user_id', uid),
          supabase.from('penny_pricing_rules').select('*').eq('user_id', uid),
          supabase.from('penny_products').select('*').eq('user_id', uid),
        ]);

        const cloudItems = itemsRes.data || [];
        const cloudLabor = laborRes.data || [];
        const cloudRules = rulesRes.data || [];
        const cloudProducts = productsRes.data || [];

        const hasCloudData =
          cloudItems.length > 0 ||
          cloudLabor.length > 0 ||
          cloudRules.length > 0 ||
          cloudProducts.length > 0;

        const local = latestStateRef.current;
        const supplierUrlMap = loadFromStorage<Record<string, string>>(
          STORAGE_KEYS.SUPPLIER_URLS,
          {}
        );

        if (!hasCloudData) {
          // Seamless Data Migration: Upload all current local session items, rates, rules & products to the user's new cloud account
          await Promise.all([
            ...local.materials.map((m) => upsertCloudItem(m, 'material', uid)),
            ...local.packaging.map((p) => upsertCloudItem(p, 'packaging', uid)),
            ...local.laborRates.map((l) => upsertCloudLabor(l, uid)),
            ...local.pricingRules.map((r) => upsertCloudRule(r, uid)),
          ]);
          // Upload products after rules so foreign key default_rule_id is satisfied
          await Promise.all(
            local.products.map((prod) => upsertCloudProduct(prod, uid))
          );
        } else {
          // User already has cloud data: also migrate any newly created local items that aren't in cloud yet
          const cloudItemIds = new Set(cloudItems.map((i) => i.id));
          const cloudLaborIds = new Set(cloudLabor.map((l) => l.id));
          const cloudRuleIds = new Set(cloudRules.map((r) => r.id));
          const cloudProductIds = new Set(cloudProducts.map((p) => p.id));

          const newLocalMaterials = local.materials.filter(
            (m) =>
              !cloudItemIds.has(m.id) &&
              !INITIAL_MATERIALS.some((init) => init.id === m.id)
          );
          const newLocalPackaging = local.packaging.filter(
            (p) =>
              !cloudItemIds.has(p.id) &&
              !INITIAL_PACKAGING.some((init) => init.id === p.id)
          );
          const newLocalLabor = local.laborRates.filter(
            (l) =>
              !cloudLaborIds.has(l.id) &&
              !INITIAL_LABOR_RATES.some((init) => init.id === l.id)
          );
          const newLocalRules = local.pricingRules.filter(
            (r) =>
              !cloudRuleIds.has(r.id) &&
              !INITIAL_PRICING_RULES.some((init) => init.id === r.id)
          );
          const newLocalProducts = local.products.filter(
            (p) =>
              !cloudProductIds.has(p.id) &&
              !INITIAL_PRODUCTS.some((init) => init.id === p.id)
          );

          if (
            newLocalMaterials.length > 0 ||
            newLocalPackaging.length > 0 ||
            newLocalLabor.length > 0 ||
            newLocalRules.length > 0 ||
            newLocalProducts.length > 0
          ) {
            await Promise.all([
              ...newLocalMaterials.map((m) =>
                upsertCloudItem(m, 'material', uid)
              ),
              ...newLocalPackaging.map((p) =>
                upsertCloudItem(p, 'packaging', uid)
              ),
              ...newLocalLabor.map((l) => upsertCloudLabor(l, uid)),
              ...newLocalRules.map((r) => upsertCloudRule(r, uid)),
            ]);
            await Promise.all(
              newLocalProducts.map((p) => upsertCloudProduct(p, uid))
            );
          }

          // Hydrate state from cloud + migrated local records
          const nextMaterials: MaterialItem[] = [
            ...cloudItems
              .filter((row) => row.type === 'material')
              .map((row) => ({
                id: row.id,
                name: row.name,
                category: row.category || 'Uncategorized',
                purchase_unit: (row.purchase_unit || 'un') as MaterialUnit,
                purchase_qty: Number(row.purchase_qty),
                price_paid: Number(row.price_paid),
                unit_cost: Number(row.unit_cost),
                supplier_url:
                  row.supplier_url || supplierUrlMap[row.id] || undefined,
                updated_at: row.updated_at || new Date().toISOString(),
              })),
            ...newLocalMaterials,
          ];

          const nextPackaging: PackagingItem[] = [
            ...cloudItems
              .filter((row) => row.type === 'packaging')
              .map((row) => ({
                id: row.id,
                name: row.name,
                category: row.category || 'Uncategorized',
                purchase_unit: (row.purchase_unit || 'un') as PackagingUnit,
                purchase_qty: Number(row.purchase_qty),
                price_paid: Number(row.price_paid),
                unit_cost: Number(row.unit_cost),
                supplier_url:
                  row.supplier_url || supplierUrlMap[row.id] || undefined,
                updated_at: row.updated_at || new Date().toISOString(),
              })),
            ...newLocalPackaging,
          ];

          const nextLabor: LaborRateItem[] = [
            ...cloudLabor.map((row) => ({
              id: row.id,
              name: row.name,
              attention_type: (row.attention_type ||
                'Exclusive / Focused') as AttentionType,
              hourly_rate: Number(row.hourly_rate),
              minute_rate: Number(row.minute_rate),
              updated_at: row.updated_at || new Date().toISOString(),
            })),
            ...newLocalLabor,
          ];

          const nextRules: PricingRule[] = [
            ...cloudRules.map((row) => ({
              id: row.id,
              name: row.name,
              description: row.notes || '',
              blocks: Array.isArray(row.blocks) ? row.blocks : [],
              updated_at: row.updated_at || new Date().toISOString(),
            })),
            ...newLocalRules,
          ];

          const nextProducts: ProductItem[] = [
            ...cloudProducts.map((row) => ({
              id: row.id,
              name: row.name,
              category: row.category || 'General Craft',
              default_rule_id: row.default_rule_id || nextRules[0]?.id,
              items_materials: Array.isArray(row.items_materials)
                ? row.items_materials
                : [],
              items_packaging: Array.isArray(row.items_packaging)
                ? row.items_packaging
                : [],
              items_labor: Array.isArray(row.items_labor)
                ? row.items_labor
                : [],
              total_materials_cost: Number(row.total_materials_cost),
              total_packaging_cost: Number(row.total_packaging_cost),
              total_labor_cost: Number(row.total_labor_cost),
              base_production_cost: Number(row.base_production_cost),
              updated_at: row.updated_at || new Date().toISOString(),
              price_stale_flag: false,
              affected_by_names: [],
            })),
            ...newLocalProducts,
          ];

          if (nextMaterials.length > 0) setMaterials(nextMaterials);
          if (nextPackaging.length > 0) setPackaging(nextPackaging);
          if (nextLabor.length > 0) setLaborRates(nextLabor);
          if (nextRules.length > 0) setPricingRules(nextRules);
          if (nextProducts.length > 0) setProducts(nextProducts);
        }
      } catch (err) {
        console.error('Error syncing with Supabase cloud:', err);
      } finally {
        setIsSyncingCloud(false);
      }
    },
    [upsertCloudItem, upsertCloudLabor, upsertCloudRule, upsertCloudProduct]
  );

  // Listen to Supabase Auth Session
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      const currentUser = data.session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        syncAndMigrateWithCloud(currentUser);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const nextUser = session?.user ?? null;
        setUser(nextUser);
        if (nextUser) {
          syncAndMigrateWithCloud(nextUser);
        } else {
          migratedUserIdRef.current = null;
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [syncAndMigrateWithCloud]);

  const signOutCloud = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    migratedUserIdRef.current = null;
  }, []);

  // --- LOCAL STORAGE PERSISTENCE ---
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(materials));
    } catch (e) {
      console.error('Error saving materials to localStorage:', e);
    }
  }, [materials]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PACKAGING, JSON.stringify(packaging));
    } catch (e) {
      console.error('Error saving packaging to localStorage:', e);
    }
  }, [packaging]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.LABOR_RATES, JSON.stringify(laborRates));
    } catch (e) {
      console.error('Error saving labor rates to localStorage:', e);
    }
  }, [laborRates]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch (e) {
      console.error('Error saving products to localStorage:', e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.PRICING_RULES,
        JSON.stringify(pricingRules)
      );
    } catch (e) {
      console.error('Error saving pricing rules to localStorage:', e);
    }
  }, [pricingRules]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.CASCADE_ALERTS,
        JSON.stringify(cascadeAlerts)
      );
    } catch (e) {
      console.error('Error saving cascade alerts to localStorage:', e);
    }
  }, [cascadeAlerts]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.MATERIAL_CATEGORIES,
        JSON.stringify(materialCategories)
      );
    } catch (e) {
      console.error('Error saving material categories to localStorage:', e);
    }
  }, [materialCategories]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.PACKAGING_CATEGORIES,
        JSON.stringify(packagingCategories)
      );
    } catch (e) {
      console.error('Error saving packaging categories to localStorage:', e);
    }
  }, [packagingCategories]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.PRODUCT_CATEGORIES,
        JSON.stringify(productCategories)
      );
    } catch (e) {
      console.error('Error saving product categories to localStorage:', e);
    }
  }, [productCategories]);

  // Dynamic category helpers (auto-trimmed)
  const ensureMaterialCategory = useCallback((rawCategory: string): string => {
    const trimmed = rawCategory.trim() || 'Uncategorized';
    setMaterialCategories((prev) => {
      const exists = prev.some(
        (c) => c.toLowerCase() === trimmed.toLowerCase()
      );
      return exists ? prev : [...prev, trimmed];
    });
    return trimmed;
  }, []);

  const ensurePackagingCategory = useCallback((rawCategory: string): string => {
    const trimmed = rawCategory.trim() || 'Uncategorized';
    setPackagingCategories((prev) => {
      const exists = prev.some(
        (c) => c.toLowerCase() === trimmed.toLowerCase()
      );
      return exists ? prev : [...prev, trimmed];
    });
    return trimmed;
  }, []);

  const ensureProductCategory = useCallback((rawCategory: string): string => {
    const trimmed = rawCategory.trim() || 'General Craft';
    setProductCategories((prev) => {
      const exists = prev.some(
        (c) => c.toLowerCase() === trimmed.toLowerCase()
      );
      return exists ? prev : [...prev, trimmed];
    });
    return trimmed;
  }, []);

  // --- CASCADE IMPACT TRIGGER ---
  const triggerCascadeImpact = useCallback(
    (itemId: string, itemName: string, itemType: 'Material' | 'Packaging') => {
      setProducts((prevProducts) => {
        const affectedIds: string[] = [];

        const updatedProducts = prevProducts.map((prod) => {
          const usesItem =
            itemType === 'Material'
              ? prod.items_materials.some((m) => m.material_id === itemId)
              : prod.items_packaging.some((p) => p.packaging_id === itemId);

          if (!usesItem) return prod;

          affectedIds.push(prod.id);
          const existingNames = prod.affected_by_names || [];
          const nextNames = existingNames.includes(itemName)
            ? existingNames
            : [...existingNames, itemName];

          return {
            ...prod,
            price_stale_flag: true,
            previous_base_cost:
              prod.previous_base_cost !== undefined
                ? prod.previous_base_cost
                : prod.base_production_cost,
            affected_by_names: nextNames,
          };
        });

        if (affectedIds.length > 0) {
          setCascadeAlerts((prevAlerts) => {
            const filtered = prevAlerts.filter((a) => a.item_id !== itemId);
            const newAlert: CascadeAlert = {
              id: generateId('cascade'),
              item_id: itemId,
              item_name: itemName,
              item_type: itemType,
              affected_product_ids: affectedIds,
              timestamp: new Date().toISOString(),
            };
            return [newAlert, ...filtered];
          });
        }

        return updatedProducts;
      });
    },
    []
  );

  // --- MATERIALS CRUD ---
  const addMaterial = useCallback(
    (input: {
      name: string;
      category: string;
      purchase_unit: MaterialUnit;
      purchase_qty: number;
      price_paid: number;
      supplier_url?: string;
      updated_at?: string;
    }) => {
      const cleanCategory = ensureMaterialCategory(input.category);
      const id = generateId('mat');
      const newItem: MaterialItem = {
        id,
        name: input.name.trim(),
        category: cleanCategory,
        purchase_unit: input.purchase_unit,
        purchase_qty: Number(input.purchase_qty),
        price_paid: Number(input.price_paid),
        unit_cost: calculateUnitCost(
          Number(input.price_paid),
          Number(input.purchase_qty)
        ),
        supplier_url: input.supplier_url?.trim() || undefined,
        updated_at: input.updated_at || new Date().toISOString(),
      };
      saveSupplierUrlLocal(id, newItem.supplier_url);
      setMaterials((prev) => [newItem, ...prev]);

      if (user) {
        upsertCloudItem(newItem, 'material', user.id);
      }
      return newItem;
    },
    [ensureMaterialCategory, saveSupplierUrlLocal, user, upsertCloudItem]
  );

  const updateMaterial = useCallback(
    (
      id: string,
      input: {
        name: string;
        category: string;
        purchase_unit: MaterialUnit;
        purchase_qty: number;
        price_paid: number;
        supplier_url?: string;
        updated_at?: string;
      }
    ) => {
      const cleanCategory = ensureMaterialCategory(input.category);
      const trimmedName = input.name.trim();
      const updatedItem: MaterialItem = {
        id,
        name: trimmedName,
        category: cleanCategory,
        purchase_unit: input.purchase_unit,
        purchase_qty: Number(input.purchase_qty),
        price_paid: Number(input.price_paid),
        unit_cost: calculateUnitCost(
          Number(input.price_paid),
          Number(input.purchase_qty)
        ),
        supplier_url: input.supplier_url?.trim() || undefined,
        updated_at: input.updated_at || new Date().toISOString(),
      };

      saveSupplierUrlLocal(id, updatedItem.supplier_url);
      setMaterials((prev) =>
        prev.map((item) => (item.id === id ? updatedItem : item))
      );
      triggerCascadeImpact(id, trimmedName, 'Material');

      if (user) {
        upsertCloudItem(updatedItem, 'material', user.id);
      }
    },
    [
      ensureMaterialCategory,
      saveSupplierUrlLocal,
      triggerCascadeImpact,
      user,
      upsertCloudItem,
    ]
  );

  const quickUpdateMaterialPrice = useCallback(
    (id: string, newPricePaid: number, newPurchaseQty?: number) => {
      let updatedRecord: MaterialItem | null = null;
      setMaterials((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          const qty =
            newPurchaseQty !== undefined
              ? Number(newPurchaseQty)
              : item.purchase_qty;
          const price = Number(newPricePaid);
          updatedRecord = {
            ...item,
            price_paid: price,
            purchase_qty: qty,
            unit_cost: calculateUnitCost(price, qty),
            updated_at: new Date().toISOString(),
          };
          return updatedRecord;
        })
      );
      const target = materials.find((m) => m.id === id) || updatedRecord;
      triggerCascadeImpact(id, target?.name || 'Material', 'Material');

      if (user && updatedRecord) {
        upsertCloudItem(updatedRecord, 'material', user.id);
      }
    },
    [materials, triggerCascadeImpact, user, upsertCloudItem]
  );

  const deleteMaterial = useCallback(
    (id: string) => {
      setMaterials((prev) => prev.filter((item) => item.id !== id));
      saveSupplierUrlLocal(id, undefined);
      if (user && supabase) {
        supabase
          .from('penny_items')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id)
          .then();
      }
    },
    [saveSupplierUrlLocal, user]
  );

  // --- PACKAGING CRUD ---
  const addPackaging = useCallback(
    (input: {
      name: string;
      category: string;
      purchase_unit: PackagingUnit;
      purchase_qty: number;
      price_paid: number;
      supplier_url?: string;
      updated_at?: string;
    }) => {
      const cleanCategory = ensurePackagingCategory(input.category);
      const id = generateId('pkg');
      const newItem: PackagingItem = {
        id,
        name: input.name.trim(),
        category: cleanCategory,
        purchase_unit: input.purchase_unit,
        purchase_qty: Number(input.purchase_qty),
        price_paid: Number(input.price_paid),
        unit_cost: calculateUnitCost(
          Number(input.price_paid),
          Number(input.purchase_qty)
        ),
        supplier_url: input.supplier_url?.trim() || undefined,
        updated_at: input.updated_at || new Date().toISOString(),
      };
      saveSupplierUrlLocal(id, newItem.supplier_url);
      setPackaging((prev) => [newItem, ...prev]);

      if (user) {
        upsertCloudItem(newItem, 'packaging', user.id);
      }
      return newItem;
    },
    [ensurePackagingCategory, saveSupplierUrlLocal, user, upsertCloudItem]
  );

  const updatePackaging = useCallback(
    (
      id: string,
      input: {
        name: string;
        category: string;
        purchase_unit: PackagingUnit;
        purchase_qty: number;
        price_paid: number;
        supplier_url?: string;
        updated_at?: string;
      }
    ) => {
      const cleanCategory = ensurePackagingCategory(input.category);
      const trimmedName = input.name.trim();
      const updatedItem: PackagingItem = {
        id,
        name: trimmedName,
        category: cleanCategory,
        purchase_unit: input.purchase_unit,
        purchase_qty: Number(input.purchase_qty),
        price_paid: Number(input.price_paid),
        unit_cost: calculateUnitCost(
          Number(input.price_paid),
          Number(input.purchase_qty)
        ),
        supplier_url: input.supplier_url?.trim() || undefined,
        updated_at: input.updated_at || new Date().toISOString(),
      };

      saveSupplierUrlLocal(id, updatedItem.supplier_url);
      setPackaging((prev) =>
        prev.map((item) => (item.id === id ? updatedItem : item))
      );
      triggerCascadeImpact(id, trimmedName, 'Packaging');

      if (user) {
        upsertCloudItem(updatedItem, 'packaging', user.id);
      }
    },
    [
      ensurePackagingCategory,
      saveSupplierUrlLocal,
      triggerCascadeImpact,
      user,
      upsertCloudItem,
    ]
  );

  const quickUpdatePackagingPrice = useCallback(
    (id: string, newPricePaid: number, newPurchaseQty?: number) => {
      let updatedRecord: PackagingItem | null = null;
      setPackaging((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          const qty =
            newPurchaseQty !== undefined
              ? Number(newPurchaseQty)
              : item.purchase_qty;
          const price = Number(newPricePaid);
          updatedRecord = {
            ...item,
            price_paid: price,
            purchase_qty: qty,
            unit_cost: calculateUnitCost(price, qty),
            updated_at: new Date().toISOString(),
          };
          return updatedRecord;
        })
      );
      const target = packaging.find((p) => p.id === id) || updatedRecord;
      triggerCascadeImpact(id, target?.name || 'Packaging', 'Packaging');

      if (user && updatedRecord) {
        upsertCloudItem(updatedRecord, 'packaging', user.id);
      }
    },
    [packaging, triggerCascadeImpact, user, upsertCloudItem]
  );

  const deletePackaging = useCallback(
    (id: string) => {
      setPackaging((prev) => prev.filter((item) => item.id !== id));
      saveSupplierUrlLocal(id, undefined);
      if (user && supabase) {
        supabase
          .from('penny_items')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id)
          .then();
      }
    },
    [saveSupplierUrlLocal, user]
  );

  // --- LABOR RATES CRUD ---
  const addLaborRate = useCallback(
    (input: {
      name: string;
      attention_type: AttentionType;
      hourly_rate: number;
    }) => {
      const rate = Number(input.hourly_rate);
      const newItem: LaborRateItem = {
        id: generateId('lab'),
        name: input.name.trim(),
        attention_type: input.attention_type,
        hourly_rate: rate,
        minute_rate: calculateMinuteRate(rate),
        updated_at: new Date().toISOString(),
      };
      setLaborRates((prev) => [newItem, ...prev]);

      if (user) {
        upsertCloudLabor(newItem, user.id);
      }
      return newItem;
    },
    [user, upsertCloudLabor]
  );

  const updateLaborRate = useCallback(
    (
      id: string,
      input: {
        name: string;
        attention_type: AttentionType;
        hourly_rate: number;
      }
    ) => {
      const rate = Number(input.hourly_rate);
      const updatedItem: LaborRateItem = {
        id,
        name: input.name.trim(),
        attention_type: input.attention_type,
        hourly_rate: rate,
        minute_rate: calculateMinuteRate(rate),
        updated_at: new Date().toISOString(),
      };
      setLaborRates((prev) =>
        prev.map((item) => (item.id === id ? updatedItem : item))
      );

      if (user) {
        upsertCloudLabor(updatedItem, user.id);
      }
    },
    [user, upsertCloudLabor]
  );

  const deleteLaborRate = useCallback(
    (id: string) => {
      setLaborRates((prev) => prev.filter((item) => item.id !== id));
      if (user && supabase) {
        supabase
          .from('penny_labor_rates')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id)
          .then();
      }
    },
    [user]
  );

  // --- PRICING RULES CRUD ---
  const addPricingRule = useCallback(
    (input: { name: string; description?: string; blocks: PricingBlock[] }) => {
      const newRule: PricingRule = {
        id: generateId('rule'),
        name: input.name.trim() || 'Custom Pricing Rule',
        description: input.description?.trim() ?? '',
        blocks: input.blocks,
        updated_at: new Date().toISOString(),
      };
      setPricingRules((prev) => [...prev, newRule]);

      if (user) {
        upsertCloudRule(newRule, user.id);
      }
      return newRule;
    },
    [user, upsertCloudRule]
  );

  const updatePricingRule = useCallback(
    (
      id: string,
      input: { name?: string; description?: string; blocks?: PricingBlock[] }
    ) => {
      setPricingRules((prev) =>
        prev.map((rule) => {
          if (rule.id !== id) return rule;
          const updated: PricingRule = {
            ...rule,
            name: input.name !== undefined ? input.name : rule.name,
            description:
              input.description !== undefined
                ? input.description
                : rule.description,
            blocks: input.blocks !== undefined ? input.blocks : rule.blocks,
            updated_at: new Date().toISOString(),
          };
          if (user) {
            upsertCloudRule(updated, user.id);
          }
          return updated;
        })
      );
    },
    [user, upsertCloudRule]
  );

  const duplicatePricingRule = useCallback(
    (id: string) => {
      const source = pricingRules.find((r) => r.id === id);
      if (!source) return null;
      const copy: PricingRule = {
        id: generateId('rule'),
        name: `${source.name} (Copy)`,
        description: source.description,
        blocks: source.blocks.map((b) => ({ ...b, id: generateId('blk') })),
        updated_at: new Date().toISOString(),
      };
      setPricingRules((prev) => [...prev, copy]);

      if (user) {
        upsertCloudRule(copy, user.id);
      }
      return copy;
    },
    [pricingRules, user, upsertCloudRule]
  );

  const deletePricingRule = useCallback(
    (id: string) => {
      setPricingRules((prev) => {
        if (prev.length <= 1) return prev;
        if (user && supabase) {
          supabase
            .from('penny_pricing_rules')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)
            .then();
        }
        return prev.filter((r) => r.id !== id);
      });
    },
    [user]
  );

  // --- PRODUCTS CRUD & RECALCULATION ---
  const addProduct = useCallback(
    (input: {
      name: string;
      category: string;
      default_rule_id?: string;
      items_materials: { material_id: string; qty_used: number }[];
      items_packaging: { packaging_id: string; qty_used: number }[];
      items_labor: { labor_id: string; minutes_spent: number }[];
    }) => {
      const cleanCategory = ensureProductCategory(input.category);
      const totals = computeProductBomTotals(
        input.items_materials,
        input.items_packaging,
        input.items_labor,
        materials,
        packaging,
        laborRates
      );
      const newProduct: ProductItem = {
        id: generateId('prod'),
        name: input.name.trim(),
        category: cleanCategory,
        default_rule_id: input.default_rule_id || pricingRules[0]?.id,
        ...totals,
        updated_at: new Date().toISOString(),
        price_stale_flag: false,
        affected_by_names: [],
      };
      setProducts((prev) => [newProduct, ...prev]);

      if (user) {
        upsertCloudProduct(newProduct, user.id);
      }
      return newProduct;
    },
    [
      ensureProductCategory,
      materials,
      packaging,
      laborRates,
      pricingRules,
      user,
      upsertCloudProduct,
    ]
  );

  const updateProduct = useCallback(
    (
      id: string,
      input: {
        name: string;
        category: string;
        default_rule_id?: string;
        items_materials: { material_id: string; qty_used: number }[];
        items_packaging: { packaging_id: string; qty_used: number }[];
        items_labor: { labor_id: string; minutes_spent: number }[];
      }
    ) => {
      const cleanCategory = ensureProductCategory(input.category);
      const totals = computeProductBomTotals(
        input.items_materials,
        input.items_packaging,
        input.items_labor,
        materials,
        packaging,
        laborRates
      );

      setProducts((prev) =>
        prev.map((prod) => {
          if (prod.id !== id) return prod;
          const updated: ProductItem = {
            ...prod,
            name: input.name.trim(),
            category: cleanCategory,
            default_rule_id: input.default_rule_id || prod.default_rule_id,
            ...totals,
            updated_at: new Date().toISOString(),
            price_stale_flag: false,
            affected_by_names: [],
            previous_base_cost: undefined,
          };
          if (user) {
            upsertCloudProduct(updated, user.id);
          }
          return updated;
        })
      );

      setCascadeAlerts((prev) =>
        prev
          .map((alert) => ({
            ...alert,
            affected_product_ids: alert.affected_product_ids.filter(
              (pid) => pid !== id
            ),
          }))
          .filter((alert) => alert.affected_product_ids.length > 0)
      );
    },
    [ensureProductCategory, materials, packaging, laborRates, user, upsertCloudProduct]
  );

  const duplicateProduct = useCallback(
    (id: string) => {
      const source = products.find((p) => p.id === id);
      if (!source) return null;

      const totals = computeProductBomTotals(
        source.items_materials,
        source.items_packaging,
        source.items_labor,
        materials,
        packaging,
        laborRates
      );

      const copy: ProductItem = {
        id: generateId('prod'),
        name: `${source.name} (Copy)`,
        category: source.category,
        default_rule_id: source.default_rule_id,
        ...totals,
        updated_at: new Date().toISOString(),
        price_stale_flag: false,
        affected_by_names: [],
      };
      setProducts((prev) => [copy, ...prev]);

      if (user) {
        upsertCloudProduct(copy, user.id);
      }
      return copy;
    },
    [products, materials, packaging, laborRates, user, upsertCloudProduct]
  );

  const deleteProduct = useCallback(
    (id: string) => {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setCascadeAlerts((prev) =>
        prev
          .map((alert) => ({
            ...alert,
            affected_product_ids: alert.affected_product_ids.filter(
              (pid) => pid !== id
            ),
          }))
          .filter((alert) => alert.affected_product_ids.length > 0)
      );
      if (user && supabase) {
        supabase
          .from('penny_products')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id)
          .then();
      }
    },
    [user]
  );

  const recalculateProduct = useCallback(
    (productId: string) => {
      setProducts((prev) =>
        prev.map((prod) => {
          if (prod.id !== productId) return prod;
          const totals = computeProductBomTotals(
            prod.items_materials,
            prod.items_packaging,
            prod.items_labor,
            materials,
            packaging,
            laborRates
          );
          const updated: ProductItem = {
            ...prod,
            ...totals,
            updated_at: new Date().toISOString(),
            price_stale_flag: false,
            affected_by_names: [],
            previous_base_cost: undefined,
          };
          if (user) {
            upsertCloudProduct(updated, user.id);
          }
          return updated;
        })
      );

      setCascadeAlerts((prev) =>
        prev
          .map((alert) => ({
            ...alert,
            affected_product_ids: alert.affected_product_ids.filter(
              (pid) => pid !== productId
            ),
          }))
          .filter((alert) => alert.affected_product_ids.length > 0)
      );
    },
    [materials, packaging, laborRates, user, upsertCloudProduct]
  );

  const recalculateAllAffectedProducts = useCallback(() => {
    setProducts((prev) =>
      prev.map((prod) => {
        if (!prod.price_stale_flag) return prod;
        const totals = computeProductBomTotals(
          prod.items_materials,
          prod.items_packaging,
          prod.items_labor,
          materials,
          packaging,
          laborRates
        );
        const updated: ProductItem = {
          ...prod,
          ...totals,
          updated_at: new Date().toISOString(),
          price_stale_flag: false,
          affected_by_names: [],
          previous_base_cost: undefined,
        };
        if (user) {
          upsertCloudProduct(updated, user.id);
        }
        return updated;
      })
    );
    setCascadeAlerts([]);
  }, [materials, packaging, laborRates, user, upsertCloudProduct]);

  const resetDemoData = useCallback(() => {
    setMaterials(INITIAL_MATERIALS);
    setPackaging(INITIAL_PACKAGING);
    setLaborRates(INITIAL_LABOR_RATES);
    setProducts(INITIAL_PRODUCTS);
    setPricingRules(INITIAL_PRICING_RULES);
    setCascadeAlerts(INITIAL_CASCADE_ALERTS);
    setMaterialCategories(INITIAL_MATERIAL_CATEGORIES);
    setPackagingCategories(INITIAL_PACKAGING_CATEGORIES);
    setProductCategories(INITIAL_PRODUCT_CATEGORIES);
  }, []);

  return {
    user,
    isSyncingCloud,
    signOutCloud,
    materials,
    packaging,
    laborRates,
    products,
    pricingRules,
    cascadeAlerts,
    materialCategories,
    packagingCategories,
    productCategories,
    addMaterial,
    updateMaterial,
    quickUpdateMaterialPrice,
    deleteMaterial,
    addPackaging,
    updatePackaging,
    quickUpdatePackagingPrice,
    deletePackaging,
    addLaborRate,
    updateLaborRate,
    deleteLaborRate,
    addPricingRule,
    updatePricingRule,
    duplicatePricingRule,
    deletePricingRule,
    addProduct,
    updateProduct,
    duplicateProduct,
    deleteProduct,
    recalculateProduct,
    recalculateAllAffectedProducts,
    resetDemoData,
  };
}
