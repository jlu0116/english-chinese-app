export type CategoryId = 'airport' | 'grocery' | 'custom';
export type AirportZone = 'all' | 'checkin' | 'security' | 'inflight' | 'transit';
export type AppMode = 'study' | 'game';

export interface CategoryInfo {
  id: CategoryId;
  nameZh: string;
  nameEn: string;
  badgeZh: string;
  totalWords: number;
  totalPages: number;
  themeColor: string;
}

export interface VocabItem {
  id: string;
  english: string;
  chinese: string;
  category: string;
  exampleEn: string;
  exampleZh: string;
}

export interface PageConfig {
  pageNumber: number;
  titleZh: string;
  titleEn: string;
  subtitleZh: string;
  themeColor: string;
}

export interface ZoneConfigItem {
  nameZh: string;
  nameEn: string;
  count: number;
  color: string;
}

export interface MatchCard {
  id: string; // unique card instance id
  vocabId: string; // reference to vocab item
  text: string;
  type: 'english' | 'chinese';
  isMatched: boolean;
  isWrong: boolean;
  isSelected: boolean;
}

export interface GameStats {
  score: number;
  streak: number;
  maxStreak: number;
  correctPairs: number;
  totalAttempts: number;
  startTime: number;
  elapsedSeconds: number;
}
