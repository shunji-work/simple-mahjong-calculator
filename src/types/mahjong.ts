export type WinMethod = 'tsumo' | 'ron';
export type AppMode = 'yaku' | 'manual';
export type FuSource = 'manual' | 'assistant';
export type WaitType = 'none' | 'tanki' | 'penchan' | 'kanchan';
export type FuSpecialCase = 'none' | 'pinfu' | 'chiitoitsu';

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

export interface ManualState {
  isOya: boolean;
  winMethod: WinMethod;
  hasNaki: boolean;
  han: number | null;
  fu: number | null;
  fuSource: FuSource;
}

export interface FuAssistantState {
  terminalConcealedTriplets: number;
  terminalOpenTriplets: number;
  simpleConcealedTriplets: number;
  simpleOpenTriplets: number;
  terminalConcealedKans: number;
  terminalOpenKans: number;
  simpleConcealedKans: number;
  simpleOpenKans: number;
  waitType: WaitType;
  isYakuhaiPair: boolean;
  specialCase: FuSpecialCase;
}

export interface FuAssistantResult {
  rawFu: number;
  roundedFu: number;
  specialCase: FuSpecialCase;
  isValid: boolean;
  isApplicable: boolean;
  error?: string;
}

export interface HanFuInput {
  han: number;
  fu: number;
  isOya: boolean;
  winMethod: WinMethod;
  scoreName?: string;
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
