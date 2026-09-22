import React from 'react';
import { CategoryId, CategoryInfo, PageConfig } from '../types.ts';
import { CATEGORIES } from '../data/categories.ts';
import { Plane, ShoppingCart, ChevronLeft, ChevronRight, ChevronDown, Check } from 'lucide-react';

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
  const totalPages = pagesConfig.length;
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;
  const isCurrentPageDone = completedPages[currentPage];

  return (
    <div className="shrink-0 px-3 py-1.5 bg-[#F2F2F7] border-b border-black/[0.06] flex items-center justify-between gap-1.5 select-none">
      {/* Left: Compact Category Segmented Control */}
      <div className="flex p-0.5 bg-slate-200/80 rounded-xl text-xs font-semibold shrink-0">
        {CATEGORIES.map((cat) => {
          const isSelected = currentCategory === cat.id;

          return (
            <button
              key={cat.id}
              id={`cat-picker-${cat.id}`}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all duration-150 cursor-pointer ${
                isSelected
                  ? 'bg-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
              style={isSelected ? { color: cat.themeColor } : undefined}
            >
              {cat.id === 'airport' ? (
                <Plane className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>{cat.nameZh}</span>
              <span className="text-[10px] opacity-70 font-normal">
                ({cat.totalWords})
              </span>
            </button>
          );
        })}
      </div>

      {/* Right: Page Selector with Prev, Page Trigger Button, Next */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Previous page arrow */}
        <button
          id="btn-prev-page"
          onClick={() => hasPrev && onSelectPage(currentPage - 1)}
          disabled={!hasPrev}
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
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
          className="flex items-center gap-1 px-2.5 py-1.5 bg-white text-slate-800 rounded-lg text-xs font-semibold shadow-2xs border border-black/[0.06] hover:bg-slate-50 active:scale-95 cursor-pointer transition-all"
          title="点击展开全部页面选择"
        >
          <span className="tabular-nums">
            第 {currentPage}/{totalPages} 页
          </span>
          {isCurrentPageDone && (
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </span>
          )}
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
        </button>

        {/* Next page arrow */}
        <button
          id="btn-next-page"
          onClick={() => hasNext && onSelectPage(currentPage + 1)}
          disabled={!hasNext}
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
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
