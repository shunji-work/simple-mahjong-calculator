import { Yaku } from '../types/mahjong';

export const YAKU_LIST: Yaku[] = [
  { id: 'riichi', name: '立直（リーチ）', han: 1, menzenOnly: true, category: 'S' },
  { id: 'tanyao', name: '断幺九（タンヤオ）', han: 1, menzenOnly: false, category: 'S' },
  { id: 'pinfu', name: '平和（ピンフ）', han: 1, menzenOnly: true, category: 'S' },
  { id: 'tsumo', name: '門前清自摸和（ツモ）', han: 1, menzenOnly: true, category: 'S' },
  { id: 'haku', name: '役牌：白', han: 1, menzenOnly: false, category: 'S' },
  { id: 'hatsu', name: '役牌：發', han: 1, menzenOnly: false, category: 'S' },
  { id: 'chun', name: '役牌：中', han: 1, menzenOnly: false, category: 'S' },
  { id: 'jikazehai', name: '役牌：自風牌', han: 1, menzenOnly: false, category: 'S' },
  { id: 'bakazehai', name: '役牌：場風牌', han: 1, menzenOnly: false, category: 'S' },

  { id: 'ipeikou', name: '一盃口（イーペーコー）', han: 1, menzenOnly: true, category: 'A' },
  { id: 'chiitoitsu', name: '七対子（チートイツ）', han: 2, menzenOnly: true, category: 'A' },
  { id: 'toitoihou', name: '対々和（トイトイホー）', han: 2, menzenOnly: false, category: 'A' },
  { id: 'sanankou', name: '三暗刻（サンアンコー）', han: 2, menzenOnly: false, category: 'A' },
  { id: 'sankantsu', name: '三槓子（サンカンツ）', han: 2, menzenOnly: false, category: 'A' },
  { id: 'sanshokudoujun', name: '三色同順（サンシキ）', han: 2, menzenOnly: false, category: 'A', kuisagari: true },
  { id: 'ikkitsuukan', name: '一気通貫（イッキ）', han: 2, menzenOnly: false, category: 'A', kuisagari: true },
  { id: 'chanta', name: '混全帯幺九（チャンタ）', han: 2, menzenOnly: false, category: 'A', kuisagari: true },
  { id: 'honroutou', name: '混老頭（ホンロウトウ）', han: 2, menzenOnly: false, category: 'A' },
  { id: 'shousangen', name: '小三元（ショウサンゲン）', han: 2, menzenOnly: false, category: 'A' },

  { id: 'ryanpeikou', name: '二盃口（リャンペーコー）', han: 3, menzenOnly: true, category: 'B' },
  { id: 'honitsu', name: '混一色（ホンイツ）', han: 3, menzenOnly: false, category: 'B', kuisagari: true },
  { id: 'junchan', name: '純全帯幺九（ジュンチャン）', han: 3, menzenOnly: false, category: 'B', kuisagari: true },
  { id: 'chinitsu', name: '清一色（チンイツ）', han: 6, menzenOnly: false, category: 'B', kuisagari: true },

  { id: 'yakuman', name: '役満', han: 13, menzenOnly: false, category: 'C' },
];

export const getCategoryYaku = (category: 'S' | 'A' | 'B' | 'C'): Yaku[] => {
  return YAKU_LIST.filter(yaku => yaku.category === category);
};
