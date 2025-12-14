import 'fastify';
import type { env } from '../config/env.js';

declare module 'fastify' {
    interface FastifyInstance {
        config: typeof env;
    }
}
