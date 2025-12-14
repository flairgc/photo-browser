import { FastifyInstance } from 'fastify';
import { createPreviewStream, createFileStream, createPreviewViewImage } from '../services/image.service.js';

export default async function imageRoutes(app: FastifyInstance) {
    app.get('/view', async (request, reply) => {
        const { path } = request.query as { path: string };

        console.log('path', path)

        const stream = await createPreviewStream(app.config.FS_ROOT, path);

        reply.type('image/jpeg');
        return reply.send(stream);
    });

    app.get('/file', async (request, reply) => {
        const { path } = request.query as { path: string };

        const stream = await createFileStream(app.config.FS_ROOT, path);

        reply.header(
            'Content-Disposition',
            `attachment; filename="${encodeURIComponent(path.split('/').pop()!)}"`
        );

        return reply.send(stream);
    });

    app.get('/preview', async (request, reply) => {
        const { path } = request.query as { path: string };

        const buffer = await createPreviewViewImage(app.config.FS_ROOT, path);

        reply
            .type('image/jpeg')
            .header('Cache-Control', 'public, max-age=3600');

        return reply.send(buffer);
    });
}
