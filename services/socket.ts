import { WS_URL } from '@/constants/game';

type MessageHandler = (message: any) => void;

class SocketService {
  private ws: WebSocket | null = null;
  private handlers: Map<string, MessageHandler[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private roomId: string | null = null;
  private playerId: string | null = null;
  private baseUrl: string = WS_URL;

  setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  connect(roomId: string, playerId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.roomId = roomId;
      this.playerId = playerId;

      const url = `${this.baseUrl}/ws/${roomId}/${playerId}`;
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket closed');
        this.handleDisconnect();
      };
    });
  }

  private handleMessage(message: any) {
    const { type } = message;
    const handlers = this.handlers.get(type) || [];
    handlers.forEach((handler) => handler(message));

    const allHandlers = this.handlers.get('*') || [];
    allHandlers.forEach((handler) => handler(message));
  }

  private handleDisconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.roomId && this.playerId) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
      setTimeout(() => {
        if (this.roomId && this.playerId) {
          this.connect(this.roomId, this.playerId).catch(console.error);
        }
      }, 2000 * this.reconnectAttempts);
    }
  }

  on(type: string, handler: MessageHandler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    const handlers = this.handlers.get(type)!;
    if (!handlers.includes(handler)) {
      handlers.push(handler);
    }
  }

  clearHandlers() {
    this.handlers.clear();
  }

  off(type: string, handler: MessageHandler) {
    const handlers = this.handlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  send(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  sendChat(text: string) {
    this.send({ type: 'chat', message: text });
  }

  ping() {
    this.send({ type: 'ping' });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.roomId = null;
    this.playerId = null;
    this.handlers.clear();
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

export const socket = new SocketService();
