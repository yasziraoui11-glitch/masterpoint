require('dotenv').config();

const config = require('./config');
const { buildApp } = require('./app');
const { bootstrapInitialAdmin } = require('./bootstrap');
const { logger } = require('./middleware/logger');
const { prisma } = require('./db/prisma');

async function main() {
  await bootstrapInitialAdmin();

  const app = buildApp();
  const server = app.listen(config.port, () => logger.info({ port: config.port }, 'API started'));

  async function shutdown(signal) {
    logger.info({ signal }, 'Shutting down');
    server.close(async () => {
      await prisma.$disconnect().catch(()=>{});
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  }

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
