import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MatchCard, GameStats, VocabItem, CategoryId } from '../types.ts';
import {
  getCategoryInfo,
  getCategoryPagesConfig,
  getCategoryPageItems,
} from '../data/categories.ts';
import {
  playSelectSound,
  playMatchSound,
  playErrorSound,
  playVictorySound,
  speakEnglish,
  speakEncouragement,
  setSoundEffectsEnabled,
  setSpeechEnabled,
} from '../utils/audio.ts';
import {
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Flame,
  RotateCcw,
  BookOpen,
  CheckCircle2,
  Plane,
  ShoppingCart,
  Pointer,
} from 'lucide-react';
import { VictoryModal } from './VictoryModal.tsx';
import { VocabHandbookModal } from './VocabHandbookModal.tsx';
import { PagePickerModal } from './PagePickerModal.tsx';
import { CategoryPageBar } from './CategoryPageBar.tsx';

const CARDS_PER_PAGE = 8;

// Fisher-Yates shuffle that ensures at least partial derangement
function shuffleCards(items: VocabItem[]): VocabItem[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  // If the first item didn't move and length > 1, swap it with another
  if (result.length > 1 && result[0].id === items[0].id) {
    const swapIdx = Math.floor(Math.random() * (result.length - 1)) + 1;
    [result[0], result[swapIdx]] = [result[swapIdx], result[0]];
  }
  return result;
}

