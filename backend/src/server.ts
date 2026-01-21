import http from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { SchedulerService } from './services/scheduler.service.js';

const server = http.createServer(app);

// Handle server errors
server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof env.PORT === 'string' 
    ? `Pipe ${env.PORT}` 
    : `Port ${env.PORT}`;

  // Handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      logger.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});

// Handle process termination
const onProcessTermination = (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  // Force close server after 5 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 5000);
};

// Handle different termination signals
['SIGTERM', 'SIGINT'].forEach(signal => {
  process.on(signal, () => onProcessTermination(signal));
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown) => {
  const errorMessage = reason instanceof Error ? reason.message : String(reason);
  logger.error(`Unhandled rejection: ${errorMessage}`);
  if (reason instanceof Error) {
    logger.error(reason.stack);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error(`Uncaught exception: ${error.message}`);
  logger.error(error.stack);
  process.exit(1);
});

// Start the server
const startServer = () => {
  const port = env.PORT || 3000;
  
  server.listen(port, () => {
    const address = server.address();
    const bind = typeof address === 'string' 
      ? `pipe ${address}` 
      : `port ${address?.port || port}`;
    
    logger.info(`🚀 Server listening on ${bind}`);
    logger.info(`Environment: ${env.NODE_ENV}`);
    
    // Initialize Scheduler
    SchedulerService.init();
  });
};

startServer();
