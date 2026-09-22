import React from 'react';
import { PageConfig, CategoryInfo } from '../types.ts';
import { X, Check, BookOpen, ChevronRight, Sparkles } from 'lucide-react';

interface PagePickerModalProps {
  isOpen: boolean;
  currentPage: number;
  pagesConfig: PageConfig[];
  categoryInfo: CategoryInfo;
  completedPages: Record<number, boolean>;
  onClose: () => void;
  onSelectPage: (pageNumber: number) => void;
}

export const PagePickerModal: React.FC<PagePickerModalProps> = ({
  isOpen,
  currentPage,
  pagesConfig,
  categoryInfo,
  completedPages,
  onClose,
  onSelectPage,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm flex flex-col justify-end animate-fadeIn">
      {/* iOS Modal Sheet */}
      <div className="bg-[#F2F2F7] w-full max-h-[85%] rounded-t-[32px] flex flex-col shadow-2xl overflow-hidden border-t border-white/40 animate-slideUp">
        {/* Grabber bar */}
        <div className="pt-3 pb-1 flex justify-center">
          <div className="w-10 h-1.5 bg-slate-300 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="px-5 py-3 flex items-center justify-between border-b border-black/[0.06] bg-white/70 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-xs"
              style={{ backgroundColor: categoryInfo.themeColor }}
            >
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                选择练习页面
              </h2>
              <p className="text-xs text-slate-500">
                {categoryInfo.nameZh} · 共 {pagesConfig.length} 页 ({categoryInfo.totalWords} 词)
              </p>
            </div>
          </div>
          <button
            id="btn-close-page-picker"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/80 flex items-center justify-center text-slate-600 hover:bg-slate-300 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Page List */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2">
          {pagesConfig.map((page) => {
            const isSelected = page.pageNumber === currentPage;
            const isDone = completedPages[page.pageNumber];

            return (
              <button
                key={page.pageNumber}
                id={`page-select-item-${page.pageNumber}`}
                onClick={() => {
                  onSelectPage(page.pageNumber);
                  onClose();
                }}
                className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? 'bg-white shadow-sm ring-2 ring-black/[0.08]'
                    : 'bg-white/80 border-black/[0.05] hover:bg-white hover:border-black/[0.1] shadow-2xs'
                }`}
                style={
                  isSelected
                    ? {
                        borderColor: categoryInfo.themeColor,
                        backgroundColor: '#ffffff',
                      }
                    : undefined
                }
              >
                <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                  {/* Page number pill */}
                  <div
                    className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 transition-colors font-bold ${
                      isSelected
                        ? 'text-white'
                        : isDone
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                    style={
                      isSelected
                        ? { backgroundColor: categoryInfo.themeColor }
                        : undefined
                    }
                  >
                    <span className="text-[10px] leading-none opacity-80">P.</span>
                    <span className="text-sm leading-tight">{page.pageNumber}</span>
                  </div>

                  {/* Title & Subtitle */}
                  <div className="truncate flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-slate-900">
                        {page.titleZh}
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal">
                        {page.titleEn}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {page.subtitleZh}
                    </p>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="shrink-0 flex items-center gap-1.5">
                  {isDone ? (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-semibold">
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>已通关</span>
                    </span>
                  ) : isSelected ? (
                    <span
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
                      style={{
                        backgroundColor: `${categoryInfo.themeColor}15`,
                        color: categoryInfo.themeColor,
                      }}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>当前页</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-medium px-1.5 py-0.5 rounded-full bg-slate-100">
                      8 组
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-white/70 border-t border-black/[0.06] text-center text-[11px] text-slate-400 font-medium">
          点击任意页面直接开始配对练习
        </div>
      </div>
    </div>
  );
};
