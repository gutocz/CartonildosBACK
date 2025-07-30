import { WebSocket } from 'ws';

export interface MyWebSocket extends WebSocket {
  isAlive: boolean;
}

export interface WebSocketMessage {
  type: string;
  payload: any;
}

export interface CardOnTable {
  cardContent: string;
  revealed: boolean;
}