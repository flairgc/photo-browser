import { buildApp } from './app.js';

const app = buildApp();

console.log('Backend app.config', app.config)

const start = async () => {
    try {
        await app.listen({ port: app.config.PORT, host: '0.0.0.0' });
        console.log(`🚀 Server started on ${app.config.PORT}`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();
