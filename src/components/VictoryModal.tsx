import React from 'react';
import { GameStats } from '../types.ts';
import { Trophy, Flame, Timer, CheckCircle, RotateCcw, ArrowRight, BookOpen } from 'lucide-react';

interface VictoryModalProps {
  isOpen: boolean;
  stats: GameStats;
  pageNumber: number;
  pageTitle: string;
  totalWords?: number;
  hasNextPage: boolean;
  onRestart: () => void;
  onNextPage: () => void;
  onOpenHandbook: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  stats,
  pageNumber,
  pageTitle,
  totalWords = 80,
  hasNextPage,
  onRestart,
  onNextPage,
  onOpenHandbook,
}) => {
  if (!isOpen) return null;

  const accuracy =
    stats.totalAttempts > 0
      ? Math.round((stats.correctPairs / stats.totalAttempts) * 100)
      : 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const isLastPage = !hasNextPage;

  return (
    <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-sm bg-white rounded-[32px] p-6 shadow-2xl border border-black/[0.06] text-center animate-scaleUp">
        {/* Animated Trophy badge */}
        <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-100 text-amber-500 flex items-center justify-center shadow-inner mb-3">
          <Trophy className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-2">
          <span>✨ 太棒了，加油！</span>
        </div>

        <h3 className="text-xl font-bold text-slate-900 tracking-tight">
          {isLastPage ? `🎉 全部 ${totalWords} 词通关！` : `第 ${pageNumber} 页配对完成！`}
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          {pageTitle} · 8 组卡片全部正确配对
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 my-5">
          <div className="bg-[#F2F2F7] rounded-2xl p-3 flex flex-col items-center">
            <Timer className="w-4 h-4 text-[#007AFF] mb-1" />
            <span className="text-[10px] text-slate-500 font-medium">用时</span>
            <span className="text-sm font-bold text-slate-800">{formatTime(stats.elapsedSeconds)}</span>
          </div>

          <div className="bg-[#F2F2F7] rounded-2xl p-3 flex flex-col items-center">
            <CheckCircle className="w-4 h-4 text-emerald-500 mb-1" />
            <span className="text-[10px] text-slate-500 font-medium">正确率</span>
            <span className="text-sm font-bold text-slate-800">{accuracy}%</span>
          </div>

          <div className="bg-[#F2F2F7] rounded-2xl p-3 flex flex-col items-center">
            <Flame className="w-4 h-4 text-orange-500 mb-1" />
            <span className="text-[10px] text-slate-500 font-medium">最高连击</span>
            <span className="text-sm font-bold text-slate-800">{stats.maxStreak}x</span>
          </div>
        </div>

        {/* Score banner */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-3 mb-5 flex items-center justify-between px-4">
          <span className="text-xs font-semibold text-slate-600">本页积分</span>
          <span className="text-lg font-black text-[#007AFF]">{stats.score}</span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          {hasNextPage ? (
            <button
              id="btn-victory-next-page"
              onClick={onNextPage}
              className="w-full py-3 px-4 rounded-2xl bg-[#007AFF] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm hover:bg-[#0071E3] active:scale-[0.98] transition-all cursor-pointer"
            >
              <span>前往下一页 (第 {pageNumber + 1} 页)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              id="btn-victory-restart-all"
              onClick={onNextPage}
              className="w-full py-3 px-4 rounded-2xl bg-[#34C759] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm hover:bg-[#2fb350] active:scale-[0.98] transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>从第 1 页重新开始挑战</span>
            </button>
          )}

          <button
            id="btn-victory-replay-page"
            onClick={onRestart}
            className="w-full py-3 px-4 rounded-2xl bg-[#F2F2F7] text-slate-800 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-slate-200 active:scale-[0.98] transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>重新练习第 {pageNumber} 页</span>
          </button>

          <button
            id="btn-victory-handbook"
            onClick={onOpenHandbook}
            className="w-full py-2.5 px-4 rounded-2xl text-slate-500 font-medium text-xs flex items-center justify-center gap-1.5 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>查看 80 词完整手册</span>
          </button>
        </div>
      </div>
    </div>
  );
};
