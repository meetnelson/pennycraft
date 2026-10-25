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
import {
  CategoryManagerModal,
  CategoryScope,
} from './components/CategoryManagerModal';
import {
  CheckCircle2,
  Cloud,
  X,
  AlertTriangle,
  Download,
  Upload,
} from 'lucide-react';

export const metadata = {
  title: 'Formulo — Smart Pricing Studio for Makers',
  description:
    'Know your costs. Price with confidence. Visual pricing recipes, batch calculations, and profit margins for craft studios.',
  metadataBase: 'https://formulo.cc',
  alternates: {
    canonical: 'https://formulo.cc',
  },
  supportEmail: 'support@formulo.cc',
  openGraph: {
    url: 'https://formulo.cc',
    images: ['https://formulo.cc/images/Formulo-OpenGraph.png'],
  },
};

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
    addCategory,
    renameCategory,
    deleteCategory,
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
    exportStudioDataJSON,
    importStudioDataJSON,
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
  const [templateSupplyItem, setTemplateSupplyItem] = useState<
    MaterialItem | PackagingItem | null
  >(null);

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(
    null
  );
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [categoryManagerScope, setCategoryManagerScope] =
    useState<CategoryScope>('materials');

  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingImportJson, setPendingImportJson] = useState<unknown | null>(
    null
  );
  const [pendingImportFileName, setPendingImportFileName] = useState<
    string | null
  >(null);

  const [isFormDirty, setIsFormDirty] = useState(false);
  const [pendingNavAction, setPendingNavAction] = useState<(() => void) | null>(
    null
  );

  const [isLocalWarningDismissed, setIsLocalWarningDismissed] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  const guardNavigation = (action: () => void) => {
    if (isFormDirty) {
      setPendingNavAction(() => action);
      return;
    }
    action();
  };

  const handleSelectTab = (tab: ActiveTab) => {
    guardNavigation(() => {
      setIsSupplyModalOpen(false);
      setIsProductModalOpen(false);
      setEditingItem(null);
      setEditingProduct(null);
      setIsFormDirty(false);
      setActiveTab(tab);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const handleSmartLogoClick = () => {
    guardNavigation(() => {
      setIsSupplyModalOpen(false);
      setIsProductModalOpen(false);
      setEditingItem(null);
      setEditingProduct(null);
      setIsFormDirty(false);
      if (hasExistingStudioData) {
        setActiveTab('products');
        navigateTo('/app');
      } else {
        navigateTo('/', true);
      }
    });
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
    guardNavigation(() => {
      if (!forcedType && activeTab === 'products') {
        setIsSupplyModalOpen(false);
        setEditingItem(null);
        setEditingProduct(null);
        setIsFormDirty(false);
        setIsProductModalOpen(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      setIsProductModalOpen(false);
      setEditingProduct(null);
      setEditingItem(null);
      setTemplateSupplyItem(null);
      setIsFormDirty(false);
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const handleOpenEditModal = (
    type: ModalEntityType,
    item: MaterialItem | PackagingItem | LaborRateItem
  ) => {
    setIsProductModalOpen(false);
    setEditingProduct(null);
    setTemplateSupplyItem(null);
    setModalEntityType(type);
    setEditingItem(item);
    setIsFormDirty(false);
    setIsSupplyModalOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDuplicateSupplyItem = (
    type: 'materials' | 'packaging',
    item: MaterialItem | PackagingItem
  ) => {
    setIsProductModalOpen(false);
    setEditingProduct(null);
    setEditingItem(null);
    setTemplateSupplyItem(item);
    setModalEntityType(type);
    setIsFormDirty(false);
    setIsSupplyModalOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenCategoryManager = (scope?: CategoryScope) => {
    if (scope) {
      setCategoryManagerScope(scope);
    } else if (activeTab === 'packaging') {
      setCategoryManagerScope('packaging');
    } else if (activeTab === 'products') {
      setCategoryManagerScope('products');
    } else {
      setCategoryManagerScope('materials');
    }
    setIsCategoryManagerOpen(true);
  };

  const handleExportBackup = () => {
    exportStudioDataJSON();
    showToast('Exported studio data backup (JSON).');
  };

  const handleTriggerImportBackup = () => {
    importInputRef.current?.click();
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = String(ev.target?.result || '');
        const parsed = JSON.parse(text);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          showToast('Invalid backup file: Expected a JSON object.');
          return;
        }
        setPendingImportFileName(file.name);
        setPendingImportJson(parsed);
      } catch {
        showToast('Could not parse JSON file. Please select a valid backup.');
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (!pendingImportJson) return;
    const result = importStudioDataJSON(pendingImportJson);
    setPendingImportJson(null);
    setPendingImportFileName(null);
    setIsCategoryManagerOpen(false);
    if (result.success && result.counts) {
      showToast(
        `Studio backup restored: ${result.counts.products} products, ${result.counts.materials} materials, ${result.counts.packaging} packaging, and ${result.counts.rules} rules.`
      );
    } else {
      showToast(result.error || 'Could not import studio data.');
    }
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
          <div className="fixed bottom-5 right-5 z-50 bg-white border border-slate-200 text-[#2D3134] px-4 py-2.5 rounded-full shadow-md flex items-center gap-2 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 text-[#2A8C82] shrink-0" />
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
    <div className="min-h-screen bg-[#F8F9FA] text-[#2D3134] flex flex-col">
      {/* Top App Navigation */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
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
        onOpenCategoryManager={() => handleOpenCategoryManager()}
        onExportStudioData={handleExportBackup}
        onImportStudioData={handleTriggerImportBackup}
        onNavigateHome={() =>
          guardNavigation(() => {
            setIsSupplyModalOpen(false);
            setIsProductModalOpen(false);
            setIsFormDirty(false);
            navigateTo('/', true);
          })
        }
        onLogoClick={handleSmartLogoClick}
      />

      {/* Hidden File Input for Studio Data JSON Import */}
      <input
        ref={importInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleImportFileChange}
        className="hidden"
      />

      {/* Discreet, Dismissible Local Cache Warning Banner (for users working locally prior to cloud sync) */}
      {!user && !isLocalWarningDismissed && (
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-2">
          <div
            role="status"
            className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs text-[#2D3134]"
          >
            <p className="text-xs font-normal text-[#2D3134] leading-relaxed">
              ⚠️ Your recipes and materials are currently saved in your browser
              storage. Clearing your browser cache or history will erase this
              data.
            </p>

            <div className="flex flex-wrap items-center gap-2 shrink-0 ml-auto">
              <button
                type="button"
                onClick={handleExportBackup}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#F8F9FA] text-[#2D3134] border border-slate-200 text-xs font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-[#2A8C82] shrink-0" />
                <span>Export Studio Data (JSON)</span>
              </button>

              <button
                type="button"
                onClick={handleTriggerImportBackup}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#F8F9FA] text-[#2D3134] border border-slate-200 text-xs font-medium transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-[#E78358] shrink-0" />
                <span>Import Studio Data</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2A8C82]/10 hover:bg-[#2A8C82]/15 text-[#2A8C82] border border-[#2A8C82]/25 text-xs font-medium transition-colors"
              >
                <Cloud className="w-3.5 h-3.5 shrink-0" />
                <span>Cloud Sync ($1.99/mo or $18/yr)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsLocalWarningDismissed(true)}
                aria-label="Dismiss local storage warning"
                title="Dismiss warning"
                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#2D3134] hover:bg-[#F8F9FA] transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {isProductModalOpen ? (
          /* Dedicated Full-Screen View for Creating / Editing Product Recipes */
          <ProductBomModal
            isOpen={isProductModalOpen}
            editingProduct={editingProduct}
            materialsCatalog={materials}
            packagingCatalog={packaging}
            laborCatalog={laborRates}
            pricingRules={pricingRules}
            productCategories={productCategories}
            onDirtyChange={setIsFormDirty}
            onOpenCategoryManager={() => handleOpenCategoryManager('products')}
            onClose={() => {
              setIsProductModalOpen(false);
              setEditingProduct(null);
              setIsFormDirty(false);
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
        ) : isSupplyModalOpen ? (
          /* Dedicated Full-Screen View for Creating / Editing Materials, Packaging & Labor Rates */
          <ItemModal
            isOpen={isSupplyModalOpen}
            initialEntityType={modalEntityType}
            editingItem={editingItem}
            templateItem={templateSupplyItem}
            existingMaterials={materials}
            existingPackaging={packaging}
            materialCategories={materialCategories}
            packagingCategories={packagingCategories}
            onDirtyChange={setIsFormDirty}
            onOpenCategoryManager={(scope) => handleOpenCategoryManager(scope)}
            onClose={() => {
              setIsSupplyModalOpen(false);
              setEditingItem(null);
              setTemplateSupplyItem(null);
              setIsFormDirty(false);
            }}
            onSwitchToCreateProduct={() => {
              setEditingProduct(null);
              setTemplateSupplyItem(null);
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
              setTemplateSupplyItem(null);
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
              setTemplateSupplyItem(null);
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
        ) : (
          <>
            {activeTab === 'products' && (
              <ProductsView
                products={products}
                materials={materials}
                packaging={packaging}
                laborRates={laborRates}
                pricingRules={pricingRules}
                cascadeAlerts={cascadeAlerts}
                onOpenCategoryManager={() =>
                  handleOpenCategoryManager('products')
                }
                onOpenAddProduct={() => {
                  setEditingProduct(null);
                  setIsFormDirty(false);
                  setIsProductModalOpen(true);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onOpenEditProduct={(prod) => {
                  setEditingProduct(prod);
                  setIsFormDirty(false);
                  setIsProductModalOpen(true);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
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
                  showToast(
                    'Product price updated with latest material costs.'
                  );
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
                onDirtyChange={setIsFormDirty}
                onAddRule={(data) => {
                  const rule = addPricingRule(data);
                  showToast(`Created pricing rule "${rule.name}".`);
                  return rule;
                }}
                onUpdateRule={(id, data) => {
                  updatePricingRule(id, data);
                  showToast('Pricing rule updated');
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
                onDuplicate={(item) =>
                  handleDuplicateSupplyItem('materials', item)
                }
                onOpenCategoryManager={() =>
                  handleOpenCategoryManager('materials')
                }
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
                onDuplicate={(item) =>
                  handleDuplicateSupplyItem('packaging', item)
                }
                onOpenCategoryManager={() =>
                  handleOpenCategoryManager('packaging')
                }
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
          </>
        )}
      </main>

      {/* Unsaved Changes Confirmation Dialog when switching top-level tabs while editing */}
      {pendingNavAction && (
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
                  You have uncommitted changes in this form. If you leave now,
                  your edits will not be saved.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setPendingNavAction(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-[#F8F9FA] text-xs font-medium text-[#2D3134] transition-colors"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = pendingNavAction;
                  setPendingNavAction(null);
                  setIsFormDirty(false);
                  next();
                }}
                className="px-4 py-2 rounded-xl bg-[#E78358] hover:bg-[#d67147] text-white text-xs font-semibold shadow-sm transition-colors"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Pill Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-white border border-slate-200 text-[#2D3134] px-4 py-2.5 rounded-full shadow-md flex items-center gap-2 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-[#2A8C82] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Category Manager & Studio Data Backup Modal */}
      <CategoryManagerModal
        isOpen={isCategoryManagerOpen}
        initialScope={categoryManagerScope}
        materialCategories={materialCategories}
        packagingCategories={packagingCategories}
        productCategories={productCategories}
        materials={materials}
        packaging={packaging}
        products={products}
        onClose={() => setIsCategoryManagerOpen(false)}
        onAddCategory={addCategory}
        onRenameCategory={renameCategory}
        onDeleteCategory={deleteCategory}
        onExportBackup={handleExportBackup}
        onTriggerImportBackup={handleTriggerImportBackup}
      />

      {/* Safe Confirmation Dialog before Importing JSON Studio Backup */}
      {pendingImportJson !== null && (
        <div
          role="alertdialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D3134]/30 backdrop-blur-sm animate-fadeIn"
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg max-w-md w-full p-6 space-y-5">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#2A8C82]/10 border border-[#2A8C82]/25 text-[#2A8C82] flex items-center justify-center shrink-0">
                <Upload className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-[#2D3134]">
                  Importing will merge/restore your materials, products, and
                  rules. Do you want to proceed?
                </h3>
                <p className="text-xs font-normal text-[#64748B] leading-relaxed">
                  {pendingImportFileName
                    ? `Selected file: "${pendingImportFileName}". `
                    : ''}
                  Matching IDs or names will be updated and new items will be
                  added safely to your studio.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setPendingImportJson(null);
                  setPendingImportFileName(null);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-[#F8F9FA] text-xs font-medium text-[#2D3134] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                className="px-4 py-2 rounded-xl bg-[#2A8C82] hover:bg-[#23736B] text-white text-xs font-semibold shadow-sm transition-colors"
              >
                Proceed with Import
              </button>
            </div>
          </div>
        </div>
      )}

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
