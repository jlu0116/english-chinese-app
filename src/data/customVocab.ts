import { VocabItem, PageConfig, ZoneConfigItem } from '../types.ts';
import {
  DEFAULT_CUSTOM_VOCABULARY,
  getCustomVocabList,
  getCustomPagesConfig,
  getCustomPageItems,
  getCustomTotalPages,
} from '../utils/customVocabStorage.ts';

export const CUSTOM_VOCABULARY: VocabItem[] = DEFAULT_CUSTOM_VOCABULARY;

export const CUSTOM_PAGES_CONFIG: PageConfig[] = [
  {
    pageNumber: 1,
    titleZh: '自定义词汇',
    titleEn: 'Custom Vocabulary',
    subtitleZh: '常用地名与商铺音译',
    themeColor: '#AF52DE',
  },
];

export const CUSTOM_ZONE_CONFIG: Record<string, ZoneConfigItem> = {
  custom: {
    nameZh: '自定义',
    nameEn: 'Custom',
    count: 4,
    color: '#AF52DE',
  },
};

export const CUSTOM_TOTAL_PAGES = 1;
export const CUSTOM_CARDS_PER_PAGE = 8;

export function getCustomPageVocab(pageNumber: number): VocabItem[] {
  const allCustom = getCustomVocabList();
  return getCustomPageItems(allCustom, pageNumber);
}

export { getCustomVocabList, getCustomPagesConfig, getCustomTotalPages };
