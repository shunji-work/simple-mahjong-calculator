export type WinMethod = 'tsumo' | 'ron';

export interface Yaku {
  id: string;
  name: string;
  han: number;
  menzenOnly: boolean;
  category: 'S' | 'A' | 'B' | 'C';
  kuisagari?: boolean;
}

export interface GameState {
  selectedYaku: string[];
  doraCount: number;
  winMethod: WinMethod;
  hasNaki: boolean;
  isOya: boolean;
}

export interface ScoreResult {
  fu: number;
  totalHan: number;
  basePoints: number;
  oyaPay?: number;
  koPay?: number;
  ronPay: number;
  scoreName: string;
}
