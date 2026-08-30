import { Context } from 'hono';
import { Bindings } from '../index';

declare module 'hono' {
  interface ContextVariableMap {
    userId: number;
  }
}

export type AppContext = Context<{ Bindings: Bindings }>;