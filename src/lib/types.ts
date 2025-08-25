export interface User {
  name: string;
  phone: string;
}

export interface QueuePerson {
  id: string;
  name: string;
  phone: string;
  position: number;
  queueType: 'confissoes' | 'direcao-espiritual';
  createdAt: string;
}

export interface QueueItem {
  id: string;
  name: string;
  phone: string;
  position: number;
  queueType: 'confissoes' | 'direcao-espiritual';
  createdAt: string;
}

export interface CalledPerson {
  id: string;
  name: string;
  phone: string;
  queueType: 'confissoes' | 'direcao-espiritual';
  calledAt: number; // timestamp
  expiresAt: number; // timestamp + 5 minutos
  status: 'waiting' | 'confirmed' | 'no-show';
  updatedAt?: number; // timestamp quando status foi alterado
}

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export type QueueType = 'confissoes' | 'direcao-espiritual';

