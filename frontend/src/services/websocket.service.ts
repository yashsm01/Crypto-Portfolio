import { io, Socket } from "socket.io-client";

interface PriceUpdate {
  symbol: string;
  oldPrice: string | number;
  newPrice: string | number;
  percentageChange: number;
  userId: number;
}

class WebSocketService {
  private socket: Socket | null = null;

  constructor() {
    this.connect();
  }

  private connect() {
    const token = localStorage.getItem('token');
    if (!token) return;

    this.socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
      auth: {
        token,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });
  }

  public subscribeToUpdates(callback: (data: PriceUpdate) => void) {
    if (!this.socket) {
      this.connect();
    }

    this.socket?.on('priceUpdate', (data: PriceUpdate) => {
      console.log('Received price update:', data);
      callback(data);
    });
  }

  public subscribeToSignificantChanges(callback: (data: PriceUpdate) => void) {
    if (!this.socket) {
      this.connect();
    }

    this.socket?.on('significantPriceChange', (data: PriceUpdate) => {
      console.log('Received significant price change:', data);
      callback(data);
    });
  }

  public disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const websocketService = new WebSocketService();