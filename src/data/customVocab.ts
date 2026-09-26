import { VocabItem, PageConfig, ZoneConfigItem } from '../types.ts';

export const CUSTOM_VOCABULARY: VocabItem[] = [
  {
    id: 'custom-1',
    english: 'Early Wood',
    chinese: '厄利伍德',
    category: 'custom',
    exampleEn: 'We are heading to Early Wood.',
    exampleZh: '我们要前往厄利伍德。',
  },
  {
    id: 'custom-2',
    english: 'Frisco',
    chinese: '弗里斯科',
    category: 'custom',
    exampleEn: 'Frisco is a city in Texas.',
    exampleZh: '弗里斯科是德州的一个城市。',
  },
  {
    id: 'custom-3',
    english: 'Kroger',
    chinese: '克罗格',
    category: 'custom',
    exampleEn: 'I bought groceries at Kroger.',
    exampleZh: '我在克罗格买了食材。',
  },
  {
    id: 'custom-4',
    english: 'Trader Joe',
    chinese: '特雷德乔',
    category: 'custom',
    exampleEn: 'Trader Joe is a popular grocery store.',
    exampleZh: '特雷德乔是家很受欢迎的连锁超市。',
  },
];

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
export const CUSTOM_CARDS_PER_PAGE = 4;

export function getCustomPageVocab(_pageNumber: number): VocabItem[] {
  return CUSTOM_VOCABULARY;
}
