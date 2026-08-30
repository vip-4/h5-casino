import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authRoutes } from './routes/auth';
import { playerRoutes } from './routes/player';
import { mapRoutes } from './routes/map';
import { combatRoutes } from './routes/combat';
import { inventoryRoutes } from './routes/inventory';
import { equipmentRoutes } from './routes/equipment';
import { enhanceRoutes } from './routes/enhance';
import { shopRoutes } from './routes/shop';
import { rebirthRoutes } from './routes/rebirth';
import { adminRoutes } from './routes/admin';

export type Bindings = {
  DB: D1Database;
  CACHE: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors());

app.get('/health', (c) => c.json({ status: 'ok', timestamp: Date.now() }));

app.route('/api/auth', authRoutes);
app.route('/api/player', playerRoutes);
app.route('/api/map', mapRoutes);
app.route('/api/combat', combatRoutes);
app.route('/api/inventory', inventoryRoutes);
app.route('/api/equipment', equipmentRoutes);
app.route('/api/enhance', enhanceRoutes);
app.route('/api/shop', shopRoutes);
app.route('/api/rebirth', rebirthRoutes);
app.route('/api/admin', adminRoutes);

export default app;