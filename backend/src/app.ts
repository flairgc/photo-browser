import Fastify from 'fastify';
import { env } from './config/env.js';
import fsRoutes from './routes/fs.routes.js';
import imageRoutes from './routes/image.routes.js';

export function buildApp() {
    const app = Fastify({ logger: process.env.NODE_ENV !== 'production' });

    app.decorate('config', env);


    app.get('/api/hi', async () => {
        return {hello: 'world'};
    });

    app.register(fsRoutes, { prefix: '/api/fs' });
    app.register(imageRoutes, { prefix: '/api/image' });

    return app;
}
