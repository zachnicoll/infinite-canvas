<script lang="ts">
	import Canvas from '$lib/components/Canvas.svelte';
	import { viewportStore, mouseStore } from '$lib/stores';

	$: viewport = $viewportStore;
	$: mouse = $mouseStore;

	import { io } from 'socket.io-client';
	const socket = io();
	socket.on('eventFromServer', (message) => {
		console.log(message);
	});
</script>

<main>
	<Canvas />

	<div class="top-bar">
		<h1>
			{mouse.x}, {mouse.y}
		</h1>
	</div>
</main>

<style>
	:global(body) {
		margin: 0;
		font-family: 'Arial', sans-serif;
	}

	main {
		width: 100vw;
		height: 100vh;
		overflow: hidden;
		padding: 0px;
	}

	.top-bar {
		position: fixed;
		top: 0;
		left: 0;
		padding: 10px;
		width: 100%;
	}
</style>
