import { API_URL } from '@/constants/game';
import type { RoomState, GameState } from '@/constants/game';

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_URL;
  }

  setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || 'Request failed');
    }

    return response.json();
  }

  async getCards() {
    return this.request<{ cards: any[] }>('/api/cards');
  }

  async createRoom(playerName: string, maxPlayers: number = 4) {
    return this.request<{
      roomId: string;
      roomCode: string;
      playerId: string;
      room: RoomState;
    }>('/api/rooms', {
      method: 'POST',
      body: JSON.stringify({ playerName, maxPlayers }),
    });
  }

  async joinRoom(roomCode: string, playerName: string) {
    return this.request<{
      roomId: string;
      playerId: string;
      room: RoomState;
    }>('/api/rooms/join', {
      method: 'POST',
      body: JSON.stringify({ roomCode, playerName }),
    });
  }

  async getRoom(roomId: string) {
    return this.request<RoomState>(`/api/rooms/${roomId}`);
  }

  async toggleReady(roomId: string, playerId: string) {
    return this.request<{ success: boolean; room: RoomState }>(
      `/api/rooms/${roomId}/ready?player_id=${playerId}`,
      { method: 'POST' }
    );
  }

  async startGame(roomId: string, playerId: string) {
    return this.request<{ success: boolean; gameId: string }>(
      `/api/rooms/${roomId}/start?player_id=${playerId}`,
      { method: 'POST' }
    );
  }

  async drawCards(roomId: string, playerId: string) {
    return this.request<{ success: boolean; drawn: string[] }>(
      `/api/games/${roomId}/draw?player_id=${playerId}`,
      { method: 'POST' }
    );
  }

  async playCard(
    roomId: string,
    playerId: string,
    cardId: string,
    options: {
      asBank?: boolean;
      targetPlayerId?: string;
      targetCardId?: string;
      targetColor?: string;
      giverCardId?: string;
      doubleRent?: boolean;
      doubleRentCardId?: string;
    } = {}
  ) {
    return this.request<{ success: boolean; action: string; [key: string]: any }>(
      `/api/games/${roomId}/play?player_id=${playerId}`,
      {
        method: 'POST',
        body: JSON.stringify({
          cardId,
          asBank: options.asBank || false,
          targetPlayerId: options.targetPlayerId,
          targetCardId: options.targetCardId,
          targetColor: options.targetColor,
          giverCardId: options.giverCardId,
          doubleRent: options.doubleRent || false,
          doubleRentCardId: options.doubleRentCardId,
        }),
      }
    );
  }

  async respondToAction(
    roomId: string,
    playerId: string,
    responseType: 'pay' | 'justSayNo' | 'accept',
    cardIds: string[] = []
  ) {
    return this.request<{ success: boolean; response: string }>(
      `/api/games/${roomId}/respond?player_id=${playerId}`,
      {
        method: 'POST',
        body: JSON.stringify({ type: responseType, cardIds }),
      }
    );
  }

  async endTurn(roomId: string, playerId: string) {
    return this.request<{ success: boolean; nextPlayer?: string; winner?: string; excess?: number }>(
      `/api/games/${roomId}/end-turn?player_id=${playerId}`,
      { method: 'POST' }
    );
  }

  async discardCards(roomId: string, playerId: string, cardIds: string[]) {
    return this.request<{ success: boolean; remaining?: number }>(
      `/api/games/${roomId}/discard?player_id=${playerId}`,
      {
        method: 'POST',
        body: JSON.stringify(cardIds),
      }
    );
  }

  async getPaymentInfo(roomId: string, playerId: string) {
    return this.request<{
      required_amount: number;
      total_available: number;
      payable_cards: Array<{
        id: string;
        value: number;
        source: 'bank' | 'property';
        name: string;
        color?: string;
      }>;
      can_pay_full: boolean;
      must_pay_all: boolean;
    }>(`/api/games/${roomId}/payment-info?player_id=${playerId}`);
  }

  async handleTimeout(roomId: string, playerId: string) {
    return this.request<{
      success: boolean;
      timeout_actions: Array<{ action: string; card?: string; cards?: string[] }>;
      nextPlayer?: string;
      winner?: string;
    }>(
      `/api/games/${roomId}/timeout?player_id=${playerId}`,
      { method: 'POST' }
    );
  }

  async moveWildcard(
    roomId: string,
    playerId: string,
    cardId: string,
    fromColor: string,
    toColor: string
  ) {
    return this.request<{
      success: boolean;
      action: string;
      from: string;
      to: string;
    }>(
      `/api/games/${roomId}/move-wildcard?player_id=${playerId}`,
      {
        method: 'POST',
        body: JSON.stringify({ cardId, fromColor, toColor }),
      }
    );
  }
}

export const api = new ApiService();
