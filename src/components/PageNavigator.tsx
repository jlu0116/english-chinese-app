import React from 'react';
import { PageConfig } from '../types.ts';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface PageNavigatorProps {
  currentPage: number;
  pagesConfig: PageConfig[];
  onSelectPage: (pageNumber: number) => void;
  completedPages: Record<number, boolean>;
}

export const PageNavigator: React.FC<PageNavigatorProps> = ({
  currentPage,
  pagesConfig,
  onSelectPage,
  completedPages,
}) => {
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < pagesConfig.length;

  return (
    <div className="px-3 py-2 bg-[#F2F2F7] border-b border-black/[0.06] flex items-center justify-between gap-1.5 select-none">
      {/* Prev Page Button */}
      <button
        id="btn-prev-page"
        onClick={() => hasPrev && onSelectPage(currentPage - 1)}
        disabled={!hasPrev}
        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
          hasPrev
            ? 'bg-white text-slate-700 shadow-2xs hover:bg-slate-100 active:scale-95'
            : 'text-slate-300 opacity-40 cursor-not-allowed'
        }`}
        title="上一页"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Dynamic Page Badges / Segments */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {pagesConfig.map((cfg) => {
          const isSelected = currentPage === cfg.pageNumber;
          const isDone = completedPages[cfg.pageNumber];

          return (
            <button
              key={cfg.pageNumber}
              id={`tab-page-${cfg.pageNumber}`}
              onClick={() => onSelectPage(cfg.pageNumber)}
              className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-white text-slate-900 shadow-xs border border-black/[0.08]'
                  : 'bg-black/[0.04] text-slate-600 hover:bg-black/[0.08]'
              }`}
            >
              <span>第 {cfg.pageNumber} 页</span>
              {isDone ? (
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
              ) : (
                <span
                  className={`text-[9px] px-1 py-0.2 rounded-full font-medium ${
                    isSelected ? 'bg-slate-100 text-slate-500' : 'bg-black/[0.05] text-slate-400'
                  }`}
                >
                  8组
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Next Page Button */}
      <button
        id="btn-next-page"
        onClick={() => hasNext && onSelectPage(currentPage + 1)}
        disabled={!hasNext}
        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
          hasNext
            ? 'bg-white text-slate-700 shadow-2xs hover:bg-slate-100 active:scale-95'
            : 'text-slate-300 opacity-40 cursor-not-allowed'
        }`}
        title="下一页"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};
