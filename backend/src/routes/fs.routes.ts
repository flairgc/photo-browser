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
    const body = request.body as {
      paths?: string[];
      raw?: boolean;
    };

    if (!body?.paths || !Array.isArray(body.paths) || body.paths.length === 0) {
      return reply.code(400).send({ error: 'paths array is required' });
    }

    const { paths, raw } = body;

    const firstPath = paths[0];
    const archiveName = path.basename(path.dirname(firstPath)) || 'files';

    reply
      .header('Content-Type', 'application/zip')
      .header(
        'Content-Disposition',
        `attachment; filename="${archiveName}.zip"`,
      );

    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    archive.on('error', (err) => {
      fastify.log.error(err);
      reply.raw.destroy(err);
    });

    archive.pipe(reply.raw);

    for (const relativePath of paths) {
      const fullPath = resolveSafePath(
        fastify.config.FS_ROOT,
        relativePath,
      );

      if (!fs.existsSync(fullPath)) continue;

      const stat = fs.statSync(fullPath);
      if (!stat.isFile()) continue;

      // --- основной файл ---
      if (!raw) {
        archive.file(fullPath, {
          name: path.basename(relativePath),
        });
      }

      // --- RAW файл ---
      if (raw) {
        const dir = path.dirname(relativePath);
        const ext = path.extname(relativePath);
        const baseName = path.basename(relativePath, ext);

        const rawRelativePath = path.join(dir, `${baseName}.ARW`);
        const rawFullPath = resolveSafePath(
          fastify.config.FS_ROOT,
          rawRelativePath,
        );

        if (fs.existsSync(rawFullPath)) {
          archive.file(rawFullPath, {
            name: path.basename(rawRelativePath),
          });
        }
      }
    }

    await archive.finalize();
  });

}
