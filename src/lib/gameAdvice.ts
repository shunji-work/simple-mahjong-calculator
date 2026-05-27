import type { GameRecord, Ruleset } from '../types/game';

type AdviceVariant = 'positive' | 'caution' | 'neutral';

export interface ScoreAdvice {
  title: string;
  message: string;
  detail: string;
  variant: AdviceVariant;
}

type AdviceGame = Pick<GameRecord, 'score' | 'rank'>;

const SCORE_BASELINE = 30000;

const STRONG_MOVE_THRESHOLD: Record<Ruleset, number> = {
  '4ma': 8000,
  '3ma': 12000,
};

const TREND_THRESHOLD: Record<Ruleset, number> = {
  '4ma': 6000,
  '3ma': 10000,
};

const HIGH_SPREAD_THRESHOLD: Record<Ruleset, number> = {
  '4ma': 25000,
  '3ma': 35000,
};

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatNumber(value: number): string {
  return Math.round(value).toLocaleString('ja-JP');
}

function formatDelta(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${formatNumber(value)}点`;
}

function buildDetail(records: AdviceGame[]): string {
  const latest = records[records.length - 1];
  const previous = records.length >= 2 ? records[records.length - 2] : null;
  const avgScore = average(records.map((game) => game.score));
  const topRate = records.filter((game) => game.rank === 1).length / records.length;
  const deltaText = previous ? `前回比${formatDelta(latest.score - previous.score)}` : '前回比なし';

  return `${deltaText} / 平均${formatNumber(avgScore)}点 / トップ率${Math.round(topRate * 100)}%`;
}

function isStrictlyRising(records: AdviceGame[]): boolean {
  if (records.length < 3) return false;
  const recent = records.slice(-3);
  return recent[0].score < recent[1].score && recent[1].score < recent[2].score;
}

function isStrictlyFalling(records: AdviceGame[]): boolean {
  if (records.length < 3) return false;
  const recent = records.slice(-3);
  return recent[0].score > recent[1].score && recent[1].score > recent[2].score;
}

function hasBackToBackTop(records: AdviceGame[]): boolean {
  if (records.length < 2) return false;
  const recent = records.slice(-2);
  return recent.every((game) => game.rank === 1);
}

function averageShift(records: AdviceGame[]): number {
  if (records.length < 4) return 0;
  const midpoint = Math.floor(records.length / 2);
  const firstHalf = records.slice(0, midpoint);
  const secondHalf = records.slice(midpoint);
  return average(secondHalf.map((game) => game.score)) - average(firstHalf.map((game) => game.score));
}

export function generateScoreAdvice(records: AdviceGame[], ruleset: Ruleset): ScoreAdvice {
  if (records.length === 0) {
    return {
      title: '記録待ち',
      message: '対局が増えたら、点数の上がり方から次の一手を出します。',
      detail: 'ローカル分析なのでAI API費用はかかりません。',
      variant: 'neutral',
    };
  }

  if (records.length === 1) {
    return {
      title: 'まずは基準作り',
      message: `今回の${formatNumber(records[0].score)}点を基準に、次の数戦で伸び方を見ていきましょう。`,
      detail: buildDetail(records),
      variant: 'neutral',
    };
  }

  const latest = records[records.length - 1];
  const previous = records[records.length - 2];
  const latestDelta = latest.score - previous.score;
  const scoreShift = latest.score - records[0].score;
  const avgShift = averageShift(records);
  const scores = records.map((game) => game.score);
  const spread = Math.max(...scores) - Math.min(...scores);
  const avgScore = average(scores);
  const topRate = records.filter((game) => game.rank === 1).length / records.length;
  const strongMove = STRONG_MOVE_THRESHOLD[ruleset];
  const trendMove = TREND_THRESHOLD[ruleset];

  if (hasBackToBackTop(records)) {
    return {
      title: '連続トップ',
      message: 'トップが続いています。攻める局面はそのまま、リード後の放銃だけ一段きつく見ると安定しそうです。',
      detail: buildDetail(records),
      variant: 'positive',
    };
  }

  if (isStrictlyRising(records) || latestDelta >= strongMove) {
    return {
      title: '上向き',
      message: '直近の点数は上向きです。良い流れの時ほど、南場の安全牌管理を早めに始めると残りやすくなります。',
      detail: buildDetail(records),
      variant: 'positive',
    };
  }

  if (isStrictlyFalling(records) || latestDelta <= -strongMove) {
    return {
      title: '下げ止めたい',
      message: '直近は下げ気味です。無理に取り返す局面を一つ減らし、親リーチへの押し返し基準を固めましょう。',
      detail: buildDetail(records),
      variant: 'caution',
    };
  }

  if (spread >= HIGH_SPREAD_THRESHOLD[ruleset]) {
    return {
      title: '振れ幅大きめ',
      message: '得点の振れ幅が大きめです。高打点は作れていますが、ラス回避局面は降り始めを半巡早くしてみましょう。',
      detail: buildDetail(records),
      variant: 'caution',
    };
  }

  if (avgScore < SCORE_BASELINE && topRate <= 0.25) {
    return {
      title: '守備を一段早く',
      message: '平均点が原点を下回っています。まずは中盤以降の危険牌を一巡早く止めて、失点幅を削るのが効きそうです。',
      detail: buildDetail(records),
      variant: 'caution',
    };
  }

  if (scoreShift >= trendMove || avgShift >= trendMove) {
    return {
      title: 'じわっと上昇',
      message: '全体では点数が伸びています。親番の連荘チャンスと良形リーチを丁寧に拾えている流れです。',
      detail: buildDetail(records),
      variant: 'positive',
    };
  }

  if (scoreShift <= -trendMove || avgShift <= -trendMove) {
    return {
      title: '立て直しどころ',
      message: '全体では少し下降気味です。序盤から打点を追いすぎず、着順を守る局面を増やしていきましょう。',
      detail: buildDetail(records),
      variant: 'caution',
    };
  }

  return {
    title: '安定中',
    message: '点数は大きく崩れていません。オーラス前の着順意識と供託・本場の拾い方で、もうひと押し狙えます。',
    detail: buildDetail(records),
    variant: 'neutral',
  };
}
