<script lang="ts">
	import { onMount } from 'svelte';
	import { mouseStore, viewportStore } from '../stores';

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	let width: number;
	let height: number;
	let animationFrameId: number;

	const GRID_SIZE = 50;
	const GRID_COLOR = 'rgba(200, 200, 200, 0.2)';
	const MIN_SCALE = 0.1;
	const MAX_SCALE = 5;
	let lastX = 0;
	let lastY = 0;

	let isDragging = false;

	$: viewport = $viewportStore;

	onMount(() => {
		const maybeCtx = canvas.getContext('2d');
		if (!maybeCtx) {
			throw new Error('Could not get 2d context from canvas');
		}

		ctx = maybeCtx;

		resizeCanvas();
		window.addEventListener('resize', resizeCanvas);
		setupEventListeners();
		animationFrameId = requestAnimationFrame(draw);

		return () => {
			window.removeEventListener('resize', resizeCanvas);
			cancelAnimationFrame(animationFrameId);
			removeEventListeners();
		};
	});

	function resizeCanvas() {
		width = window.innerWidth;
		height = window.innerHeight;
		canvas.width = width * devicePixelRatio;
		canvas.height = height * devicePixelRatio;
		ctx.scale(devicePixelRatio, devicePixelRatio);
	}

	function setupEventListeners() {
		canvas.addEventListener('mousedown', startDrag);
		canvas.addEventListener('mousemove', drag);
		canvas.addEventListener('mouseup', endDrag);
		canvas.addEventListener('mouseleave', endDrag);
		canvas.addEventListener('wheel', zoom);

		// Touch events for mobile support
		canvas.addEventListener('touchstart', handleTouchStart);
		canvas.addEventListener('touchmove', handleTouchMove);
		canvas.addEventListener('touchend', handleTouchEnd);
	}

	function removeEventListeners() {
		canvas.removeEventListener('mousedown', startDrag);
		canvas.removeEventListener('mousemove', drag);
		canvas.removeEventListener('mouseup', endDrag);
		canvas.removeEventListener('mouseleave', endDrag);
		canvas.removeEventListener('wheel', zoom);
		canvas.removeEventListener('touchstart', handleTouchStart);
		canvas.removeEventListener('touchmove', handleTouchMove);
		canvas.removeEventListener('touchend', handleTouchEnd);
	}

	function startDrag(e: MouseEvent) {
		isDragging = true;
		lastX = e.clientX;
		lastY = e.clientY;
	}

	function drag(e: MouseEvent) {
		const { worldX, worldY } = mouseToWorldCoordinates(e);
		mouseStore.set({ x: worldX, y: worldY });

		if (!isDragging) return;
		const deltaX = e.clientX - lastX;
		const deltaY = e.clientY - lastY;
		pan(deltaX, deltaY);
		lastX = e.clientX;
		lastY = e.clientY;
	}

	function endDrag() {
		isDragging = false;
	}

	function pan(deltaX: number, deltaY: number) {
		viewportStore.update((vp) => ({
			...vp,
			x: vp.x - deltaX / vp.scale,
			y: vp.y - deltaY / vp.scale
		}));
	}

	function mouseToWorldCoordinates(e: MouseEvent) {
		// Calculate mouse position relative to canvas
		const rect = canvas.getBoundingClientRect();
		const mouseX = e.clientX - rect.left;
		const mouseY = e.clientY - rect.top;

		// Calculate the world coordinates of the mouse position
		const worldX = viewport.x + mouseX / viewport.scale;
		const worldY = viewport.y + mouseY / viewport.scale;

		return {
			mouseX,
			mouseY,
			worldX,
			worldY
		};
	}

	function zoom(e: WheelEvent) {
		e.preventDefault();
		const zoomFactor = 1 - e.deltaY * 0.001;
		const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, viewport.scale * zoomFactor));

		const { mouseX, mouseY, worldX, worldY } = mouseToWorldCoordinates(e);

		// Calculate new viewport position
		const newX = worldX - mouseX / newScale;
		const newY = worldY - mouseY / newScale;

		mouseStore.set({ x: worldX, y: worldY });

		viewportStore.set({
			x: newX,
			y: newY,
			scale: newScale
		});
	}

	// Touch event handlers
	let touchStartX: number;
	let touchStartY: number;
	let initialPinchDistance: number | null = null;

	function handleTouchStart(e: TouchEvent) {
		if (e.touches.length === 1) {
			touchStartX = e.touches[0].clientX;
			touchStartY = e.touches[0].clientY;
		} else if (e.touches.length === 2) {
			initialPinchDistance = getPinchDistance(e);
		}
	}

	function handleTouchMove(e: TouchEvent) {
		e.preventDefault();
		if (e.touches.length === 1) {
			const deltaX = e.touches[0].clientX - touchStartX;
			const deltaY = e.touches[0].clientY - touchStartY;
			pan(deltaX, deltaY);
			touchStartX = e.touches[0].clientX;
			touchStartY = e.touches[0].clientY;
		} else if (e.touches.length === 2 && initialPinchDistance !== null) {
			const currentPinchDistance = getPinchDistance(e);
			const zoomFactor = currentPinchDistance / initialPinchDistance;
			const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, viewport.scale * zoomFactor));
			viewportStore.update((vp) => ({ ...vp, scale: newScale }));
			initialPinchDistance = currentPinchDistance;
		}
	}

	function handleTouchEnd() {
		initialPinchDistance = null;
	}

	function getPinchDistance(e: TouchEvent) {
		return Math.hypot(
			e.touches[0].clientX - e.touches[1].clientX,
			e.touches[0].clientY - e.touches[1].clientY
		);
	}

	function draw() {
		ctx.save();
		ctx.clearRect(0, 0, width, height);

		// Apply viewport transformation
		ctx.translate(-viewport.x * viewport.scale, -viewport.y * viewport.scale);
		ctx.scale(viewport.scale, viewport.scale);

		drawGrid();
		drawObjects(); // You'll implement this to draw stickers, messages, etc.

		ctx.restore();
		animationFrameId = requestAnimationFrame(draw);
	}

	function drawGrid() {
		const gridSize = GRID_SIZE;
		const viewportLeft = viewport.x;
		const viewportTop = viewport.y;
		const viewportRight = viewportLeft + width / viewport.scale;
		const viewportBottom = viewportTop + height / viewport.scale;

		const startX = Math.floor(viewportLeft / gridSize) * gridSize;
		const startY = Math.floor(viewportTop / gridSize) * gridSize;
		const endX = Math.ceil(viewportRight / gridSize) * gridSize;
		const endY = Math.ceil(viewportBottom / gridSize) * gridSize;

		ctx.strokeStyle = GRID_COLOR;
		ctx.lineWidth = 1 / viewport.scale;
		ctx.beginPath();

		for (let x = startX; x <= endX; x += gridSize) {
			ctx.moveTo(x, startY);
			ctx.lineTo(x, endY);
		}

		for (let y = startY; y <= endY; y += gridSize) {
			ctx.moveTo(startX, y);
			ctx.lineTo(endX, y);
		}

		ctx.stroke();
	}

	function drawObjects() {
		// Implement drawing of stickers, messages, etc.
		// This function should use the viewport state to determine what objects are visible
		// and draw them accordingly
	}
</script>

<canvas bind:this={canvas}></canvas>

<style>
	canvas {
		width: 100%;
		height: 100%;
		touch-action: none; /* Prevents default touch actions on mobile devices */
	}
</style>
