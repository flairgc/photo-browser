import { FastifyInstance } from 'fastify';
import { getDirectoryStructure } from '../services/fs.service.js';

export default async function fsRoutes(app: FastifyInstance) {
    app.get('/dir', async (request) => {
        const { path = '' } = request.query as { path?: string };

        return getDirectoryStructure(app.config.FS_ROOT, path);
    });
}
