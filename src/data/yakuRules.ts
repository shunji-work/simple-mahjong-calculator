import { Yaku } from '../types/mahjong';

export const YAKUMAN_YAKU_ID = 'yakuman';
export const MENZEN_TSUMO_YAKU_ID = 'tsumo';

const YAKUHAI_IDS = ['haku', 'hatsu', 'chun', 'jikazehai', 'bakazehai'];
const SANGENPAI_IDS = ['haku', 'hatsu', 'chun'];

const INCOMPATIBLE_PAIRS: Array<[string, string]> = [
  ...YAKUHAI_IDS.flatMap(
    (yakuhaiId) =>
      ([
        [yakuhaiId, 'tanyao'],
        [yakuhaiId, 'pinfu'],
        [yakuhaiId, 'chiitoitsu'],
        [yakuhaiId, 'junchan'],
        [yakuhaiId, 'ryanpeikou'],
        [yakuhaiId, 'chinitsu'],
      ] as Array<[string, string]>),
  ),
  ['tanyao', 'ikkitsuukan'],
  ['tanyao', 'chanta'],
  ['tanyao', 'junchan'],
  ['tanyao', 'honroutou'],
  ['tanyao', 'shousangen'],
  ['tanyao', 'honitsu'],
  ['pinfu', 'toitoihou'],
  ['pinfu', 'sanankou'],
  ['pinfu', 'sankantsu'],
  ['pinfu', 'chiitoitsu'],
  ['pinfu', 'honroutou'],
  ['pinfu', 'shousangen'],
  ['ipeikou', 'toitoihou'],
  ['ipeikou', 'sanankou'],
  ['ipeikou', 'sankantsu'],
  ['ipeikou', 'chiitoitsu'],
  ['ipeikou', 'honroutou'],
  ['ipeikou', 'ryanpeikou'],
  ['ryanpeikou', 'sanshokudoujun'],
  ['ryanpeikou', 'ikkitsuukan'],
  ['ryanpeikou', 'toitoihou'],
  ['ryanpeikou', 'sanankou'],
  ['ryanpeikou', 'sankantsu'],
  ['ryanpeikou', 'chiitoitsu'],
  ['ryanpeikou', 'honroutou'],
  ['ryanpeikou', 'shousangen'],
  ['ryanpeikou', 'honitsu'],
  ['ryanpeikou', 'chinitsu'],
  ['sanshokudoujun', 'ikkitsuukan'],
  ['sanshokudoujun', 'sanankou'],
  ['sanshokudoujun', 'sankantsu'],
  ['sanshokudoujun', 'chiitoitsu'],
  ['sanshokudoujun', 'honroutou'],
  ['sanshokudoujun', 'shousangen'],
  ['sanshokudoujun', 'honitsu'],
  ['sanshokudoujun', 'chinitsu'],
  ['ikkitsuukan', 'junchan'],
  ['ikkitsuukan', 'sanankou'],
  ['ikkitsuukan', 'sankantsu'],
  ['ikkitsuukan', 'chiitoitsu'],
  ['ikkitsuukan', 'honroutou'],
  ['ikkitsuukan', 'shousangen'],
  ['chanta', 'chiitoitsu'],
  ['chanta', 'honroutou'],
  ['chanta', 'junchan'],
  ['chanta', 'chinitsu'],
  ['junchan', 'chiitoitsu'],
  ['junchan', 'honroutou'],
  ['junchan', 'shousangen'],
  ['junchan', 'honitsu'],
  ['chiitoitsu', 'toitoihou'],
  ['chiitoitsu', 'sanankou'],
  ['chiitoitsu', 'sankantsu'],
  ['chiitoitsu', 'shousangen'],
  ['toitoihou', 'sanshokudoujun'],
  ['toitoihou', 'ikkitsuukan'],
  ['sanankou', 'sanshokudoujun'],
  ['sanankou', 'ikkitsuukan'],
  ['sankantsu', 'sanshokudoujun'],
  ['sankantsu', 'ikkitsuukan'],
  ['shousangen', 'chinitsu'],
  ['honitsu', 'chinitsu'],
  ['chinitsu', 'honroutou'],
];

function buildIncompatibleMap(pairs: Array<[string, string]>): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  const add = (a: string, b: string) => {
    if (!map.has(a)) {
      map.set(a, new Set());
    }
    map.get(a)?.add(b);
  };

  pairs.forEach(([a, b]) => {
    add(a, b);
    add(b, a);
  });

  return map;
}

const INCOMPATIBLE_MAP = buildIncompatibleMap(INCOMPATIBLE_PAIRS);

export function getIncompatibleYakuIds(yakuId: string): ReadonlySet<string> {
  return INCOMPATIBLE_MAP.get(yakuId) ?? new Set<string>();
}

export function isIncompatibleWithSelected(yakuId: string, selectedYaku: string[]): boolean {
  const incompatible = getIncompatibleYakuIds(yakuId);
  return selectedYaku.some((selectedId) => incompatible.has(selectedId));
}

/** 白・發・中がすべて選ばれていれば大三元とみなす */
export function isDaisangen(selectedYaku: string[]): boolean {
  return SANGENPAI_IDS.every((id) => selectedYaku.includes(id));
}

export function isYakumanSelected(selectedYaku: string[]): boolean {
  return selectedYaku.includes(YAKUMAN_YAKU_ID) || isDaisangen(selectedYaku);
}

/** 鳴きありのときは食い下がり役を1翻減らした翻数を返す */
export function getEffectiveHan(yaku: Yaku, hasNaki: boolean): number {
  return hasNaki && yaku.kuisagari ? yaku.han - 1 : yaku.han;
}
