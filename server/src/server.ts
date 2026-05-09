import http from 'http';
import app from './app';
import connectDB from './config/db';
import { env } from './config/env';
import { initializeSocket } from './socket/socket';

const startServer = async () => {
  await connectDB();

  const server = http.createServer(app);
  initializeSocket(server);

  server.listen(env.PORT, () => {
    console.log(`Server is running on port ${env.PORT}`);
  });
};

startServer();
