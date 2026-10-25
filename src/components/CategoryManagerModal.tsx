import React, { useState, useMemo } from 'react';
import {
  X,
  FolderKanban,
  Plus,
  Pencil,
  Trash2,
  Check,
  Layers,
  Package,
  ShoppingBag,
  Download,
  Upload,
} from 'lucide-react';
import { MaterialItem, PackagingItem, ProductItem } from '../types/pricing';

export type CategoryScope = 'materials' | 'packaging' | 'products';

interface CategoryManagerModalProps {
  isOpen: boolean;
  initialScope?: CategoryScope;
  materialCategories: string[];
  packagingCategories: string[];
  productCategories: string[];
  materials: MaterialItem[];
  packaging: PackagingItem[];
  products: ProductItem[];
  onClose: () => void;
  onAddCategory: (scope: CategoryScope, name: string) => void;
  onRenameCategory: (
    scope: CategoryScope,
    oldName: string,
    newName: string
  ) => void;
  onDeleteCategory: (scope: CategoryScope, name: string) => void;
  onExportBackup: () => void;
  onTriggerImportBackup: () => void;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  initialScope = 'materials',
  materialCategories,
  packagingCategories,
  productCategories,
  materials,
  packaging,
  products,
  onClose,
  onAddCategory,
  onRenameCategory,
  onDeleteCategory,
  onExportBackup,
  onTriggerImportBackup,
}) => {
  const [scope, setScope] = useState<CategoryScope>(initialScope);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [renamingCategory, setRenamingCategory] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setScope(initialScope);
      setNewCategoryName('');
      setRenamingCategory(null);
      setRenameDraft('');
      setFeedback(null);
    }
  }, [isOpen, initialScope]);

  const activeCategories = useMemo(() => {
    const base =
      scope === 'materials'
        ? materialCategories
        : scope === 'packaging'
        ? packagingCategories
        : productCategories;

    const itemCats =
      scope === 'materials'
        ? materials.map((m) => m.category)
        : scope === 'packaging'
        ? packaging.map((p) => p.category)
        : products.map((p) => p.category);

    return Array.from(new Set([...base, ...itemCats].filter(Boolean))).sort(
      (a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })
    );
  }, [
    scope,
    materialCategories,
    packagingCategories,
    productCategories,
    materials,
    packaging,
    products,
  ]);

  const usageCounts = useMemo(() => {
    const map: Record<string, number> = {};
    const list =
      scope === 'materials'
        ? materials
        : scope === 'packaging'
        ? packaging
        : products;
    list.forEach((item) => {
      if (item.category) {
        map[item.category] = (map[item.category] || 0) + 1;
      }
    });
    return map;
  }, [scope, materials, packaging, products]);

  if (!isOpen) return null;

  const showTempFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => {
      setFeedback((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    onAddCategory(scope, trimmed);
    setNewCategoryName('');
    showTempFeedback(`Added category "${trimmed}".`);
  };

  const handleStartRename = (cat: string) => {
    setRenamingCategory(cat);
    setRenameDraft(cat);
  };

  const handleCommitRename = (oldName: string) => {
    const trimmed = renameDraft.trim();
    if (!trimmed || trimmed === oldName) {
      setRenamingCategory(null);
      return;
    }
    onRenameCategory(scope, oldName, trimmed);
    setRenamingCategory(null);
    showTempFeedback(
      `Renamed "${oldName}" to "${trimmed}" and updated assigned items.`
    );
  };

  const handleRemoveCategory = (cat: string) => {
    const count = usageCounts[cat] || 0;
    if (count > 0) return;
    onDeleteCategory(scope, cat);
    showTempFeedback(`Deleted unused category "${cat}".`);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-manager-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D3134]/30 backdrop-blur-sm animate-fadeIn"
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg max-w-xl w-full overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#2A8C82]/10 border border-[#2A8C82]/25 text-[#2A8C82] flex items-center justify-center shrink-0">
              <FolderKanban className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="category-manager-title"
                className="text-base font-semibold text-[#2D3134]"
              >
                Category Manager & Studio Data
              </h2>
              <p className="text-xs font-normal text-[#64748B]">
                Rename categories, remove unused ones, or back up your studio
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#64748B] hover:text-[#2D3134] hover:bg-[#F8F9FA] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scope Tabs */}
        <div className="px-6 pt-4 pb-2 bg-[#F8F9FA] border-b border-slate-200 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setScope('materials');
              setRenamingCategory(null);
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs transition-all ${
              scope === 'materials'
                ? 'bg-white text-[#2A8C82] font-semibold shadow-xs border border-slate-200'
                : 'text-[#64748B] hover:text-[#2D3134] font-medium'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#E78358]" />
            <span>Materials</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setScope('packaging');
              setRenamingCategory(null);
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs transition-all ${
              scope === 'packaging'
                ? 'bg-white text-[#2A8C82] font-semibold shadow-xs border border-slate-200'
                : 'text-[#64748B] hover:text-[#2D3134] font-medium'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-[#F4B266]" />
            <span>Packaging</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setScope('products');
              setRenamingCategory(null);
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs transition-all ${
              scope === 'products'
                ? 'bg-white text-[#2A8C82] font-semibold shadow-xs border border-slate-200'
                : 'text-[#64748B] hover:text-[#2D3134] font-medium'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-[#2A8C82]" />
            <span>Products</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {feedback && (
            <div className="px-3.5 py-2.5 rounded-xl bg-[#2A8C82]/10 border border-[#2A8C82]/25 text-[#2A8C82] text-xs font-medium flex items-center gap-2">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>{feedback}</span>
            </div>
          )}

          {/* Add New Category Form */}
          <form onSubmit={handleCreateCategory} className="flex gap-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder={`Add new ${scope} category...`}
              className="flex-1 px-3.5 py-2 bg-white border border-slate-200 focus:border-[#2A8C82] focus:ring-1 focus:ring-[#2A8C82] outline-none rounded-xl text-xs font-normal text-[#2D3134] placeholder:text-[#64748B]"
            />
            <button
              type="submit"
              disabled={!newCategoryName.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2A8C82] hover:bg-[#23736B] disabled:opacity-40 text-white text-xs font-semibold transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5 text-[#F4B266]" />
              <span>Add Category</span>
            </button>
          </form>

          {/* Categories List */}
          <div className="divide-y divide-slate-200 border border-slate-200 rounded-2xl overflow-hidden bg-white">
            {activeCategories.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#64748B]">
                No categories defined yet.
              </div>
            ) : (
              activeCategories.map((cat) => {
                const count = usageCounts[cat] || 0;
                const isRenaming = renamingCategory === cat;

                return (
                  <div
                    key={cat}
                    className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-[#F8F9FA] transition-colors"
                  >
                    {isRenaming ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          autoFocus
                          value={renameDraft}
                          onChange={(e) => setRenameDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleCommitRename(cat);
                            }
                            if (e.key === 'Escape') {
                              setRenamingCategory(null);
                            }
                          }}
                          className="flex-1 px-3 py-1.5 bg-white border border-[#2A8C82] focus:ring-1 focus:ring-[#2A8C82] outline-none rounded-xl text-xs font-medium text-[#2D3134]"
                        />
                        <button
                          type="button"
                          onClick={() => handleCommitRename(cat)}
                          className="px-3 py-1.5 rounded-xl bg-[#2A8C82] hover:bg-[#23736B] text-white text-xs font-semibold"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setRenamingCategory(null)}
                          className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-[#64748B] hover:text-[#2D3134]"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-xs font-medium text-[#2D3134] truncate">
                            {cat}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#F8F9FA] border border-slate-200 text-[11px] font-normal text-[#64748B] shrink-0">
                            {count} {count === 1 ? 'item' : 'items'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartRename(cat)}
                            title="Rename category (updates assigned items)"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-normal text-[#64748B] hover:text-[#2D3134] hover:bg-white border border-transparent hover:border-slate-200 transition-colors"
                          >
                            <Pencil className="w-3 h-3" />
                            <span>Rename</span>
                          </button>

                          <button
                            type="button"
                            disabled={count > 0}
                            onClick={() => handleRemoveCategory(cat)}
                            title={
                              count > 0
                                ? `Cannot delete while assigned to ${count} item(s)`
                                : 'Delete unused category'
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-normal text-[#64748B] hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Local Backup & Restore Section */}
          <div className="p-4 rounded-2xl bg-[#F8F9FA] border border-slate-200 space-y-3">
            <div>
              <h3 className="text-xs font-semibold text-[#2D3134]">
                Data Backup & Restore (JSON)
              </h3>
              <p className="text-[11px] font-normal text-[#64748B] mt-0.5">
                Download a complete local backup of your products, materials,
                packaging, labor rates, and pricing rules or restore from a
                file.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={onExportBackup}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#F8F9FA] text-[#2D3134] border border-slate-200 text-xs font-medium shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-[#2A8C82]" />
                <span>Export Studio Data (JSON)</span>
              </button>

              <button
                type="button"
                onClick={onTriggerImportBackup}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#F8F9FA] text-[#2D3134] border border-slate-200 text-xs font-medium shadow-xs transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-[#E78358]" />
                <span>Import Studio Data</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-white flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#2A8C82] hover:bg-[#23736B] text-white text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
