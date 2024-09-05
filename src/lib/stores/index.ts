import { writable } from 'svelte/store';

interface ViewportState {
	x: number;
	y: number;
	scale: number;
}

export const viewportStore = writable<ViewportState>({
	x: 0,
	y: 0,
	scale: 1
});

interface MouseState {
	x: number;
	y: number;
}

export const mouseStore = writable<MouseState>({
	x: 0,
	y: 0
});
