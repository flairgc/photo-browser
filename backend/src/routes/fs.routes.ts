import { FastifyInstance } from 'fastify';
import { getDirectoryStructure } from '../services/fs.service.js';
import { readExifText } from '../utils/readExifText.js';
import { resolveSafePath } from '../utils/safePath.js';

export default async function fsRoutes(app: FastifyInstance) {
    app.get('/dir', async (request) => {
        const { path = '', onlyImages } = request.query as { path?: string, onlyImages: 'true' | undefined };

        return getDirectoryStructure(app.config.FS_ROOT, { relativePath: path, onlyImages: onlyImages === 'true' });
    });

  app.get('/exif', async (request, reply) => {
    const { path } = request.query as { path?: string };

    if (!path) {
      return reply.code(400).send({ error: 'path is required' });
    }

    const fullPath = resolveSafePath(app.config.FS_ROOT, path);

    return await readExifText(fullPath);
  });
}
