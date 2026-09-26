/**
 * English to Chinese Transliteration Utility
 * Uses a comprehensive dictionary for common names, places, and brands,
 * paired with a robust phonetic transliteration engine following standard
 * foreign name Chinese transliteration conventions (Xinhua standards).
 */

const COMMON_DICTIONARY: Record<string, string> = {
  // Existing default examples
  'early wood': '厄利伍德',
  'frisco': '弗里斯科',
  'kroger': '克罗格',
  'trader joe': '特雷德乔',
  'trader joes': '特雷德乔',
  "trader joe's": '特雷德乔',

  // Popular US supermarkets & stores
  'costco': '开市客',
  'walmart': '沃尔玛',
  'target': '塔吉特',
  'whole foods': '全食',
  'whole foods market': '全食超市',
  'safeway': '塞夫韦',
  'albertsons': '艾伯森',
  'aldi': '奥乐齐',
  'heb': '赫布',
  'h-e-b': '赫布',
  'publix': '帕布利克斯',
  'wegmans': '韦格曼斯',
  'walgreens': '沃尔格林',
  'cvs': '希威埃斯',
  'ikea': '宜家',
  'home depot': '家得宝',
  'lowes': '劳氏',
  "lowe's": '劳氏',
  'best buy': '百思买',
  'macy': '梅西',
  'macys': '梅西',
  "macy's": '梅西',
  'nordstrom': '诺德斯特龙',

  // Fast food & Coffee
  'starbucks': '星巴克',
  'mcdonald': '麦当劳',
  'mcdonalds': '麦当劳',
  "mcdonald's": '麦当劳',
  'kfc': '肯德基',
  'burger king': '汉堡王',
  'subway': '赛百味',
  'shake shack': '昔客堡',
  'in n out': '因恩奥特',
  'in-n-out': '因恩奥特',
  'chipotle': '奇波雷',
  'panda express': '熊猫快餐',
  'dunkin': '唐恩都乐',
  "dunkin'": '唐恩都乐',
  'taco bell': '塔可钟',
  'wendys': '温迪',
  "wendy's": '温迪',
  'dominos': '达美乐',
  "domino's": '达美乐',
  'pizza hut': '必胜客',

  // Tech & Brands
  'apple': '苹果',
  'google': '谷歌',
  'amazon': '亚马逊',
  'microsoft': '微软',
  'tesla': '特斯拉',
  'meta': '元',
  'netflix': '奈飞',
  'uber': '优步',
  'lyft': '来福车',
  'nike': '耐克',
  'adidas': '阿迪达斯',
  'disney': '迪士尼',

  // Major Cities / States / Locations
  'new york': '纽约',
  'los angeles': '洛杉矶',
  'san francisco': '旧金山',
  'san jose': '圣何塞',
  'san diego': '圣迭戈',
  'seattle': '西雅图',
  'chicago': '芝加哥',
  'houston': '休斯顿',
  'dallas': '达拉斯',
  'austin': '奥斯汀',
  'san antonio': '圣安东尼奥',
  'boston': '波士顿',
  'miami': '迈阿密',
  'atlanta': '亚特兰大',
  'denver': '丹佛',
  'phoenix': '菲尼克斯',
  'las vegas': '拉斯维加斯',
  'portland': '波特兰',
  'orlando': '奥兰多',
  'philadelphia': '费城',
  'washington': '华盛顿',
  'california': '加利福尼亚',
  'texas': '德克萨斯',
  'florida': '佛罗里达',
  'hawaii': '夏威夷',

  // Common airport / travel / daily terms
  'airport': '机场',
  'terminal': '航站楼',
  'gate': '登机口',
  'hotel': '酒店',
  'station': '车站',
  'subway station': '地铁站',
  'supermarket': '超市',
  'mall': '购物中心',
  'plaza': '广场',
  'center': '中心',
  'park': '公园',
  'street': '街',
  'avenue': '大道',
  'road': '路',
  'boulevard': '林荫大道',
};

