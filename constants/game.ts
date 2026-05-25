export const API_URL = 'http://10.159.111.171:8000';
export const WS_URL = 'ws://10.159.111.171:8000';

export type GamePhase = 'waiting' | 'draw' | 'action' | 'response' | 'payment' | 'discard' | 'finished';

export const TURN_TIME_LIMIT = 60; // seconds

export interface PropertySet {
  color: string;
  cards: string[];
  house: boolean;
  hotel: boolean;
}

export interface PlayerState {
  id: string;
  name: string;
  hand: string[] | number;
  bank: string[];
  bankCount?: number;
  properties: PropertySet[];
  isConnected: boolean;
  isReady: boolean;
}

export interface TurnState {
  playerId: string;
  cardsPlayed: number;
  cardsDrawn: boolean;
}

export interface PendingAction {
  type: string;
  fromPlayer: string;
  targetPlayers: string[];
  amount?: number;
  targetProperty?: string;
  giverProperty?: string;
  targetSet?: string;
  responses: Record<string, { type: string; amount?: number }>;
}

export interface PayableCard {
  id: string;
  value: number;
  source: 'bank' | 'property';
  name: string;
  color?: string;
}

export interface PaymentInfo {
  required_amount: number;
  total_available: number;
  payable_cards: PayableCard[];
  can_pay_full: boolean;
  must_pay_all: boolean;
}

export interface GameState {
  id: string;
  roomId: string;
  players: PlayerState[];
  currentPlayerIndex: number;
  turnNumber: number;
  phase: GamePhase;
  drawPileCount: number;
  discardPile: string[];
  currentTurn: TurnState | null;
  pendingAction: PendingAction | null;
  winner: string | null;
}

export interface RoomState {
  id: string;
  code: string;
  host: string;
  players: PlayerState[];
  maxPlayers: number;
  status: 'waiting' | 'playing' | 'finished';
  gameState?: GameState;
}

export const GAME_COLORS = {
  background: '#151921',
  surface: '#1E2430',
  surfaceLight: '#2A3142',
  primary: '#4CAF50',
  secondary: '#42A5F5',
  accent: '#FFD54F',
  danger: '#EF5350',
  warning: '#FFA726',
  text: '#FFFFFF',
  textSecondary: '#9CA3AF',
  border: '#374151',
  cardBack: '#1E3A5F',
  money: '#66BB6A',
  success: '#4CAF50',
  purple: '#AB47BC',
};

export const RENT_VALUES: Record<string, number[]> = {
  brown: [1, 2],
  lightBlue: [1, 2, 3],
  pink: [1, 2, 4],
  orange: [1, 3, 5],
  red: [2, 3, 6],
  yellow: [2, 4, 6],
  green: [2, 4, 7],
  darkBlue: [3, 8],
  railroad: [1, 2, 3, 4],
  utility: [1, 2],
};
