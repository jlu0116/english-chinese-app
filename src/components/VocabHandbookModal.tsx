import React, { useState, useEffect, useRef } from 'react';
import { VocabItem, CategoryId } from '../types.ts';
import {
  CATEGORIES,
  getCategoryInfo,
  getCategoryVocab,
  getCategoryZoneConfig,
} from '../data/categories.ts';
import { speakEnglish } from '../utils/audio.ts';
import { X, Volume2, Search, BookOpen, Plane, ShoppingCart } from 'lucide-react';

interface VocabHandbookModalProps {
  isOpen: boolean;
  activeCategoryId: CategoryId;
  onClose: () => void;
  onSelectCategory?: (id: CategoryId) => void;
}

export const VocabHandbookModal: React.FC<VocabHandbookModalProps> = ({
  isOpen,
  activeCategoryId,
  onClose,
  onSelectCategory,
}) => {
  const [selectedCatId, setSelectedCatId] = useState<CategoryId>(activeCategoryId);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeZone, setActiveZone] = useState<string>('all');

  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef<number>(0);
  const isPointerDownRef = useRef<boolean>(false);
  const activePointerIdRef = useRef<number | null>(null);

  useEffect(() => {
    setSelectedCatId(activeCategoryId);
  }, [activeCategoryId]);

  useEffect(() => {
    if (isOpen) {
      setDragY(0);
      setIsDragging(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentCatInfo = getCategoryInfo(selectedCatId);
  const currentVocab = getCategoryVocab(selectedCatId);
  const zoneConfig = getCategoryZoneConfig(selectedCatId);

  const filteredVocab = currentVocab.filter((item: VocabItem) => {
    const matchesSearch =
      item.english.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.chinese.includes(searchQuery);
    const matchesZone = activeZone === 'all' || item.category === activeZone;
    return matchesSearch && matchesZone;
  });

  const handleSwitchCat = (catId: CategoryId) => {
    setSelectedCatId(catId);
    setActiveZone('all');
    if (onSelectCategory) {
      onSelectCategory(catId);
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    isPointerDownRef.current = true;
    activePointerIdRef.current = e.pointerId;
    startYRef.current = e.clientY;
    setIsDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPointerDownRef.current) return;
    const delta = e.clientY - startYRef.current;
    if (delta > 0) {
      setDragY(delta);
    } else {
      setDragY(delta * 0.15);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;
    setIsDragging(false);

    try {
      if (activePointerIdRef.current !== null) {
        e.currentTarget.releasePointerCapture(activePointerIdRef.current);
      }
    } catch {
      // ignore
    }
    activePointerIdRef.current = null;

    if (dragY > 75) {
      setDragY(window.innerHeight || 500);
      setTimeout(() => {
        setDragY(0);
        onClose();
      }, 180);
    } else {
      setDragY(0);
    }
  };

  return (
    <div
      id="handbook-backdrop"
      onClick={onClose}
      style={{
        backgroundColor: `rgba(0, 0, 0, ${Math.max(0.05, 0.4 * (1 - dragY / 300))})`,
      }}
      className="absolute inset-0 z-50 backdrop-blur-sm flex flex-col justify-end animate-fadeIn cursor-pointer"
    >
      {/* iOS Modal Sheet */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: dragY !== 0 ? `translateY(${dragY}px)` : undefined,
          transition: isDragging ? 'none' : 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className={`bg-[#F2F2F7] w-full max-h-[90%] rounded-t-[32px] flex flex-col shadow-2xl overflow-hidden border-t border-white/40 cursor-default ${
          !isDragging && dragY === 0 ? 'animate-slideUp' : ''
        }`}
      >
        {/* Grabber bar - draggable slider */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="pt-3 pb-2 flex justify-center cursor-grab active:cursor-grabbing touch-none select-none hover:bg-black/[0.02]"
          title="按住往下拉可收起"
        >
          <div className="w-12 h-1.5 bg-slate-300 hover:bg-slate-400 active:bg-slate-500 rounded-full transition-colors"></div>
        </div>

        {/* Header - also draggable to dismiss */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="px-5 py-3 flex items-center justify-between border-b border-black/[0.06] bg-white/70 backdrop-blur-md select-none cursor-grab active:cursor-grabbing touch-none"
        >
          <div className="flex items-center gap-2 pointer-events-none">
            <div className="w-8 h-8 rounded-xl bg-[#007AFF]/10 flex items-center justify-center text-[#007AFF]">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                {currentCatInfo.nameZh} 词汇速查手册
              </h2>
              <p className="text-xs text-slate-500">
                {currentCatInfo.nameEn} Vocabulary Reference ({currentCatInfo.totalWords} Words)
              </p>
            </div>
          </div>
          <button
            id="btn-close-handbook"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-8 h-8 rounded-full bg-slate-200/80 flex items-center justify-center text-slate-600 hover:bg-slate-300 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category Switcher in Handbook */}
        <div className="px-4 pt-3 pb-2 bg-white/50 border-b border-black/[0.04]">
          <div className="grid grid-cols-2 p-1 bg-slate-200/80 rounded-2xl gap-1 text-xs">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleSwitchCat(cat.id)}
                className={`py-1.5 px-3 rounded-xl flex items-center justify-center gap-1.5 font-semibold transition-all cursor-pointer ${
                  selectedCatId === cat.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat.id === 'airport' ? (
                  <Plane className="w-3.5 h-3.5 text-[#007AFF]" />
                ) : (
                  <ShoppingCart className="w-3.5 h-3.5 text-emerald-600" />
                )}
                <span>
                  {cat.nameZh} ({cat.totalWords}词)
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 bg-white/50 backdrop-blur-sm border-b border-black/[0.06] space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="input-vocab-search"
              type="text"
              placeholder={`搜索${currentCatInfo.nameZh}英文单词或中文含义...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-200/70 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#007AFF]/40"
            />
          </div>

          {/* Sub-Category / Zone Tabs */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {Object.entries(zoneConfig).map(([key, zone]) => (
              <button
                key={key}
                onClick={() => setActiveZone(key)}
                className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer shrink-0 ${
                  activeZone === key
                    ? 'bg-[#007AFF] text-white shadow-xs'
                    : 'bg-slate-200/80 text-slate-600 hover:bg-slate-300'
                }`}
              >
                {zone.nameZh}
              </button>
            ))}
          </div>
        </div>

        {/* Word List (English on Left, Chinese on Right) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredVocab.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">没有找到相关词汇</div>
          ) : (
            filteredVocab.map((vocab: VocabItem) => {
              const zone = zoneConfig[vocab.category] || zoneConfig['all'];
              return (
                <div
                  key={vocab.id}
                  className="bg-white rounded-2xl p-3.5 border border-black/[0.06] shadow-xs hover:border-[#007AFF]/40 transition-all group"
                >
                  <div className="flex items-center justify-between gap-3">
                    {/* Left: English with audio button */}
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <button
                        onClick={() => speakEnglish(vocab.english, true)}
                        className="w-8 h-8 rounded-full bg-blue-50 text-[#007AFF] flex items-center justify-center shrink-0 hover:bg-[#007AFF] hover:text-white transition-colors cursor-pointer"
                        title="点击收听英文发音"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                      <div className="truncate">
                        <div className="text-sm font-bold text-slate-900 tracking-tight">
                          {vocab.english}
                        </div>
                        {zone && (
                          <span
                            className="text-[10px] font-medium px-1.5 py-0.5 rounded-sm"
                            style={{
                              backgroundColor: `${zone.color}15`,
                              color: zone.color,
                            }}
                          >
                            {zone.nameZh.includes('：') ? zone.nameZh.split('：')[1] : zone.nameZh}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Chinese Characters (No Pinyin) */}
                    <div className="text-right shrink-0">
                      <div className="text-base font-semibold text-slate-800 tracking-wide font-sans">
                        {vocab.chinese}
                      </div>
                    </div>
                  </div>

                  {/* Sentence Context */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-0.5">
                    <div className="text-slate-700 font-medium flex items-center justify-between">
                      <span>“{vocab.exampleEn}”</span>
                      <button
                        onClick={() => speakEnglish(vocab.exampleEn, true)}
                        className="text-[#007AFF] text-[10px] hover:underline cursor-pointer ml-2"
                      >
                        读例句
                      </button>
                    </div>
                    <div className="text-slate-400">“{vocab.exampleZh}”</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-white/70 border-t border-black/[0.06] text-center text-[11px] text-slate-400 font-medium">
          已显示 {filteredVocab.length} / {currentCatInfo.totalWords} 核心{currentCatInfo.nameZh}词汇
        </div>
      </div>
    </div>
  );
};
