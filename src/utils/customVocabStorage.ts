import { VocabItem, PageConfig } from '../types.ts';

export const DEFAULT_CUSTOM_VOCABULARY: VocabItem[] = [
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

const STORAGE_KEY = 'pai_match_custom_vocab_v2';

export function getCustomVocabList(): VocabItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return [...DEFAULT_CUSTOM_VOCABULARY];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [...DEFAULT_CUSTOM_VOCABULARY];
  } catch {
    return [...DEFAULT_CUSTOM_VOCABULARY];
  }
}

export function saveCustomVocabList(items: VocabItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save custom vocab to localStorage', e);
  }
}

export function getCustomTotalPages(items: VocabItem[]): number {
  return Math.max(1, Math.ceil(items.length / 8));
}

export function getCustomPagesConfig(items: VocabItem[]): PageConfig[] {
  const totalPages = getCustomTotalPages(items);
  return Array.from({ length: totalPages }, (_, i) => ({
    pageNumber: i + 1,
    titleZh: totalPages > 1 ? `自定义词汇 ${i + 1}` : '自定义词汇',
    titleEn: totalPages > 1 ? `Custom Vocab ${i + 1}` : 'Custom Vocabulary',
    subtitleZh: `第 ${i + 1} 页 · 共 ${Math.min(8, items.length - i * 8)} 个词`,
    themeColor: '#AF52DE',
  }));
}

export function getCustomPageItems(items: VocabItem[], pageNumber: number): VocabItem[] {
  const start = (pageNumber - 1) * 8;
  return items.slice(start, start + 8);
}

export function addCustomVocabItem(
  english: string,
  chinese: string
): {
  newItem: VocabItem;
  updatedList: VocabItem[];
  newPage: number;
  didCreateNewPage: boolean;
} {
  const currentList = getCustomVocabList();
  const oldTotalPages = getCustomTotalPages(currentList);

  const cleanEn = english.trim();
  const cleanZh = chinese.trim();

  const newItem: VocabItem = {
    id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    english: cleanEn,
    chinese: cleanZh,
    category: 'custom',
    exampleEn: `${cleanEn} is part of your custom vocabulary.`,
    exampleZh: `${cleanZh} 已加入你的自定义词汇卡片。`,
  };

  const updatedList = [...currentList, newItem];
  saveCustomVocabList(updatedList);

  const newTotalPages = getCustomTotalPages(updatedList);
  const didCreateNewPage = newTotalPages > oldTotalPages;
  // The new card is placed on the last page
  const newPage = newTotalPages;

  return { newItem, updatedList, newPage, didCreateNewPage };
}

export function removeCustomVocabItem(
  id: string
): {
  updatedList: VocabItem[];
  newTotalPages: number;
} {
  const currentList = getCustomVocabList();
  const updatedList = currentList.filter((item) => item.id !== id);
  saveCustomVocabList(updatedList);
  const newTotalPages = getCustomTotalPages(updatedList);

  return { updatedList, newTotalPages };
}
