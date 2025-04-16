export interface ChatPart {
  text: string
}

export interface ChatMessage {
role: 'system' | 'user' | 'assistant';
content: string;
createdAt?: number;
}

export type ChatRole = ChatMessage['role'];

export interface ErrorMessage {
code: string
message: string
}