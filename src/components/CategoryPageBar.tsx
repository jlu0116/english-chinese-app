import React, { useState } from 'react';
import { CategoryId, CategoryInfo, PageConfig } from '../types.ts';
import { CATEGORIES } from '../data/categories.ts';
import {
  Plane,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  Sparkles,
} from 'lucide-react';

interface CategoryPageBarProps {
  currentCategory: CategoryId;
  currentCatInfo: CategoryInfo;
  currentPage: number;
  pagesConfig: PageConfig[];
  completedPages: Record<number, boolean>;
  onSelectCategory: (catId: CategoryId) => void;
  onSelectPage: (pageNumber: number) => void;
  onOpenPagePicker: () => void;
}

export const CategoryPageBar: React.FC<CategoryPageBarProps> = ({
  currentCategory,
  currentCatInfo,
  currentPage,
  pagesConfig,
  completedPages,
  onSelectCategory,
  onSelectPage,
  onOpenPagePicker,
}) => {
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const totalPages = pagesConfig.length;
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;
  const isCurrentPageDone = completedPages[currentPage];

  return (
    <div
      className={`shrink-0 px-3 py-2 bg-[#F2F2F7] border-b border-black/[0.06] relative flex items-center justify-between select-none ${
        isCatDropdownOpen ? 'z-40' : 'z-20'
      }`}
    >
      {/* Left: "category" label + Left-aligned Category Dropdown */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs font-semibold text-slate-500 tracking-tight">
          分类
        </span>

        <div className="relative">
          <button
            id="btn-open-category-dropdown"
            onClick={() => setIsCatDropdownOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-2.5 h-8 sm:h-8.5 bg-white text-slate-800 rounded-lg text-xs font-semibold shadow-2xs border border-black/[0.06] hover:bg-slate-50 active:scale-95 cursor-pointer transition-all"
            title="点击展开选择场景分类"
          >
            {currentCategory === 'airport' ? (
              <Plane className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            ) : currentCategory === 'grocery' ? (
              <ShoppingCart className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            )}
            <span>{currentCatInfo.nameZh}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
                isCatDropdownOpen ? 'rotate-180 text-slate-700' : ''
              }`}
            />
          </button>

          {/* Dropdown Popover Menu - Left aligned under the button */}
          {isCatDropdownOpen && (
            <>
              {/* Click-outside backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsCatDropdownOpen(false)}
              />

              {/* Menu */}
              <div className="absolute top-full mt-1.5 left-0 w-48 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-black/[0.08] p-1.5 z-50 animate-fadeIn">
                <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  选择场景分类
                </div>
                {CATEGORIES.map((cat) => {
                  const isSelected = currentCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      id={`cat-option-${cat.id}`}
                      onClick={() => {
                        onSelectCategory(cat.id);
                        setIsCatDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-100 font-bold text-slate-900 shadow-2xs'
                          : 'text-slate-700 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0 text-xs shadow-2xs"
                          style={{ backgroundColor: cat.themeColor }}
                        >
                          {cat.id === 'airport' ? (
                            <Plane className="w-3.5 h-3.5" />
                          ) : cat.id === 'grocery' ? (
                            <ShoppingCart className="w-3.5 h-3.5" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div className="text-left">
                          <div className="text-xs font-semibold leading-tight text-slate-900">
                            {cat.nameZh}
                          </div>
                          <div className="text-[10px] text-slate-400 leading-tight">
                            {cat.totalWords} 词 · {cat.totalPages} 页
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-blue-600 stroke-[2.5] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right: Page Selector with Prev, Page Trigger Button, Next */}
      <div className="ml-auto flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Previous page arrow */}
        <button
          id="btn-prev-page"
          onClick={() => hasPrev && onSelectPage(currentPage - 1)}
          disabled={!hasPrev}
          className={`w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
            hasPrev
              ? 'bg-white text-slate-700 shadow-2xs hover:bg-slate-100 active:scale-95'
              : 'text-slate-300 opacity-40 cursor-not-allowed'
          }`}
          title="上一页"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page Picker Trigger (Opens modal/dropdown) */}
        <button
          id="btn-open-page-picker"
          onClick={onOpenPagePicker}
          className="flex items-center gap-1.5 px-2.5 h-8 sm:h-8.5 bg-white text-slate-800 rounded-lg text-xs font-semibold shadow-2xs border border-black/[0.06] hover:bg-slate-50 active:scale-95 cursor-pointer transition-all"
          title="点击展开全部页面选择"
        >
          <span className="tabular-nums">
            {currentPage}/{totalPages}页
          </span>
          {isCurrentPageDone && (
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[8px] font-bold shrink-0">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </span>
          )}
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </button>

        {/* Next page arrow */}
        <button
          id="btn-next-page"
          onClick={() => hasNext && onSelectPage(currentPage + 1)}
          disabled={!hasNext}
          className={`w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
            hasNext
              ? 'bg-white text-slate-700 shadow-2xs hover:bg-slate-100 active:scale-95'
              : 'text-slate-300 opacity-40 cursor-not-allowed'
          }`}
          title="下一页"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
