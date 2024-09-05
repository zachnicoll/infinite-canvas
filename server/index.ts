import express from 'express';
import { createServer } from 'http';
import { createSocketIoServer } from '../socket';
import { handler } from '../build/handler.js';

const port = 3000;
const app = express();
const server = createServer(app);

createSocketIoServer(server);

app.use(handler);

server.listen(port);