export const PaiMatchGame: React.FC = () => {
  const [currentCategory, setCurrentCategory] = useState<CategoryId>('airport');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [completedPagesByCategory, setCompletedPagesByCategory] = useState<
    Record<CategoryId, Record<number, boolean>>
  >({
    airport: {},
    grocery: {},
  });

  // Active decks on current page (exactly 8 cards each)
  const [leftCards, setLeftCards] = useState<MatchCard[]>([]);
  const [rightCards, setRightCards] = useState<MatchCard[]>([]);
  const [selectedLeft, setSelectedLeft] = useState<MatchCard | null>(null);
  const [selectedRight, setSelectedRight] = useState<MatchCard | null>(null);

  // Temporary highlight for matching right card when replaying speaker audio
  const [highlightedMatchedVocabId, setHighlightedMatchedVocabId] = useState<string | null>(null);
  const highlightTimerRef = React.useRef<number | null>(null);

  const triggerMatchedHighlight = useCallback((vocabId: string) => {
    if (highlightTimerRef.current) {
      window.clearTimeout(highlightTimerRef.current);
    }
    setHighlightedMatchedVocabId(vocabId);
    highlightTimerRef.current = window.setTimeout(() => {
      setHighlightedMatchedVocabId(null);
    }, 1100);
  }, []);

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) window.clearTimeout(highlightTimerRef.current);
    };
  }, []);

  // Sound & Speech settings
  const [soundOn, setSoundOn] = useState<boolean>(true);
  const [speechOn, setSpeechOn] = useState<boolean>(true);

  // Modals
  const [isHandbookOpen, setIsHandbookOpen] = useState<boolean>(false);
  const [isVictoryOpen, setIsVictoryOpen] = useState<boolean>(false);
  const [isPagePickerOpen, setIsPagePickerOpen] = useState<boolean>(false);

  // Stats for current round/page
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    streak: 0,
    maxStreak: 0,
    correctPairs: 0,
    totalAttempts: 0,
    startTime: Date.now(),
    elapsedSeconds: 0,
  });

  const [isGameActive, setIsGameActive] = useState<boolean>(true);

  // Current Category info and pages configuration
  const currentCatInfo = useMemo(() => getCategoryInfo(currentCategory), [currentCategory]);
  const pagesConfig = useMemo(() => getCategoryPagesConfig(currentCategory), [currentCategory]);

  const currentPageConfig = useMemo(() => {
    return (
      pagesConfig.find((p) => p.pageNumber === currentPage) ||
      pagesConfig[0]
    );
  }, [pagesConfig, currentPage]);

  const totalPages = pagesConfig.length;
  const hasNextPage = currentPage < totalPages;

  // Start or reset a page with exactly 8 cards and zero duplicates
  const loadPage = useCallback((pageNumber: number, categoryId: CategoryId) => {
    const pageItems = getCategoryPageItems(categoryId, pageNumber);

    // Left Column: 8 English cards (shuffled to create fresh order)
    const shuffledLeft = shuffleCards(pageItems);
    const newLeft: MatchCard[] = shuffledLeft.map((item) => ({
      id: `left-${item.id}`,
      vocabId: item.id,
      text: item.english,
      type: 'english',
      isMatched: false,
      isWrong: false,
      isSelected: false,
    }));

    // Right Column: 8 Chinese cards (shuffled independently)
    const shuffledRight = shuffleCards(pageItems);
    const newRight: MatchCard[] = shuffledRight.map((item) => ({
      id: `right-${item.id}`,
      vocabId: item.id,
      text: item.chinese,
      type: 'chinese',
      isMatched: false,
      isWrong: false,
      isSelected: false,
    }));

    setLeftCards(newLeft);
    setRightCards(newRight);
    setSelectedLeft(null);
    setSelectedRight(null);
    setIsVictoryOpen(false);
    setIsGameActive(true);

    setStats({
      score: 0,
      streak: 0,
      maxStreak: 0,
      correctPairs: 0,
      totalAttempts: 0,
      startTime: Date.now(),
      elapsedSeconds: 0,
    });
  }, []);

  // When currentPage or currentCategory changes, reload cards
  useEffect(() => {
    loadPage(currentPage, currentCategory);
  }, [currentPage, currentCategory, loadPage]);

  // Switch category
  const handleSelectCategory = (catId: CategoryId) => {
    if (catId === currentCategory) return;
    setCurrentCategory(catId);
    setCurrentPage(1);
  };

  // Page switch handler
  const handleSelectPage = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Timer loop
  useEffect(() => {
    if (!isGameActive || isVictoryOpen) return;
    const interval = setInterval(() => {
      setStats((prev) => ({
        ...prev,
        elapsedSeconds: Math.floor((Date.now() - prev.startTime) / 1000),
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, [isGameActive, isVictoryOpen]);

  // Evaluate matching pair
  const evaluatePair = (leftCard: MatchCard, rightCard: MatchCard) => {
    const isCorrect = leftCard.vocabId === rightCard.vocabId;

    if (isCorrect) {
      // 1. Success sound
      playMatchSound(stats.streak + 1);

      // 2. Mark both cards as matched - they STAY ON SCREEN with success state!
      setLeftCards((prev) =>
        prev.map((c) => (c.id === leftCard.id ? { ...c, isMatched: true, isWrong: false } : c))
      );
      setRightCards((prev) =>
        prev.map((c) => (c.id === rightCard.id ? { ...c, isMatched: true, isWrong: false } : c))
      );

      // Clear selection
      setSelectedLeft(null);
      setSelectedRight(null);

      // 3. Update stats
      setStats((prev) => {
        const newAttempts = prev.totalAttempts + 1;
        const newCorrect = prev.correctPairs + 1;
        const newStreak = prev.streak + 1;
        const streakBonus = Math.min(newStreak, 5) * 50;
        const newScore = prev.score + 100 + streakBonus;

        // Check if all 8 cards on this page are matched!
        if (newCorrect >= CARDS_PER_PAGE) {
          setIsGameActive(false);
          setCompletedPagesByCategory((old) => ({
            ...old,
            [currentCategory]: {
              ...old[currentCategory],
              [currentPage]: true,
            },
          }));

          // Delay slightly so the learner sees the 8th card glow green before modal pops up
          setTimeout(() => {
            playVictorySound();
            setIsVictoryOpen(true);
          }, 450);

          // Delay the "加油！" voice about half a second later
          setTimeout(() => {
            speakEncouragement('加油！');
          }, 950);
        }

        return {
          ...prev,
          totalAttempts: newAttempts,
          correctPairs: newCorrect,
          streak: newStreak,
          maxStreak: Math.max(prev.maxStreak, newStreak),
          score: newScore,
        };
      });
    } else {
      // Wrong match
      playErrorSound();

      // Shake both cards red
      setLeftCards((prev) =>
        prev.map((c) => (c.id === leftCard.id ? { ...c, isWrong: true } : c))
      );
      setRightCards((prev) =>
        prev.map((c) => (c.id === rightCard.id ? { ...c, isWrong: true } : c))
      );

      setStats((prev) => ({
        ...prev,
        totalAttempts: prev.totalAttempts + 1,
        streak: 0,
      }));

      setTimeout(() => {
        setLeftCards((prev) =>
          prev.map((c) => (c.id === leftCard.id ? { ...c, isWrong: false } : c))
        );
        setRightCards((prev) =>
          prev.map((c) => (c.id === rightCard.id ? { ...c, isWrong: false } : c))
        );
        setSelectedLeft(null);
        setSelectedRight(null);
      }, 550);
    }
  };

  // Handle English Card Click (Left Column)
  const handleLeftClick = (card: MatchCard) => {
    if (card.isMatched) return;

    // If already selected, deselect WITHOUT speech
    if (selectedLeft?.id === card.id) {
      setSelectedLeft(null);
      playSelectSound();
      return;
    }

    // Pronounce the English word only upon initial selection tap
    speakEnglish(card.text);
    playSelectSound();

    setSelectedLeft(card);

    // If a Chinese card is already chosen on the right, match them immediately!
    if (selectedRight) {
      evaluatePair(card, selectedRight);
    }
  };

  // Handle Chinese Card Click (Right Column)
  const handleRightClick = (card: MatchCard) => {
    if (card.isMatched) return;

    playSelectSound();

    // If already selected, deselect
    if (selectedRight?.id === card.id) {
      setSelectedRight(null);
      return;
    }

    setSelectedRight(card);

    // If an English card is already chosen on the left, match them immediately!
    if (selectedLeft) {
      evaluatePair(selectedLeft, card);
    }
  };

  // Audio Controls
  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEffectsEnabled(next);
  };

  const toggleSpeech = () => {
    const next = !speechOn;
    setSpeechOn(next);
    setSpeechEnabled(next);
  };

  // Navigation to next page
  const handleNextPage = () => {
    if (hasNextPage) {
      handleSelectPage(currentPage + 1);
    } else {
      handleSelectPage(1);
    }
  };

  const matchedCount = stats.correctPairs;
  const progressPercent = Math.min(
    Math.round((matchedCount / CARDS_PER_PAGE) * 100),
    100
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F2F2F7] select-none overflow-hidden">
      {/* iOS App Navigation Bar */}
      <div className="shrink-0 px-4 py-2.5 bg-white/80 backdrop-blur-md border-b border-black/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl text-white flex items-center justify-center font-bold text-sm shadow-xs transition-colors"
            style={{
              backgroundColor: currentCatInfo.themeColor,
            }}
          >
            {currentCategory === 'airport' ? (
              <Plane className="w-4 h-4" />
            ) : (
              <ShoppingCart className="w-4 h-4" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-bold text-slate-900 leading-tight">学英文</h1>
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${currentCatInfo.themeColor}18`,
                  color: currentCatInfo.themeColor,
                }}
              >
                {currentCatInfo.badgeZh}
              </span>
            </div>
            <p className="text-[10px] text-slate-500">
              第 {currentPage} 页 · {currentPageConfig.titleZh} ({matchedCount}/{CARDS_PER_PAGE})
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          <button
            id="btn-toggle-sound"
            onClick={toggleSound}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              soundOn ? 'bg-slate-100 text-slate-700' : 'bg-rose-50 text-rose-500'
            }`}
            title={soundOn ? '音效已开启' : '音效已静音'}
          >
            {soundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          <button
            id="btn-toggle-speech"
            onClick={toggleSpeech}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              speechOn ? 'bg-blue-50 text-[#007AFF]' : 'bg-slate-100 text-slate-400'
            }`}
            title={speechOn ? '英文朗读已开启' : '英文朗读已关闭'}
          >
            {speechOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
          </button>

          <button
            id="btn-open-handbook"
            onClick={() => setIsHandbookOpen(true)}
            className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer ml-0.5"
            title={`查看全部 ${currentCatInfo.totalWords} 词汇手册`}
          >
            <BookOpen className="w-3.5 h-3.5" />
          </button>

          <button
            id="btn-restart-page"
            onClick={() => loadPage(currentPage, currentCategory)}
            className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
            title="重新练习本页"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Condense Category & Page Selector into 1 Unified Row */}
      <CategoryPageBar
        currentCategory={currentCategory}
        currentCatInfo={currentCatInfo}
        currentPage={currentPage}
        pagesConfig={pagesConfig}
        completedPages={completedPagesByCategory[currentCategory] || {}}
        onSelectCategory={handleSelectCategory}
        onSelectPage={handleSelectPage}
        onOpenPagePicker={() => setIsPagePickerOpen(true)}
      />

      {/* Status Bar: Progress line & Streak Counter */}
      <div className="shrink-0 px-4 py-1.5 bg-[#F2F2F7]">
        {/* Progress Bar (0 to 8 cards) */}
        <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden mb-1.5">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${progressPercent}%`,
              backgroundColor: currentCatInfo.themeColor,
            }}
          ></div>
        </div>

        <div className="flex items-center justify-between text-xs">
          {/* Streak indicator */}
          <div className="flex items-center gap-1.5 font-semibold">
            {stats.streak >= 2 ? (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 animate-bounce">
                <Flame className="w-3.5 h-3.5 fill-orange-500" />
                <span>连击 x{stats.streak}</span>
              </div>
            ) : (
              <span className="text-slate-500 text-[11px] font-medium">
                本页进度: <strong className="text-slate-800 font-bold">{matchedCount} / {CARDS_PER_PAGE} 组</strong>
              </span>
            )}
          </div>

          {/* Bilingual Column Guideline */}
          <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
            <span className="text-slate-900 font-bold">
              左: 英文
            </span>
            <span className="text-slate-300">⇄</span>
            <span className="text-slate-900 font-bold">右: 中文</span>
          </div>
        </div>
      </div>

      {/* Hand Prompt Banner */}
      <div className="shrink-0 px-4 py-1 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-medium">
        <Pointer className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
        <span>点击匹配中英文</span>
      </div>

      {/* Main 8-Set Match Arena (Two Columns, Exactly 8 cards per side) */}
      <div className="flex-1 px-3 sm:px-4 py-2 overflow-y-auto no-scrollbar">
        <div className="h-full flex flex-col justify-start">
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
            {/* LEFT COLUMN: 8 English Cards */}
            <div className="space-y-1.5 sm:space-y-2">
              {leftCards.map((card) => {
                const isSelected = selectedLeft?.id === card.id;

                return (
                  <button
                    key={card.id}
                    id={`card-${card.id}`}
                    onClick={() => handleLeftClick(card)}
                    className={`relative w-full h-[49px] sm:h-[53px] px-2.5 rounded-2xl border flex items-center justify-between text-left transition-all duration-200 select-none overflow-hidden ${
                      card.isMatched
                        ? 'bg-emerald-50/90 border-emerald-400/80 text-emerald-900 shadow-2xs cursor-default'
                        : card.isWrong
                        ? 'bg-rose-50 border-rose-400 text-rose-700 animate-shake shadow-xs cursor-pointer'
                        : isSelected
                        ? 'bg-blue-50/90 border-[#007AFF] text-[#007AFF] ring-2 ring-[#007AFF]/30 shadow-md scale-[1.02] cursor-pointer'
                        : 'bg-white border-black/[0.06] text-slate-800 shadow-2xs hover:border-[#007AFF]/40 hover:bg-slate-50/60 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 flex-1 min-w-0 pr-1">
                      {/* Green outline checkmark when matched */}
                      {card.isMatched && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 animate-scaleUp" />
                      )}

                      {/* English Word */}
                      <span
                        className={`text-[14px] sm:text-[15.5px] font-semibold tracking-tight truncate leading-tight ${
                          card.isMatched ? 'text-emerald-950' : 'text-slate-900'
                        }`}
                      >
                        {card.text}
                      </span>
                    </div>

                    {/* Pronounce Icon: active even when matched so user can replay anytime */}
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        speakEnglish(card.text, true);
                        if (card.isMatched) {
                          triggerMatchedHighlight(card.vocabId);
                          return;
                        }

                        // If tapped before any card is selected, select this card and play select sound
                        if (!selectedLeft && !selectedRight) {
                          playSelectSound();
                          setSelectedLeft(card);
                        }
                      }}
                      className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        card.isMatched
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 hover:text-emerald-900 active:scale-90 shadow-2xs'
                          : isSelected
                          ? 'bg-blue-100 text-[#007AFF]'
                          : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                      }`}
                      title={card.isMatched ? '再次收听英文发音' : '收听发音'}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </span>
                  </button>
                );
              })}
            </div>

            {/* RIGHT COLUMN: 8 Chinese Cards (Centered, no pinyin) */}
            <div className="space-y-1.5 sm:space-y-2">
              {rightCards.map((card) => {
                const isSelected = selectedRight?.id === card.id;
                const isMatchedHighlight =
                  card.isMatched && highlightedMatchedVocabId === card.vocabId;

                return (
                  <button
                    key={card.id}
                    id={`card-${card.id}`}
                    onClick={() => handleRightClick(card)}
                    className={`relative w-full h-[49px] sm:h-[53px] px-2.5 rounded-2xl border flex items-center justify-center text-center transition-all duration-300 select-none overflow-hidden ${
                      isMatchedHighlight
                        ? 'bg-emerald-100 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/50 shadow-md scale-[1.03]'
                        : card.isMatched
                        ? 'bg-emerald-50/90 border-emerald-400/80 text-emerald-900 shadow-2xs cursor-default'
                        : card.isWrong
                        ? 'bg-rose-50 border-rose-400 text-rose-700 animate-shake shadow-xs cursor-pointer'
                        : isSelected
                        ? 'bg-blue-50/90 border-[#007AFF] text-[#007AFF] ring-2 ring-[#007AFF]/30 shadow-md scale-[1.02] cursor-pointer'
                        : 'bg-white border-black/[0.06] text-slate-800 shadow-2xs hover:border-[#007AFF]/40 hover:bg-slate-50/60 cursor-pointer'
                    }`}
                  >
                    {/* Absolute left-justified checkmark so centered text never shifts */}
                    {card.isMatched && (
                      <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none animate-scaleUp">
                        <CheckCircle2
                          className={`w-4 h-4 shrink-0 transition-transform ${
                            isMatchedHighlight ? 'text-emerald-700 scale-125' : 'text-emerald-600'
                          }`}
                        />
                      </div>
                    )}

                    {/* Centered Chinese text (never shifts when matched) */}
                    <div
                      className={`text-[15px] sm:text-[16.5px] tracking-wide transition-colors ${
                        isMatchedHighlight
                          ? 'text-emerald-950 font-bold'
                          : card.isMatched
                          ? 'text-emerald-800 font-normal'
                          : 'text-slate-800 font-normal'
                      }`}
                    >
                      {card.text}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Page Picker Sheet Modal */}
      <PagePickerModal
        isOpen={isPagePickerOpen}
        currentPage={currentPage}
        pagesConfig={pagesConfig}
        categoryInfo={currentCatInfo}
        completedPages={completedPagesByCategory[currentCategory] || {}}
        onClose={() => setIsPagePickerOpen(false)}
        onSelectPage={handleSelectPage}
      />

      {/* Handbook Modal */}
      <VocabHandbookModal
        isOpen={isHandbookOpen}
        activeCategoryId={currentCategory}
        onClose={() => setIsHandbookOpen(false)}
        onSelectCategory={(catId) => {
          handleSelectCategory(catId);
        }}
      />

      {/* Victory Modal */}
      <VictoryModal
        isOpen={isVictoryOpen}
        stats={stats}
        pageNumber={currentPage}
        pageTitle={currentPageConfig.titleZh}
        totalWords={currentCatInfo.totalWords}
        hasNextPage={hasNextPage}
        onRestart={() => loadPage(currentPage, currentCategory)}
        onNextPage={handleNextPage}
        onOpenHandbook={() => {
          setIsVictoryOpen(false);
          setIsHandbookOpen(true);
        }}
      />
    </div>
  );
};
