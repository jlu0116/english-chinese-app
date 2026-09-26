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
      className={`shrink-0 px-3.5 py-2.5 bg-[#F2F2F7] border-b border-black/[0.06] relative flex items-center justify-between select-none ${
        isCatDropdownOpen ? 'z-40' : 'z-20'
      }`}
    >
      {/* Left: "分类" label + Left-aligned Category Dropdown */}
      <div className="flex items-center gap-2.5 shrink-0">
        <span className="text-sm font-medium text-slate-600 tracking-tight">
          分类
        </span>

        <div className="relative">
          <button
            id="btn-open-category-dropdown"
            onClick={() => setIsCatDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 px-3 h-9 sm:h-9.5 bg-white text-slate-800 rounded-xl text-sm font-medium shadow-2xs border border-black/[0.06] hover:bg-slate-50 active:scale-95 cursor-pointer transition-all"
            title="点击展开选择场景分类"
          >
            {currentCategory === 'airport' ? (
              <Plane className="w-4 h-4 text-sky-600 shrink-0" />
            ) : currentCategory === 'grocery' ? (
              <ShoppingCart className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
            )}
            <span className="text-sm font-medium text-slate-800">{currentCatInfo.nameZh}</span>
            <ChevronDown
              className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${
                isCatDropdownOpen ? 'rotate-180 text-slate-800' : ''
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
              <div className="absolute top-full mt-1.5 left-0 w-52 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-black/[0.08] p-1.5 z-50 animate-fadeIn">
                <div className="px-2.5 py-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  选择场景分类
                </div>
                {CATEGORIES.map((cat) => {
                  const isSelected = currentCategory === cat.id;
                  const wordCount = cat.id === currentCatInfo.id ? currentCatInfo.totalWords : cat.totalWords;
                  const pageCount = cat.id === currentCatInfo.id ? currentCatInfo.totalPages : cat.totalPages;

                  return (
                    <button
                      key={cat.id}
                      id={`cat-option-${cat.id}`}
                      onClick={() => {
                        onSelectCategory(cat.id);
                        setIsCatDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-100 font-semibold text-slate-900 shadow-2xs'
                          : 'text-slate-700 hover:bg-slate-50 font-normal'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 text-xs shadow-2xs"
                          style={{ backgroundColor: cat.themeColor }}
                        >
                          {cat.id === 'airport' ? (
                            <Plane className="w-4 h-4" />
                          ) : cat.id === 'grocery' ? (
                            <ShoppingCart className="w-4 h-4" />
                          ) : (
                            <Sparkles className="w-4 h-4" />
                          )}
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-medium leading-tight text-slate-900">
                            {cat.nameZh}
                          </div>
                          <div className="text-xs text-slate-500 leading-tight mt-0.5">
                            {wordCount} 词 · {pageCount} 页
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-blue-600 stroke-[2.5] shrink-0" />
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
      <div className="ml-auto flex items-center gap-1.5 shrink-0">
        {/* Previous page arrow */}
        <button
          id="btn-prev-page"
          onClick={() => hasPrev && onSelectPage(currentPage - 1)}
          disabled={!hasPrev}
          className={`w-9 h-9 sm:w-9.5 sm:h-9.5 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            hasPrev
              ? 'bg-white text-slate-700 shadow-2xs hover:bg-slate-100 active:scale-95'
              : 'text-slate-300 opacity-40 cursor-not-allowed'
          }`}
          title="上一页"
        >
          <ChevronLeft className="w-4.5 h-4.5" />
        </button>

        {/* Page Picker Trigger (Opens modal/dropdown) */}
        <button
          id="btn-open-page-picker"
          onClick={onOpenPagePicker}
          className="flex items-center gap-2 px-3 h-9 sm:h-9.5 bg-white text-slate-800 rounded-xl text-sm font-medium shadow-2xs border border-black/[0.06] hover:bg-slate-50 active:scale-95 cursor-pointer transition-all"
          title="点击展开全部页面选择"
        >
          <span className="tabular-nums font-medium text-sm text-slate-800">
            {currentPage}/{totalPages}页
          </span>
          {isCurrentPageDone && (
            <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold shrink-0">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </span>
          )}
          <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
        </button>

        {/* Next page arrow */}
        <button
          id="btn-next-page"
          onClick={() => hasNext && onSelectPage(currentPage + 1)}
          disabled={!hasNext}
          className={`w-9 h-9 sm:w-9.5 sm:h-9.5 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            hasNext
              ? 'bg-white text-slate-700 shadow-2xs hover:bg-slate-100 active:scale-95'
              : 'text-slate-300 opacity-40 cursor-not-allowed'
          }`}
          title="下一页"
        >
          <ChevronRight className="w-4.5 h-4.5" />
        </button>
      </div>
    </div>
  );
};
