import { FastifyInstance } from 'fastify';
import { getDirectoryStructure } from '../services/fs.service.js';

export default async function fsRoutes(app: FastifyInstance) {
    app.get('/dir', async (request) => {
        const { path = '', onlyImages } = request.query as { path?: string, onlyImages: 'true' | undefined };

        return getDirectoryStructure(app.config.FS_ROOT, { relativePath: path, onlyImages: onlyImages === 'true' });
    });
}
