import { sveltekit } from '@sveltejs/kit/vite'
import { type ViteDevServer, defineConfig } from 'vite'
import { createSocketIoServer } from './socket'

const webSocketServer = {
	name: 'webSocketServer',
	configureServer(server: ViteDevServer) {
		if (!server.httpServer) return

		createSocketIoServer(server.httpServer)
	}
}

export default defineConfig({
	plugins: [sveltekit(), webSocketServer]
})
