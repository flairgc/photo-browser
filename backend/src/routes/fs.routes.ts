import { FastifyInstance } from 'fastify';
import fs from 'fs';
import archiver from 'archiver';
import { getDirectoryStructure } from '../services/fs.service.js';
import { resolveSafePath } from '../utils/safePath.js';


export default async function fsRoutes(fastify: FastifyInstance) {
  fastify.get('/dir', async (request) => {
    const { path = '', onlyImages } = request.query as { path?: string, onlyImages: 'true' | undefined };

    return getDirectoryStructure(fastify.config.FS_ROOT, { relativePath: path, onlyImages: onlyImages === 'true' });
  });

  fastify.post('/zip', async (request, reply) => {
    const body = request.body as { paths?: string[] };

    if (!body?.paths || !Array.isArray(body.paths) || body.paths.length === 0) {
      return reply.code(400).send({ error: 'paths array is required' });
    }

    reply
      .header('Content-Type', 'application/zip')
      .header(
        'Content-Disposition',
        'attachment; filename="files.zip"',
      );

    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    archive.on('error', (err) => {
      fastify.log.error(err);
      reply.raw.destroy(err);
    });

    archive.pipe(reply.raw);

    for (const relativePath of body.paths) {
      const fullPath = resolveSafePath(fastify.config.FS_ROOT, relativePath);

      const stat = fs.statSync(fullPath);

      if (stat.isFile()) {
        archive.file(fullPath, {
          name: relativePath.replace(/\\/g, '/'),
        });
      }
    }

    await archive.finalize();
  });
}
