import app from './app';
import { config } from './config';
import { connectDatabase, disconnectDatabase } from './config/db';

async function startServer(): Promise<void> {
  // 1. Establish database connection
  await connectDatabase();

  // 2. Start HTTP listener
  const server = app.listen(config.port, () => {
    console.log(`[Server] Code-Liner API running in ${config.nodeEnv} mode on port ${config.port}`);
  });

  // Graceful shutdown strategy
  const gracefulShutdown = async () => {
    console.log('\nShutdown request received. Terminating database and network sockets...');
    server.close(async () => {
      await disconnectDatabase();
      console.log('Database connection released. Graceful shutdown finished.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
}

startServer().catch(err => {
  console.error('Fatal initialization error:', err);
  process.exit(1);
});
