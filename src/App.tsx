import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ActiveTab,
  LaborRateItem,
  MaterialItem,
  ModalEntityType,
  PackagingItem,
  ProductItem,
} from './types/pricing';
import {
  usePennyCraftStore,
  checkHasExistingLocalStorageData,
} from './hooks/usePennyCraftStore';
import { isPriceStale } from './utils/calculations';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { SupplyView } from './components/SupplyView';
import { LaborRatesView } from './components/LaborRatesView';
import { ProductsView } from './components/ProductsView';
import { PricingRulesView } from './components/PricingRulesView';
import { ItemModal } from './components/ItemModal';
import { ProductBomModal } from './components/ProductBomModal';
import { AuthModal } from './components/AuthModal';
import { CheckCircle2 } from 'lucide-react';

export function App() {
  const {
    user,
    isSyncingCloud,
    signOutCloud,
    hasExistingStudioData,
    activateLocalStudio,
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
  } = usePennyCraftStore();

  const explicitLandingRef = useRef(false);

  const [currentRoute, setCurrentRoute] = useState<'/' | '/app'>(() => {
    if (window.location.pathname.startsWith('/app')) return '/app';
    if (checkHasExistingLocalStorageData()) return '/app';
    return '/';
  });

  useEffect(() => {
    if (currentRoute === '/app' && window.location.pathname !== '/app') {
      window.history.replaceState({}, '', '/app');
    }
  }, [currentRoute]);

  // If authenticated session loads and user hasn't explicitly chosen Landing Page, open /app
  useEffect(() => {
    if (user && currentRoute === '/' && !explicitLandingRef.current) {
      window.history.replaceState({}, '', '/app');
      setCurrentRoute('/app');
    }
  }, [user, currentRoute]);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(
        window.location.pathname.startsWith('/app') ? '/app' : '/'
      );
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: '/' | '/app', fromExplicitLanding = false) => {
    explicitLandingRef.current = fromExplicitLanding;
    if (path === '/app') {
      activateLocalStudio();
    }
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setCurrentRoute(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [activeTab, setActiveTab] = useState<ActiveTab>('products');
  const [isSupplyModalOpen, setIsSupplyModalOpen] = useState(false);
  const [modalEntityType, setModalEntityType] =
    useState<ModalEntityType>('materials');
  const [editingItem, setEditingItem] = useState<
    MaterialItem | PackagingItem | LaborRateItem | null
  >(null);

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(
    null
  );
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  const handleSmartLogoClick = () => {
    if (hasExistingStudioData) {
      setActiveTab('products');
      navigateTo('/app');
    } else {
      navigateTo('/', true);
    }
  };

  const staleCounts = useMemo(
    () => ({
      products: products.filter((p) => p.price_stale_flag).length,
      materials: materials.filter((m) => isPriceStale(m.updated_at)).length,
      packaging: packaging.filter((p) => isPriceStale(p.updated_at)).length,
    }),
    [products, materials, packaging]
  );

  const handleOpenAddModal = (forcedType?: ModalEntityType) => {
    if (!forcedType && activeTab === 'products') {
      setEditingProduct(null);
      setIsProductModalOpen(true);
      return;
    }

    setEditingItem(null);
    if (forcedType) {
      setModalEntityType(forcedType);
    } else if (activeTab === 'packaging') {
      setModalEntityType('packaging');
    } else if (activeTab === 'labor') {
      setModalEntityType('labor');
    } else {
      setModalEntityType('materials');
    }
    setIsSupplyModalOpen(true);
  };

  const handleOpenEditModal = (
    type: ModalEntityType,
    item: MaterialItem | PackagingItem | LaborRateItem
  ) => {
    setModalEntityType(type);
    setEditingItem(item);
    setIsSupplyModalOpen(true);
  };

  if (currentRoute === '/') {
    return (
      <>
        <LandingPage
          onOpenStudio={() => {
            setActiveTab('products');
            navigateTo('/app');
          }}
          onOpenCloudModal={() => setIsAuthModalOpen(true)}
          onLogoClick={handleSmartLogoClick}
        />

        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 bg-white border border-[#E8ECE9] text-[#303C36] px-4 py-2.5 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex items-center gap-2 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 text-[#42685B] shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthSuccess={(msg) => {
            showToast(msg);
            setActiveTab('products');
            navigateTo('/app');
          }}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFBFA] text-[#303C36] flex flex-col">
      {/* Top App Navigation */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenAddModal={() => handleOpenAddModal()}
        counts={{
          products: products.length,
          rules: pricingRules.length,
          materials: materials.length,
          packaging: packaging.length,
          labor: laborRates.length,
        }}
        staleCounts={staleCounts}
        userEmail={user?.email ?? null}
        isSyncingCloud={isSyncingCloud}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onSignOut={async () => {
          await signOutCloud();
          showToast('Signed out. Working locally on this device.');
        }}
        onResetDemo={() => {
          resetDemoData();
          showToast('Sample studio data, recipes & pricing rules restored.');
        }}
        onNavigateHome={() => navigateTo('/', true)}
        onLogoClick={handleSmartLogoClick}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'products' && (
          <ProductsView
            products={products}
            materials={materials}
            packaging={packaging}
            laborRates={laborRates}
            pricingRules={pricingRules}
            cascadeAlerts={cascadeAlerts}
            onOpenAddProduct={() => {
              setEditingProduct(null);
              setIsProductModalOpen(true);
            }}
            onOpenEditProduct={(prod) => {
              setEditingProduct(prod);
              setIsProductModalOpen(true);
            }}
            onOpenRulesTab={() => setActiveTab('rules')}
            onDuplicateProduct={(id) => {
              const copy = duplicateProduct(id);
              if (copy) showToast(`Duplicated "${copy.name}".`);
            }}
            onDeleteProduct={(id) => {
              deleteProduct(id);
              showToast('Product removed.');
            }}
            onRecalculateProduct={(id) => {
              recalculateProduct(id);
              showToast('Product price updated with latest material costs.');
            }}
            onRecalculateAllAffected={() => {
              recalculateAllAffectedProducts();
              showToast('All affected product prices updated.');
            }}
          />
        )}

        {activeTab === 'rules' && (
          <PricingRulesView
            rules={pricingRules}
            products={products}
            onAddRule={(data) => {
              const rule = addPricingRule(data);
              showToast(`Created pricing rule "${rule.name}".`);
              return rule;
            }}
            onUpdateRule={(id, data) => {
              updatePricingRule(id, data);
            }}
            onDuplicateRule={(id) => {
              const copy = duplicatePricingRule(id);
              if (copy) showToast(`Duplicated rule "${copy.name}".`);
              return copy;
            }}
            onDeleteRule={(id) => {
              deletePricingRule(id);
              showToast('Pricing rule deleted.');
            }}
          />
        )}

        {activeTab === 'materials' && (
          <SupplyView
            mode="materials"
            items={materials}
            onOpenAdd={() => handleOpenAddModal('materials')}
            onOpenEdit={(item) => handleOpenEditModal('materials', item)}
            onQuickUpdatePrice={(id, newPrice, newQty) => {
              quickUpdateMaterialPrice(id, newPrice, newQty);
              showToast(
                'Material price updated! Dependent products flagged for review.'
              );
            }}
            onDelete={(id) => {
              deleteMaterial(id);
              showToast('Material removed.');
            }}
          />
        )}

        {activeTab === 'packaging' && (
          <SupplyView
            mode="packaging"
            items={packaging}
            onOpenAdd={() => handleOpenAddModal('packaging')}
            onOpenEdit={(item) => handleOpenEditModal('packaging', item)}
            onQuickUpdatePrice={(id, newPrice, newQty) => {
              quickUpdatePackagingPrice(id, newPrice, newQty);
              showToast(
                'Packaging price updated! Dependent products flagged for review.'
              );
            }}
            onDelete={(id) => {
              deletePackaging(id);
              showToast('Packaging item removed.');
            }}
          />
        )}

        {activeTab === 'labor' && (
          <LaborRatesView
            items={laborRates}
            onOpenAdd={() => handleOpenAddModal('labor')}
            onOpenEdit={(item) => handleOpenEditModal('labor', item)}
            onQuickUpdateRate={(item, newHourlyRate) => {
              updateLaborRate(item.id, {
                name: item.name,
                attention_type: item.attention_type,
                hourly_rate: newHourlyRate,
              });
              showToast('Labor rate updated.');
            }}
            onDelete={(id) => {
              deleteLaborRate(id);
              showToast('Labor rate removed.');
            }}
          />
        )}
      </main>

      {/* HeroUI Floating Pill Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-white border border-[#E8ECE9] text-[#303C36] px-4 py-2.5 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex items-center gap-2 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-[#42685B] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Creation & Edit Modal for Materials, Packaging, and Labor Rates */}
      <ItemModal
        isOpen={isSupplyModalOpen}
        initialEntityType={modalEntityType}
        editingItem={editingItem}
        materialCategories={materialCategories}
        packagingCategories={packagingCategories}
        onClose={() => {
          setIsSupplyModalOpen(false);
          setEditingItem(null);
        }}
        onSwitchToCreateProduct={() => {
          setEditingProduct(null);
          setIsProductModalOpen(true);
        }}
        onSaveMaterial={(data, editId) => {
          if (editId) {
            updateMaterial(editId, data);
            showToast(
              `Updated "${data.name}". Any dependent products have been flagged.`
            );
          } else {
            addMaterial(data);
            setActiveTab('materials');
            showToast(`Added "${data.name}" to Materials.`);
          }
        }}
        onSavePackaging={(data, editId) => {
          if (editId) {
            updatePackaging(editId, data);
            showToast(
              `Updated "${data.name}". Any dependent products have been flagged.`
            );
          } else {
            addPackaging(data);
            setActiveTab('packaging');
            showToast(`Added "${data.name}" to Packaging.`);
          }
        }}
        onSaveLabor={(data, editId) => {
          if (editId) {
            updateLaborRate(editId, data);
            showToast(`Updated "${data.name}" labor rate.`);
          } else {
            addLaborRate(data);
            setActiveTab('labor');
            showToast(`Added "${data.name}" to Labor Rates.`);
          }
        }}
      />

      {/* Add / Edit Product Recipe & Pricing Modal */}
      <ProductBomModal
        isOpen={isProductModalOpen}
        editingProduct={editingProduct}
        materialsCatalog={materials}
        packagingCatalog={packaging}
        laborCatalog={laborRates}
        pricingRules={pricingRules}
        productCategories={productCategories}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
        }}
        onManageRules={() => {
          setActiveTab('rules');
        }}
        onSaveProduct={(data, editId) => {
          if (editId) {
            updateProduct(editId, data);
            showToast(`Saved recipe for "${data.name}".`);
          } else {
            addProduct(data);
            setActiveTab('products');
            showToast(`Created recipe for "${data.name}".`);
          }
        }}
      />

      {/* Cloud Save / Sign In Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(msg) => showToast(msg)}
      />
    </div>
  );
}
export default App;
