import { FastifyInstance } from 'fastify';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { getDirectoryStructure } from '../services/fs.service.js';
import { resolveSafePath } from '../utils/safePath.js';
import { CACHE_DIR } from '../services/imageCache.js';

export default async function fsRoutes(fastify: FastifyInstance) {
  fastify.get('/dir', async (request) => {
    const { path = '', onlyImages } = request.query as {
      path?: string;
      onlyImages?: 'true';
    };

    return getDirectoryStructure(fastify.config.FS_ROOT, {
      relativePath: path,
      onlyImages: onlyImages === 'true',
    });
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

    // ─────────────────────────────────────────────
    // cache
    // ─────────────────────────────────────────────
    const cacheDir = path.join(process.cwd(), '.cache');
    await fs.promises.mkdir(CACHE_DIR, { recursive: true });

    const firstPath = paths[0];
    const archiveName =
      path.dirname(firstPath) === '.' ? 'root' : path.basename(path.dirname(firstPath)) || 'root';

    const archivePath = path.join(
      cacheDir,
      `${archiveName}-${Date.now()}.zip`,
    );

    // ─────────────────────────────────────────────
    // create zip on disk
    // ─────────────────────────────────────────────
    const output = fs.createWriteStream(archivePath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.on('error', (err) => {
      fastify.log.error(err);
      throw err;
    });

    archive.pipe(output);

    for (const relativePath of paths) {
      const fullPath = resolveSafePath(
        fastify.config.FS_ROOT,
        relativePath,
      );

      if (!fs.existsSync(fullPath)) continue;

      if (!raw) {
        archive.file(fullPath, {
          name: path.basename(relativePath),
        });
      } else {
        const dir = path.dirname(relativePath);
        const base = path.basename(
          relativePath,
          path.extname(relativePath),
        );
        const rawPath = path.join(dir, `${base}.ARW`);
        const rawFull = resolveSafePath(
          fastify.config.FS_ROOT,
          rawPath,
        );

        if (fs.existsSync(rawFull)) {
          archive.file(rawFull, {
            name: path.basename(rawPath),
          });
        }
      }
    }

    await archive.finalize();

    // ждём пока файл полностью запишется
    await new Promise<void>((resolve, reject) => {
      output.on('close', () => {
        resolve()
      });
      output.on('error', reject);
    });

    // ─────────────────────────────────────────────
    // send to browser
    // ─────────────────────────────────────────────
    const stat = await fs.promises.stat(archivePath);

    const readStream = fs.createReadStream(archivePath);

    // удаляем файл после завершения передачи
    reply.raw.on('close', async () => {
      try {
        await fs.promises.unlink(archivePath);
      } catch (e) {
        fastify.log.warn(e, 'Failed to remove cache zip');
      }
    });

    reply
      .header('Content-Type', 'application/zip')
      .header(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(archiveName)}.zip"`,
      )
      .header('Content-Length', stat.size);

    return readStream;
  });
}
