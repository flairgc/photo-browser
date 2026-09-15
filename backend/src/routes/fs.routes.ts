import { FastifyInstance } from 'fastify';
import path from 'node:path';
import { Readable } from 'node:stream';
import archiver from 'archiver';
import { getDirectoryStructure } from '../services/fs.service.js';
import { normalizeRelativePath } from '../utils/safePath.js';
import { storage } from '../services/storageInstance.js';

export default async function fsRoutes(fastify: FastifyInstance) {
  fastify.get('/dir', async (request) => {
    const { path = '', onlyImages } = request.query as { path?: string; onlyImages?: 'true' };
    return getDirectoryStructure(fastify.config.FS_ROOT, { relativePath: path, onlyImages: onlyImages === 'true' });
  });
  fastify.post('/zip', async (request, reply) => {
    const body = request.body as { paths?: unknown; raw?: string | boolean } | null;
    let paths = body?.paths;
    try { if (typeof paths === 'string') paths = JSON.parse(paths); }
    catch { return reply.code(400).send({ error: 'Invalid paths JSON' }); }
    if (!Array.isArray(paths) || paths.length === 0 || paths.some(p => typeof p !== 'string' || !p)) {
      return reply.code(400).send({ error: 'paths must be a nonempty array of file paths' });
    }
    let selected: string[];
    try { selected = paths.map(p => normalizeRelativePath(p)); }
    catch { return reply.code(400).send({ error: 'Invalid path' }); }
    const archiveName = path.posix.basename(path.posix.dirname(selected[0])) || 'root';
    const archive = archiver('zip', { zlib: { level: 9 } });
    const inputs: Readable[] = [];
    archive.once('close', () => inputs.forEach(input => input.destroy()));
    // Open one source at a time as archiver consumes it, including for large RAW files.
    for (const selectedPath of selected) {
      let sourcePath = selectedPath;
      if (body?.raw === 'true' || body?.raw === true) {
        const dir = path.posix.dirname(sourcePath);
        const rawName = `${path.posix.parse(sourcePath).name}.arw`.toLowerCase();
        const match = (await storage.list(dir === '.' ? '' : dir)).find(e => e.isFile() && e.name.toLowerCase() === rawName);
        if (!match) continue;
        sourcePath = path.posix.join(dir, match.name);
      }
      const input = Readable.from((async function* () {
        const stream = await storage.stream(sourcePath);
        try { for await (const chunk of stream) yield chunk; }
        finally { stream.destroy(); }
      })());
      input.on('error', error => archive.destroy(error));
      inputs.push(input);
      archive.append(input, { name: path.posix.basename(sourcePath) });
    }
    reply.raw.once('close', () => archive.destroy());
    archive.on('error', error => fastify.log.error(error, 'ZIP stream failed'));
    reply.type('application/zip').header('Content-Disposition', `attachment; filename="${encodeURIComponent(archiveName === '.' ? 'root' : archiveName)}.zip"`);
    void archive.finalize().catch(error => archive.destroy(error));
    return reply.send(archive);
  });
}
