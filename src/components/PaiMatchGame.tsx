import React, { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import { MatchCard, GameStats, VocabItem, CategoryId, AppMode } from '../types.ts';
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
  Flame,
  RotateCcw,
  BookOpen,
  CheckCircle2,
  Plane,
  ShoppingCart,
  Pointer,
  Sparkles,
} from 'lucide-react';
import { VictoryModal } from './VictoryModal.tsx';
import { VocabHandbookModal } from './VocabHandbookModal.tsx';
import { PagePickerModal } from './PagePickerModal.tsx';
import { CategoryPageBar } from './CategoryPageBar.tsx';

const CARDS_PER_PAGE = 8;

// Auto-scale English text to fit perfectly in one line without clipping
const AutoFitEnglishText: React.FC<{
  text: string;
  isMatched: boolean;
}> = ({ text, isMatched }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const parent = containerRef.current;
    const textEl = textRef.current;
    if (!parent || !textEl) return;

    const computeScale = () => {
      const parentWidth = parent.clientWidth;
      const textWidth = textEl.scrollWidth;

      if (textWidth > parentWidth && parentWidth > 0) {
        const ratio = parentWidth / textWidth;
        setScale(Math.max(0.55, ratio));
      } else {
        setScale(1);
      }
    };

    computeScale();

    const ro = new ResizeObserver(() => {
      computeScale();
    });
    ro.observe(parent);

    return () => ro.disconnect();
  }, [text]);

  return (
    <div
      ref={containerRef}
      className="flex-1 min-w-0 overflow-hidden flex items-center"
    >
      <span
        ref={textRef}
        style={{
          transform: scale < 1 ? `scale(${scale})` : undefined,
          transformOrigin: 'left center',
          display: 'inline-block',
          whiteSpace: 'nowrap',
        }}
        className={`text-[13.5px] sm:text-[14.5px] font-medium tracking-tight leading-tight transition-transform ${
          isMatched ? 'text-emerald-950 font-semibold' : 'text-slate-900'
        }`}
      >
        {text}
      </span>
    </div>
  );
};

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
    custom: {},
  });

  // Active decks on current page (exactly 8 cards each)
  const [leftCards, setLeftCards] = useState<MatchCard[]>([]);
  const [rightCards, setRightCards] = useState<MatchCard[]>([]);
  const [selectedLeft, setSelectedLeft] = useState<MatchCard | null>(null);
  const [selectedRight, setSelectedRight] = useState<MatchCard | null>(null);

  // Active mode: default to 'study' mode instead of 'game' mode on launch
  const [mode, setMode] = useState<AppMode>('study');
  const [speakingCardId, setSpeakingCardId] = useState<string | null>(null);
  const speakingTimerRef = React.useRef<number | null>(null);

  const triggerSpeakingPulse = useCallback((cardId: string) => {
    if (speakingTimerRef.current) {
      window.clearTimeout(speakingTimerRef.current);
    }
    setSpeakingCardId(cardId);
    speakingTimerRef.current = window.setTimeout(() => {
      setSpeakingCardId(null);
    }, 650);
  }, []);

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
      if (speakingTimerRef.current) window.clearTimeout(speakingTimerRef.current);
    };
  }, []);

  // Master Sound setting (controls all sound effects and voice over)
  const [soundOn, setSoundOn] = useState<boolean>(true);

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
  const loadPage = useCallback(
    (pageNumber: number, categoryId: CategoryId, currentMode: AppMode = mode) => {
      const pageItems = getCategoryPageItems(categoryId, pageNumber);

      if (currentMode === 'study') {
        // Study mode: cards are all lined up in original sequence
        const newLeft: MatchCard[] = pageItems.map((item) => ({
          id: `left-${item.id}`,
          vocabId: item.id,
          text: item.english,
          type: 'english',
          isMatched: false,
          isWrong: false,
          isSelected: false,
        }));

        const newRight: MatchCard[] = pageItems.map((item) => ({
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
        setIsGameActive(false);
      } else {
        // Game mode: cards are scrambled independently to play matching
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
      }

      setStats({
        score: 0,
        streak: 0,
        maxStreak: 0,
        correctPairs: 0,
        totalAttempts: 0,
        startTime: Date.now(),
        elapsedSeconds: 0,
      });
    },
    [mode]
  );

  // When currentPage or currentCategory or mode changes, reload cards
  useEffect(() => {
    loadPage(currentPage, currentCategory, mode);
  }, [currentPage, currentCategory, mode, loadPage]);

  // Switch mode
  const handleToggleMode = (newMode: AppMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    loadPage(currentPage, currentCategory, newMode);
  };

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

        // Check if all cards on this page are matched!
        const totalCardsOnPage = leftCards.length;
        if (newCorrect >= totalCardsOnPage && totalCardsOnPage > 0) {
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
    if (mode === 'study') {
      // In study mode: merely make it speak the sound; will not light up blue and be selectable to match
      speakEnglish(card.text, true);
      triggerSpeakingPulse(card.id);
      return;
    }

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
    if (mode === 'study') {
      // In study mode: cards cannot be selected to match; speaks the corresponding English audio
      const pageItems = getCategoryPageItems(currentCategory, currentPage);
      const item = pageItems.find((p) => p.id === card.vocabId);
      if (item) {
        speakEnglish(item.english, true);
        triggerSpeakingPulse(`left-${card.vocabId}`);
      }
      return;
    }

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

  // Master Audio Control - mutes all sound effects and voice over
  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEffectsEnabled(next);
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

  const totalCardsOnPage = leftCards.length || CARDS_PER_PAGE;
  const matchedCount = stats.correctPairs;
  const progressPercent = Math.min(
    Math.round((matchedCount / totalCardsOnPage) * 100),
    100
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F2F2F7] select-none overflow-hidden">
      {/* iOS App Navigation Bar */}
      <div className="shrink-0 px-4 py-2.5 bg-white/80 backdrop-blur-md border-b border-black/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8.5 h-8.5 rounded-xl text-white flex items-center justify-center font-bold text-sm shadow-xs transition-colors shrink-0"
            style={{
              backgroundColor: currentCatInfo.themeColor,
            }}
          >
            {currentCategory === 'airport' ? (
              <Plane className="w-4.5 h-4.5" />
            ) : currentCategory === 'grocery' ? (
              <ShoppingCart className="w-4.5 h-4.5" />
            ) : (
              <Sparkles className="w-4.5 h-4.5" />
            )}
          </div>
          <h1 className="text-xl sm:text-[22px] font-bold text-slate-900 tracking-tight leading-none">
            学英文
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            id="btn-toggle-sound"
            onClick={toggleSound}
            className={`w-9 h-9 sm:w-9.5 sm:h-9.5 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-95 shadow-2xs cursor-pointer ${
              soundOn
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                : 'bg-rose-50 text-rose-500 hover:bg-rose-100 ring-1 ring-rose-200'
            }`}
            title={soundOn ? '声音已开启（点击静音全部声音及朗读）' : '已静音（全部声音及朗读已静音，点击开启）'}
          >
            {soundOn ? <Volume2 className="w-4.5 h-4.5" /> : <VolumeX className="w-4.5 h-4.5" />}
          </button>

          <button
            id="btn-open-handbook"
            onClick={() => setIsHandbookOpen(true)}
            className="w-9 h-9 sm:w-9.5 sm:h-9.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95 flex items-center justify-center transition-all duration-150 shadow-2xs cursor-pointer"
            title={`查看全部 ${currentCatInfo.totalWords} 词汇手册`}
          >
            <BookOpen className="w-4.5 h-4.5" />
          </button>

          <button
            id="btn-restart-page"
            onClick={() => loadPage(currentPage, currentCategory, mode)}
            className="w-9 h-9 sm:w-9.5 sm:h-9.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95 flex items-center justify-center transition-all duration-150 shadow-2xs cursor-pointer"
            title={mode === 'study' ? '重置当前页词汇' : '重新练习本页'}
          >
            <RotateCcw className="w-4.5 h-4.5" />
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

      {/* Mode Toggle & Progress Bar / Guidance Row */}
      <div className="shrink-0 px-3 sm:px-4 py-2 bg-[#F2F2F7] flex items-center gap-2.5 select-none min-h-[44px]">
        {/* Left: Game vs Study Mode Toggle */}
        <div className="flex p-0.5 bg-slate-200/80 rounded-xl text-xs font-semibold shrink-0">
          <button
            key="btn-mode-study"
            id="btn-mode-study"
            onClick={() => handleToggleMode('study')}
            className={`flex items-center gap-1 px-2.5 h-7.5 sm:h-8 rounded-lg transition-all duration-150 cursor-pointer ${
              mode === 'study'
                ? 'bg-white text-blue-600 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
            title="学习模式：卡片顺序对齐，点击英文卡片发音"
          >
            <BookOpen className="w-3.5 h-3.5 shrink-0" />
            <span className="text-xs">学习</span>
          </button>

          <button
            key="btn-mode-game"
            id="btn-mode-game"
            onClick={() => handleToggleMode('game')}
            className={`flex items-center gap-1 px-2.5 h-7.5 sm:h-8 rounded-lg transition-all duration-150 cursor-pointer ${
              mode === 'game'
                ? 'bg-white text-indigo-600 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
            title="游戏模式：卡片打乱乱序，点击中英文连线消除"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span className="text-xs">游戏</span>
          </button>
        </div>

        {/* Right of Toggle: Progress Bar + 0/8 or Streak in Game Mode; or Concise Text in Study Mode */}
        {mode === 'game' ? (
          <div className="flex-1 flex items-center gap-2 min-w-0">
            {/* Left text before progress bar */}
            <span className="text-xs font-semibold text-slate-500 tracking-tight shrink-0">
              配對卡
            </span>

            {/* Progress track (not full length) */}
            <div className="flex-1 bg-slate-200/80 h-2 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: currentCatInfo.themeColor,
                }}
              />
            </div>

            {/* End of progress bar: 0/8, covered by streak badge when active */}
            <div className="shrink-0 flex items-center justify-end min-w-[36px]">
              {stats.streak >= 2 ? (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 font-bold text-xs animate-bounce shadow-2xs">
                  <Flame className="w-3.5 h-3.5 fill-orange-500 shrink-0" />
                  <span className="tabular-nums">x{stats.streak}</span>
                </div>
              ) : (
                <span className="text-xs font-semibold text-slate-500 tabular-nums">
                  {matchedCount}/{totalCardsOnPage}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center px-1 min-w-0">
            <span className="text-[11.5px] sm:text-xs text-slate-500 font-medium text-center truncate">
              当前为学习模式 · 切换至游戏开始配对
            </span>
          </div>
        )}
      </div>

      {/* Main 8-Set Match Arena (Two Columns, Exactly 8 cards per side) */}
      <div className="flex-1 px-3 sm:px-4 py-2 overflow-y-auto no-scrollbar">
        <div className="h-full flex flex-col justify-start">
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
            {/* LEFT COLUMN: 8 English Cards */}
            <div className="space-y-1.5 sm:space-y-2">
              {leftCards.map((card) => {
                const isSelected = selectedLeft?.id === card.id;
                const isSpeaking = speakingCardId === card.id;

                return (
                  <button
                    key={card.id}
                    id={`card-${card.id}`}
                    onClick={() => handleLeftClick(card)}
                    className={`relative w-full h-[54px] sm:h-[58px] px-2.5 rounded-2xl border flex items-center justify-between text-left transition-all duration-200 select-none overflow-hidden ${
                      mode === 'study'
                        ? isSpeaking
                          ? 'bg-slate-100/90 border-slate-300 text-slate-900 shadow-xs'
                          : 'bg-white border-black/[0.06] text-slate-800 shadow-2xs hover:bg-slate-50/80 hover:border-slate-300 active:bg-slate-100 cursor-pointer'
                        : card.isMatched
                        ? 'bg-emerald-50/90 border-emerald-400/80 text-emerald-900 shadow-2xs cursor-default'
                        : card.isWrong
                        ? 'bg-rose-50 border-rose-400 text-rose-700 animate-shake shadow-xs cursor-pointer'
                        : isSelected
                        ? 'bg-blue-50/90 border-[#007AFF] text-[#007AFF] ring-2 ring-[#007AFF]/30 shadow-md scale-[1.02] cursor-pointer'
                        : 'bg-white border-black/[0.06] text-slate-800 shadow-2xs hover:border-[#007AFF]/40 hover:bg-slate-50/60 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 flex-1 min-w-0 pr-1 overflow-hidden">
                      {/* Green outline checkmark when matched (game mode only) */}
                      {mode === 'game' && card.isMatched && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 animate-scaleUp" />
                      )}

                      {/* Auto-scaling single line bold English word */}
                      <AutoFitEnglishText text={card.text} isMatched={mode === 'game' && card.isMatched} />
                    </div>

                    {/* Pronounce Icon */}
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        speakEnglish(card.text, true);
                        if (mode === 'study') {
                          triggerSpeakingPulse(card.id);
                          return;
                        }
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
                        mode === 'study'
                          ? isSpeaking
                            ? 'bg-slate-200 text-slate-800 scale-110 shadow-xs'
                            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:scale-95'
                          : card.isMatched
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 hover:text-emerald-900 active:scale-90 shadow-2xs'
                          : isSelected
                          ? 'bg-blue-100 text-[#007AFF]'
                          : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                      }`}
                      title={mode === 'study' ? '朗读发音' : card.isMatched ? '再次收听英文发音' : '收听发音'}
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
                const isSpeakingPair = speakingCardId === `left-${card.vocabId}`;

                return (
                  <button
                    key={card.id}
                    id={`card-${card.id}`}
                    onClick={() => handleRightClick(card)}
                    className={`relative w-full h-[54px] sm:h-[58px] px-2.5 rounded-2xl border flex items-center justify-center text-center transition-all duration-300 select-none overflow-hidden ${
                      mode === 'study'
                        ? isSpeakingPair
                          ? 'bg-slate-100/90 border-slate-300 text-slate-900 shadow-xs'
                          : 'bg-white border-black/[0.06] text-slate-800 shadow-2xs hover:bg-slate-50/80 hover:border-slate-300 active:bg-slate-100 cursor-pointer'
                        : isMatchedHighlight
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
                    {mode === 'game' && card.isMatched && (
                      <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none animate-scaleUp">
                        <CheckCircle2
                          className={`w-4 h-4 shrink-0 transition-transform ${
                            isMatchedHighlight ? 'text-emerald-700 scale-125' : 'text-emerald-600'
                          }`}
                        />
                      </div>
                    )}

                    {/* Centered Chinese text (un-bolded, larger font size) */}
                    <div
                      className={`text-[17.5px] sm:text-[19px] font-normal tracking-wide transition-colors ${
                        mode === 'study'
                          ? isSpeakingPair
                            ? 'text-slate-900 font-medium'
                            : 'text-slate-800'
                          : isMatchedHighlight
                          ? 'text-emerald-950'
                          : card.isMatched
                          ? 'text-emerald-800'
                          : 'text-slate-800'
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
        onRestart={() => loadPage(currentPage, currentCategory, mode)}
        onNextPage={handleNextPage}
        onOpenHandbook={() => {
          setIsVictoryOpen(false);
          setIsHandbookOpen(true);
        }}
      />
    </div>
  );
};
