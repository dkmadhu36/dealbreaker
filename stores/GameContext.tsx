import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import type { RoomState, GameState, PlayerState } from '@/constants/game';
import { api } from '@/services/api';
import { socket } from '@/services/socket';

interface GameContextState {
  roomId: string | null;
  playerId: string | null;
  playerName: string | null;
  room: RoomState | null;
  gameState: GameState | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  selectedCard: string | null;
}

type GameAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ROOM'; payload: { roomId: string; playerId: string; playerName: string; room: RoomState } }
  | { type: 'UPDATE_ROOM'; payload: RoomState }
  | { type: 'SET_GAME_STATE'; payload: GameState }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_SELECTED_CARD'; payload: string | null }
  | { type: 'RESET' };

const initialState: GameContextState = {
  roomId: null,
  playerId: null,
  playerName: null,
  room: null,
  gameState: null,
  isConnected: false,
  isLoading: false,
  error: null,
  selectedCard: null,
};

function gameReducer(state: GameContextState, action: GameAction): GameContextState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'SET_ROOM':
      return {
        ...state,
        roomId: action.payload.roomId,
        playerId: action.payload.playerId,
        playerName: action.payload.playerName,
        room: action.payload.room,
        isLoading: false,
        error: null,
      };
    case 'UPDATE_ROOM':
      return { ...state, room: action.payload };
    case 'SET_GAME_STATE':
      return { ...state, gameState: action.payload };
    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload };
    case 'SET_SELECTED_CARD':
      return { ...state, selectedCard: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface GameContextValue extends GameContextState {
  createRoom: (playerName: string, maxPlayers?: number) => Promise<void>;
  joinRoom: (roomCode: string, playerName: string) => Promise<void>;
  toggleReady: () => Promise<void>;
  startGame: () => Promise<void>;
  drawCards: () => Promise<void>;
  playCard: (cardId: string, options?: { asBank?: boolean; targetPlayerId?: string; targetCardId?: string; targetColor?: string; giverCardId?: string; doubleRent?: boolean; doubleRentCardId?: string }) => Promise<{ success: boolean; error?: string }>;
  respondToAction: (responseType: 'pay' | 'justSayNo' | 'accept', cardIds?: string[]) => Promise<void>;
  endTurn: () => Promise<void>;
  discardCards: (cardIds: string[]) => Promise<void>;
  handleTimeout: () => Promise<void>;
  moveWildcard: (cardId: string, fromColor: string, toColor: string) => Promise<void>;
  selectCard: (cardId: string | null) => void;
  leaveRoom: () => void;
  clearError: () => void;
  isMyTurn: boolean;
  myPlayer: PlayerState | null;
  myHand: string[];
  opponents: PlayerState[];
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const setupSocketHandlers = useCallback(() => {
    socket.clearHandlers();
    
    socket.on('roomState', (msg) => {
      dispatch({ type: 'UPDATE_ROOM', payload: msg.data });
    });

    socket.on('gameState', (msg) => {
      console.log('Game state update received', {
        phase: msg.data?.phase,
        pendingAction: msg.data?.pendingAction ? {
          type: msg.data.pendingAction.type,
          targetPlayers: msg.data.pendingAction.targetPlayers,
          responses: msg.data.pendingAction.responses
        } : null
      });
      dispatch({ type: 'SET_GAME_STATE', payload: msg.data });
    });

    socket.on('playerReady', (msg) => {
      dispatch({ type: 'UPDATE_ROOM', payload: msg.room });
    });

    socket.on('gameStarted', () => {
      console.log('Game started!');
    });

    socket.on('cardPlayed', (msg) => {
      console.log('Card played:', msg.cardId);
    });

    socket.on('turnTimeout', (msg) => {
      console.log('Turn timeout:', msg);
    });

    socket.on('gameOver', (msg) => {
      console.log('Game over! Winner:', msg.winner);
    });

    socket.on('playerConnected', (msg) => {
      console.log('Player connected:', msg.playerId);
    });

    socket.on('playerDisconnected', (msg) => {
      console.log('Player disconnected:', msg.playerId);
    });

    socket.on('chat', (msg) => {
      console.log('Chat:', msg.playerId, msg.message);
    });
  }, []);

  const createRoom = useCallback(async (playerName: string, maxPlayers = 4) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const result = await api.createRoom(playerName, maxPlayers);
      dispatch({
        type: 'SET_ROOM',
        payload: {
          roomId: result.roomId,
          playerId: result.playerId,
          playerName,
          room: result.room,
        },
      });

      setupSocketHandlers();
      await socket.connect(result.roomId, result.playerId);
      dispatch({ type: 'SET_CONNECTED', payload: true });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  }, [setupSocketHandlers]);

  const joinRoom = useCallback(async (roomCode: string, playerName: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const result = await api.joinRoom(roomCode.toUpperCase(), playerName);
      dispatch({
        type: 'SET_ROOM',
        payload: {
          roomId: result.roomId,
          playerId: result.playerId,
          playerName,
          room: result.room,
        },
      });

      setupSocketHandlers();
      await socket.connect(result.roomId, result.playerId);
      dispatch({ type: 'SET_CONNECTED', payload: true });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  }, [setupSocketHandlers]);

  const toggleReady = useCallback(async () => {
    if (!state.roomId || !state.playerId) return;
    try {
      await api.toggleReady(state.roomId, state.playerId);
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, [state.roomId, state.playerId]);

  const startGame = useCallback(async () => {
    if (!state.roomId || !state.playerId) return;
    try {
      await api.startGame(state.roomId, state.playerId);
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, [state.roomId, state.playerId]);

  const drawCards = useCallback(async () => {
    if (!state.roomId || !state.playerId) return;
    try {
      await api.drawCards(state.roomId, state.playerId);
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, [state.roomId, state.playerId]);

  const playCard = useCallback(async (
    cardId: string,
    options: { asBank?: boolean; targetPlayerId?: string; targetCardId?: string; targetColor?: string; giverCardId?: string; doubleRent?: boolean; doubleRentCardId?: string } = {}
  ): Promise<{ success: boolean; error?: string }> => {
    if (!state.roomId || !state.playerId) return { success: false, error: 'Not connected' };
    try {
      await api.playCard(state.roomId, state.playerId, cardId, options);
      dispatch({ type: 'SET_SELECTED_CARD', payload: null });
      dispatch({ type: 'SET_ERROR', payload: null });
      return { success: true };
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  }, [state.roomId, state.playerId]);

  const respondToAction = useCallback(async (
    responseType: 'pay' | 'justSayNo' | 'accept',
    cardIds: string[] = []
  ) => {
    if (!state.roomId || !state.playerId) return;
    try {
      await api.respondToAction(state.roomId, state.playerId, responseType, cardIds);
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, [state.roomId, state.playerId]);

  const endTurn = useCallback(async () => {
    if (!state.roomId || !state.playerId) return;
    try {
      await api.endTurn(state.roomId, state.playerId);
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, [state.roomId, state.playerId]);

  const discardCards = useCallback(async (cardIds: string[]) => {
    if (!state.roomId || !state.playerId) return;
    try {
      await api.discardCards(state.roomId, state.playerId, cardIds);
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, [state.roomId, state.playerId]);

  const selectCard = useCallback((cardId: string | null) => {
    dispatch({ type: 'SET_SELECTED_CARD', payload: cardId });
  }, []);

  const handleTimeout = useCallback(async () => {
    if (!state.roomId || !state.playerId) {
      console.log('Cannot handle timeout: no room or player ID');
      return;
    }
    console.log('Handling timeout for room:', state.roomId, 'player:', state.playerId);
    try {
      const result = await api.handleTimeout(state.roomId, state.playerId);
      console.log('Timeout handled successfully:', result);
    } catch (error: any) {
      console.error('Timeout error:', error.message);
      dispatch({ type: 'SET_ERROR', payload: `Turn timeout failed: ${error.message}. Please end turn manually.` });
    }
  }, [state.roomId, state.playerId]);

  const moveWildcard = useCallback(async (cardId: string, fromColor: string, toColor: string) => {
    if (!state.roomId || !state.playerId) return;
    try {
      await api.moveWildcard(state.roomId, state.playerId, cardId, fromColor, toColor);
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, [state.roomId, state.playerId]);

  const leaveRoom = useCallback(() => {
    socket.disconnect();
    dispatch({ type: 'RESET' });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  const isMyTurn = state.gameState?.currentTurn?.playerId === state.playerId;
  
  const myPlayer = state.gameState?.players.find(p => p.id === state.playerId) || null;
  
  const myHand = Array.isArray(myPlayer?.hand) ? myPlayer.hand : [];
  
  const opponents = state.gameState?.players.filter(p => p.id !== state.playerId) || [];

  const value: GameContextValue = {
    ...state,
    createRoom,
    joinRoom,
    toggleReady,
    startGame,
    drawCards,
    playCard,
    respondToAction,
    endTurn,
    discardCards,
    handleTimeout,
    moveWildcard,
    selectCard,
    leaveRoom,
    clearError,
    isMyTurn,
    myPlayer,
    myHand,
    opponents,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