// Phonetic mapping for syllables
const SYLLABLE_MAP: Record<string, string> = {
  // Consonant + Vowel combos
  ba: '巴', be: '贝', bi: '比', bo: '博', bu: '布', by: '拜',
  ca: '卡', ce: '塞', ci: '斯', co: '科', cu: '库', cy: '西',
  cha: '查', che: '切', chi: '奇', cho: '乔', chu: '楚',
  da: '达', de: '德', di: '迪', do: '多', du: '杜', dy: '代',
  fa: '法', fe: '费', fi: '菲', fo: '福', fu: '富', fy: '菲',
  ga: '加', ge: '格', gi: '吉', go: '戈', gu: '古', gy: '吉',
  ha: '哈', he: '赫', hi: '希', ho: '霍', hu: '胡', hy: '海',
  ja: '贾', je: '杰', ji: '吉', jo: '乔', ju: '朱', jy: '杰',
  ka: '卡', ke: '克', ki: '基', ko: '科', ku: '库', ky: '凯',
  la: '拉', le: '勒', li: '利', lo: '洛', lu: '卢', ly: '利',
  ma: '马', me: '梅', mi: '米', mo: '莫', mu: '穆', my: '迈',
  na: '纳', ne: '内', ni: '尼', no: '诺', nu: '努', ny: '奈',
  pa: '帕', pe: '佩', pi: '皮', po: '珀', pu: '普', py: '派',
  qua: '夸', que: '奎', qui: '奎', quo: '阔',
  ra: '拉', re: '雷', ri: '里', ro: '罗', ru: '鲁', ry: '里',
  sa: '萨', se: '塞', si: '西', so: '索', su: '苏', sy: '西',
  sha: '沙', she: '歇', shi: '希', sho: '肖', shu: '舒',
  ta: '塔', te: '特', ti: '蒂', to: '托', tu: '图', ty: '泰',
  tha: '萨', the: '瑟', thi: '西', tho: '索', thu: '苏',
  va: '瓦', ve: '韦', vi: '维', vo: '沃', vu: '武', vy: '维',
  wa: '瓦', we: '韦', wi: '威', wo: '沃', wu: '伍', wy: '怀',
  ya: '亚', ye: '叶', yi: '伊', yo: '约', yu: '尤',
  za: '扎', ze: '泽', zi: '齐', zo: '佐', zu: '祖', zy: '齐',

  // Common English morphemes
  wood: '伍德',
  ford: '福德',
  field: '菲尔德',
  land: '兰德',
  ville: '维尔',
  ton: '顿',
  don: '登',
  son: '森',
  sen: '森',
  man: '曼',
  berg: '伯格',
  burg: '堡',
  stein: '斯坦',
  stone: '斯通',
  port: '波特',
  park: '帕克',
  lake: '莱克',
  hill: '希尔',
  bridge: '布里奇',
  green: '格林',
  white: '怀特',
  black: '布莱克',
  brown: '布朗',
  king: '金',
  hall: '霍尔',
  bell: '贝尔',
  well: '韦尔',
  dale: '戴尔',
  brook: '布鲁克',
  gate: '盖特',
  side: '塞德',
};

// Suffix/isolated consonant transliteration
const CONSONANT_ENDINGS: Record<string, string> = {
  b: '布',
  c: '克',
  ck: '克',
  d: '德',
  f: '夫',
  g: '格',
  k: '克',
  l: '尔',
  m: '姆',
  n: '恩',
  p: '普',
  r: '尔',
  s: '斯',
  sh: '什',
  ch: '奇',
  t: '特',
  th: '斯',
  v: '夫',
  w: '夫',
  x: '克斯',
  z: '兹',
  ng: '昂',
  nk: '恩克',
};

/**
 * Transliterates a single English word into Chinese
 */
function transliterateWord(word: string): string {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!clean) return '';

  if (COMMON_DICTIONARY[clean]) {
    return COMMON_DICTIONARY[clean];
  }

  // Check known morphemes / full words in syllable map
  if (SYLLABLE_MAP[clean]) {
    return SYLLABLE_MAP[clean];
  }

  // Segment into phonetic chunks
  let remaining = clean;
  let result = '';

  while (remaining.length > 0) {
    let matched = false;

    // Try matches of length 6 down to 2 in SYLLABLE_MAP
    for (let len = Math.min(6, remaining.length); len >= 2; len--) {
      const sub = remaining.substring(0, len);
      if (SYLLABLE_MAP[sub]) {
        result += SYLLABLE_MAP[sub];
        remaining = remaining.substring(len);
        matched = true;
        break;
      }
    }

    if (!matched) {
      // Check 2-letter endings like ch, sh, th, ck, ng
      if (remaining.length >= 2) {
        const sub2 = remaining.substring(0, 2);
        if (CONSONANT_ENDINGS[sub2]) {
          result += CONSONANT_ENDINGS[sub2];
          remaining = remaining.substring(2);
          continue;
        }
      }

      // Check single char
      const char = remaining[0];
      if (CONSONANT_ENDINGS[char]) {
        result += CONSONANT_ENDINGS[char];
      } else if (char === 'a') {
        result += '阿';
      } else if (char === 'e') {
        result += '埃';
      } else if (char === 'i') {
        result += '伊';
      } else if (char === 'o') {
        result += '奥';
      } else if (char === 'u') {
        result += '尤';
      } else if (char === 'y') {
        result += '伊';
      }
      remaining = remaining.substring(1);
    }
  }

  return result || word;
}

/**
 * Transliterates any English phrase into standard Chinese transliteration
 */
export function transliterateEnglishToChinese(phrase: string): string {
  if (!phrase || !phrase.trim()) return '';

  const normalized = phrase.trim().toLowerCase();

  // 1. Direct dictionary match for entire multi-word phrase
  if (COMMON_DICTIONARY[normalized]) {
    return COMMON_DICTIONARY[normalized];
  }

  // 2. Transliterate word by word
  const words = phrase.trim().split(/\s+/);
  const transliteratedWords = words.map((w) => transliterateWord(w));

  return transliteratedWords.join('');
}
