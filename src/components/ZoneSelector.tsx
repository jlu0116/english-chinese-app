import React from 'react';
import { AirportZone } from '../types.ts';
import { ZONE_CONFIG } from '../data/airportVocab.ts';
import { Plane, ShieldAlert, Armchair, Navigation2, Sparkles } from 'lucide-react';

interface ZoneSelectorProps {
  currentZone: AirportZone;
  onSelectZone: (zone: AirportZone) => void;
  completedZones: Record<string, boolean>;
}

export const ZoneSelector: React.FC<ZoneSelectorProps> = ({
  currentZone,
  onSelectZone,
  completedZones,
}) => {
  const zoneIcons: Record<AirportZone, React.ReactNode> = {
    all: <Sparkles className="w-4 h-4 text-[#007AFF]" />,
    checkin: <Plane className="w-4 h-4 text-[#007AFF]" />,
    security: <ShieldAlert className="w-4 h-4 text-[#AF52DE]" />,
    inflight: <Armchair className="w-4 h-4 text-[#FF9500]" />,
    transit: <Navigation2 className="w-4 h-4 text-[#34C759]" />,
  };

  const zones: AirportZone[] = ['all', 'checkin', 'security', 'inflight', 'transit'];

  return (
    <div className="px-4 py-2 bg-[#F2F2F7] border-b border-black/[0.06]">
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {zones.map((zoneKey) => {
          const cfg = ZONE_CONFIG[zoneKey];
          const isSelected = currentZone === zoneKey;
          const isDone = completedZones[zoneKey];

          return (
            <button
              key={zoneKey}
              id={`tab-zone-${zoneKey}`}
              onClick={() => onSelectZone(zoneKey)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-white text-slate-900 shadow-sm border border-black/[0.08]'
                  : 'bg-black/[0.04] text-slate-600 hover:bg-black/[0.08]'
              }`}
            >
              <span>{zoneIcons[zoneKey]}</span>
              <span>{cfg.nameZh.replace('第一站：', '').replace('第二站：', '').replace('第三站：', '').replace('第四站：', '')}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium ${
                  isSelected ? 'bg-slate-100 text-slate-600' : 'bg-black/[0.05] text-slate-400'
                }`}
              >
                {cfg.count}
              </span>
              {isDone && <span className="text-[10px] text-emerald-500 font-bold">✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};
