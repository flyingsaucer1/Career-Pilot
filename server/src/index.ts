import app from './app';
import { connectDatabase } from './config/db';
import { env } from './config/env';
import { retryPendingFileDeletions } from './services/resume.service';

const startServer = async (): Promise<void> => {
  await connectDatabase();

  const server = app.listen(Number(env.PORT), () => {
    console.log(`\n🚀 CareerPilot API running on http://localhost:${env.PORT}`);
    console.log(`📋 Environment: ${env.NODE_ENV}`);
    console.log(`🔗 Client URL: ${env.CLIENT_URL}\n`);
  });

  const retryStorageCleanup = () => {
    void retryPendingFileDeletions().catch(() => {
      console.error('[Resume cleanup] Could not process pending file deletions; will retry later.');
    });
  };
  retryStorageCleanup();
  const cleanupTimer = setInterval(retryStorageCleanup, 15 * 60 * 1000);
  cleanupTimer.unref();

  // Graceful shutdown
  const shutdown = (signal: string) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(() => {
      clearInterval(cleanupTimer);
      console.log('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
