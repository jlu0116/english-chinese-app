import { CategoryId, CategoryInfo, VocabItem, PageConfig, ZoneConfigItem } from '../types.ts';
import {
  AIRPORT_VOCABULARY,
  PAGES_CONFIG as AIRPORT_PAGES_CONFIG,
  ZONE_CONFIG as AIRPORT_ZONE_CONFIG,
  TOTAL_PAGES as AIRPORT_TOTAL_PAGES,
  getPageVocab as getAirportPageVocab,
} from './airportVocab.ts';
import {
  GROCERY_VOCABULARY,
  GROCERY_PAGES_CONFIG,
  GROCERY_ZONE_CONFIG,
  GROCERY_TOTAL_PAGES,
  getGroceryPageVocab,
} from './groceryVocab.ts';

export const CATEGORIES: CategoryInfo[] = [
  {
    id: 'airport',
    nameZh: '机场出国',
    nameEn: 'Airport',
    badgeZh: '机场英语',
    totalWords: 80,
    totalPages: AIRPORT_TOTAL_PAGES,
    themeColor: '#007AFF',
  },
  {
    id: 'grocery',
    nameZh: '超市购物',
    nameEn: 'Grocery Store',
    badgeZh: '超市英语',
    totalWords: 80,
    totalPages: GROCERY_TOTAL_PAGES,
    themeColor: '#34C759',
  },
];

export function getCategoryInfo(categoryId: CategoryId): CategoryInfo {
  return CATEGORIES.find((c) => c.id === categoryId) || CATEGORIES[0];
}

export function getCategoryVocab(categoryId: CategoryId): VocabItem[] {
  return categoryId === 'grocery' ? GROCERY_VOCABULARY : AIRPORT_VOCABULARY;
}

export function getCategoryPagesConfig(categoryId: CategoryId): PageConfig[] {
  return categoryId === 'grocery' ? GROCERY_PAGES_CONFIG : AIRPORT_PAGES_CONFIG;
}

export function getCategoryZoneConfig(categoryId: CategoryId): Record<string, ZoneConfigItem> {
  return categoryId === 'grocery' ? GROCERY_ZONE_CONFIG : AIRPORT_ZONE_CONFIG;
}

export function getCategoryPageItems(categoryId: CategoryId, pageNumber: number): VocabItem[] {
  return categoryId === 'grocery'
    ? getGroceryPageVocab(pageNumber)
    : getAirportPageVocab(pageNumber);
}
