import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Plus, Volume2 } from 'lucide-react';
import { transliterateEnglishToChinese } from '../utils/transliterate.ts';
import { speakEnglish } from '../utils/audio.ts';

interface AddCustomEnglishSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (english: string, chinese: string) => void;
}

export const AddCustomEnglishSheet: React.FC<AddCustomEnglishSheetProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [english, setEnglish] = useState('');
  const [chinese, setChinese] = useState('');
  const [isCustomChineseEdited, setIsCustomChineseEdited] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset and auto-focus when opened
  useEffect(() => {
    if (isOpen) {
      setEnglish('');
      setChinese('');
      setIsCustomChineseEdited(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Real-time transliteration as user types English (unless user manually typed custom Chinese)
  const handleEnglishChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEnglish(val);

    if (!isCustomChineseEdited) {
      const transliterated = transliterateEnglishToChinese(val);
      setChinese(transliterated);
    }
  };

  const handleChineseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChinese(e.target.value);
    setIsCustomChineseEdited(true);
  };

  const handleRegenerateTransliteration = () => {
    const transliterated = transliterateEnglishToChinese(english);
    setChinese(transliterated);
    setIsCustomChineseEdited(false);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEn = english.trim();
    const cleanZh = (chinese || transliterateEnglishToChinese(cleanEn)).trim();

    if (!cleanEn || !cleanZh) return;

    onAdd(cleanEn, cleanZh);
    onClose();
  };

  if (!isOpen) return null;

  const quickExamples = ['Costco', 'Target', 'Starbucks', 'Whole Foods', 'Dallas', 'Austin'];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl p-4 sm:p-5 z-10 animate-slideUp max-h-[90vh] flex flex-col">
        {/* iOS Pull Indicator */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-3 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
              <Plus className="w-4.5 h-4.5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 leading-tight">
                添加自定义英文
              </h2>
              <p className="text-xs text-slate-400">
                输入英文，系统自动生成中文音译卡片
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200 flex items-center justify-center transition-all cursor-pointer"
            title="关闭"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto">
          {/* English Phrase Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                英文短语 / 单词 (English)
              </label>
              {english.trim() && (
                <button
                  type="button"
                  onClick={() => speakEnglish(english.trim(), true)}
                  className="flex items-center gap-1 text-[11px] text-purple-600 hover:text-purple-800 cursor-pointer font-medium"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>收听发音</span>
                </button>
              )}
            </div>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={english}
                onChange={handleEnglishChange}
                placeholder="例如: Starbucks, Costco, Austin..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all"
                maxLength={45}
                required
              />
              {english && (
                <button
                  type="button"
                  onClick={() => {
                    setEnglish('');
                    setChinese('');
                    setIsCustomChineseEdited(false);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1.5 py-0.5 rounded cursor-pointer"
                >
                  清除
                </button>
              )}
            </div>

            {/* Quick Example tags */}
            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-400 font-medium">示例:</span>
              {quickExamples.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => {
                    setEnglish(ex);
                    setChinese(transliterateEnglishToChinese(ex));
                    setIsCustomChineseEdited(false);
                  }}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-600 text-[11.5px] transition-colors cursor-pointer"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {/* Chinese Transliteration Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <span>中文音译 (Transliteration)</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 font-medium flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5" /> 智能音译
                </span>
              </label>

              {english.trim() && isCustomChineseEdited && (
                <button
                  type="button"
                  onClick={handleRegenerateTransliteration}
                  className="text-[11px] text-purple-600 hover:underline cursor-pointer"
                >
                  重置为自动音译
                </button>
              )}
            </div>

            <input
              type="text"
              value={chinese}
              onChange={handleChineseChange}
              placeholder={english ? '自动生成中文音译...' : '输入英文后自动生成'}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all"
              maxLength={25}
              required
            />
            <p className="mt-1 text-[11px] text-slate-400">
              * 已按标准外文译名表自动音译，您也可直接手动修改为喜好的译名。
            </p>
          </div>

          {/* Preview Card */}
          {english.trim() && (
            <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-2xl">
              <div className="text-[11px] text-purple-700 font-semibold mb-1.5">
                卡片预览效果 (Card Preview)
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="h-12 px-2.5 rounded-xl bg-white border border-purple-200 flex items-center justify-between text-slate-900 shadow-2xs">
                  <span className="text-sm font-medium truncate">{english}</span>
                  <Volume2 className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                </div>
                <div className="h-12 px-2.5 rounded-xl bg-white border border-purple-200 flex items-center justify-center text-slate-900 shadow-2xs">
                  <span className="text-base font-normal tracking-wide truncate">
                    {chinese || '...'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 font-medium text-sm transition-all cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!english.trim() || !chinese.trim()}
              className={`flex-1 h-11 rounded-xl font-medium text-sm flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                english.trim() && chinese.trim()
                  ? 'bg-purple-600 hover:bg-purple-700 active:scale-98 text-white cursor-pointer'
                  : 'bg-purple-200 text-white/80 cursor-not-allowed'
              }`}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>添加到自定义词库</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
