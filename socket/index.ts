import { Server } from 'socket.io';
import { Server as ExpressServer } from 'http';
import type { HttpServer } from 'vite';

export const createSocketIoServer = (server: HttpServer | ExpressServer) => {
	const io = new Server(server);

	io.on('connection', (socket) => {
		socket.emit('eventFromServer', 'Hello, World 👋');
	});
};
