// Tipos compartilhados entre o Frontend e as Cloud Functions
export interface User {
  name: string;
  phone: string;
}

export type QueueType = "confissoes" | "direcao-espiritual";
