import path from 'path';
import { FastifyInstance } from 'fastify';
import { createFileStream, createPreviewViewImage } from '../services/image.service.js';
import { readExifText } from '../utils/readExifText.js';
import { resolveSafePath } from '../utils/safePath.js';


export default async function imageRoutes(fastify: FastifyInstance) {

  fastify.get('/file', async (request, reply) => {
    const params = request.query as { path: string, preview?: null };
    const { path: filePath } = params;


    const stream = await createFileStream(fastify.config.FS_ROOT, filePath);

    const ext = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath);

    const isImage = ext === '.jpg' || ext === '.jpeg';

    const isPreview = 'preview' in params && isImage;

    reply
      .header(
        'Content-Type',
        isPreview && isPreview ? 'image/jpeg' : 'application/octet-stream',
      )
      .header(
        'Content-Disposition',
        isPreview
          ? `inline; filename="${encodeURIComponent(fileName)}"`
          : `attachment; filename="${encodeURIComponent(fileName)}"`,
      );

    return stream;
  });


  fastify.get('/exif', async (request, reply) => {
    const { path } = request.query as { path?: string };

    if (!path) {
      return reply.code(400).send({ error: 'path is required' });
    }

    const fullPath = resolveSafePath(fastify.config.FS_ROOT, path);

    return await readExifText(fullPath);
  });


  fastify.get('/preview', async (request, reply) => {
    const { path, size } = request.query as { path: string, size: 'small' | 'big' };

    const buffer = await createPreviewViewImage(fastify.config.FS_ROOT, { relativePath: path, size });

    reply
      .type('image/jpeg')
      .header('Cache-Control', 'public, max-age=3600');

    return reply.send(buffer);
  });
}
