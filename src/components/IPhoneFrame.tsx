import React, { useState, useEffect } from 'react';
import { Wifi, BatteryMedium, Smartphone, Maximize2 } from 'lucide-react';

interface IPhoneFrameProps {
  children: React.ReactNode;
  title?: string;
}

export const IPhoneFrame: React.FC<IPhoneFrameProps> = ({ children }) => {
  const [useDeviceFrame, setUseDeviceFrame] = useState(true);
  const [currentTime, setCurrentTime] = useState('09:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-0 sm:p-4 md:p-6 transition-colors duration-300">
      {/* Desktop Device Toolbar */}
      <div className="hidden sm:flex items-center justify-between w-full max-w-[430px] mb-3 px-2 text-xs text-slate-400 font-medium">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>学英文 · 机场篇</span>
        </div>
        <button
          id="btn-toggle-device-view"
          onClick={() => setUseDeviceFrame(!useDeviceFrame)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
          title="切换设备画框 / 全宽模式"
        >
          {useDeviceFrame ? (
            <>
              <Maximize2 className="w-3.5 h-3.5" />
              <span>全屏宽屏</span>
            </>
          ) : (
            <>
              <Smartphone className="w-3.5 h-3.5" />
              <span>iPhone 视窗</span>
            </>
          )}
        </button>
      </div>

      {/* Main Container */}
      <div
        className={`w-full transition-all duration-300 ${
          useDeviceFrame
            ? 'max-w-[420px] h-[92vh] max-h-[880px] sm:rounded-[48px] sm:border-[10px] sm:border-[#1E2024] sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.1)] relative flex flex-col overflow-hidden bg-[#F2F2F7]'
            : 'max-w-2xl min-h-[92vh] rounded-2xl border border-slate-800 shadow-2xl relative flex flex-col overflow-hidden bg-[#F2F2F7]'
        }`}
      >
        {/* iOS Status Bar */}
        <div className="shrink-0 h-11 px-6 pt-2 pb-1 flex items-center justify-between text-slate-900 text-[13px] font-semibold select-none z-30 bg-[#F2F2F7]/90 backdrop-blur-md">
          {/* Time */}
          <div className="w-14 text-center tracking-tight">{currentTime}</div>

          {/* Dynamic Island pill */}
          <div className="w-24 h-5 bg-black rounded-full flex items-center justify-end px-2 gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#007AFF] opacity-80"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          </div>

          {/* Battery & Wifi */}
          <div className="w-14 flex items-center justify-end gap-1.5 text-slate-800">
            <Wifi className="w-3.5 h-3.5" />
            <BatteryMedium className="w-4 h-4" />
          </div>
        </div>

        {/* Dynamic App Content */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {children}
        </div>

        {/* iOS Home Indicator Bar */}
        <div className="shrink-0 h-6 flex items-center justify-center bg-[#F2F2F7] z-30 select-none">
          <div className="w-32 h-1 bg-slate-400/60 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};
