import { FastifyInstance } from 'fastify';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { getDirectoryStructure } from '../services/fs.service.js';
import { resolveSafePath } from '../utils/safePath.js';


export default async function fsRoutes(fastify: FastifyInstance) {
  fastify.get('/dir', async (request) => {
    const { path = '', onlyImages } = request.query as { path?: string, onlyImages: 'true' | undefined };

    return getDirectoryStructure(fastify.config.FS_ROOT, { relativePath: path, onlyImages: onlyImages === 'true' });
  });

  fastify.post('/zip', async (request, reply) => {
    const body = request.body as any;

    const paths =
      typeof body.paths === 'string'
        ? JSON.parse(body.paths)
        : body.paths;

    const raw = body.raw === 'true';

    if (!Array.isArray(paths) || paths.length === 0) {
      return reply.code(400).send({ error: 'paths array is required' });
    }

    const firstPath = paths[0];
    const archiveName = path.basename(path.dirname(firstPath)) || 'files';

    console.log('firstPath', firstPath)
    console.log('archiveName', archiveName)

    reply
      .header('Content-Type', 'application/zip')
      .header(
        'Content-Disposition',
        // `attachment; filename="${archiveName}.zip"`,
        `attachment; filename="test.zip"`,
      );

    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.on('error', (err) => {
      fastify.log.error(err);
      reply.raw.destroy(err);
    });

    // archive.on('end', () => {
    //   reply.raw.end();
    // });

    // archive.file('example.txt', { name: 'example.txt' });
    archive.pipe(reply.raw);

    for (const relativePath of paths) {
      const fullPath = resolveSafePath(fastify.config.FS_ROOT, relativePath);
      if (!fs.existsSync(fullPath)) continue;

      if (!raw) {
        archive.file(fullPath, { name: path.basename(relativePath) });
      } else {
        const dir = path.dirname(relativePath);
        const base = path.basename(relativePath, path.extname(relativePath));
        const rawPath = path.join(dir, `${base}.ARW`);
        const rawFull = resolveSafePath(fastify.config.FS_ROOT, rawPath);

        if (fs.existsSync(rawFull)) {
          archive.file(rawFull, { name: path.basename(rawPath) });
        }
      }
    }

    await archive.finalize();
  });


}
