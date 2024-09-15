import { writable } from 'svelte/store';

// Create a writable store for server status
export const serverStatus = writable<string>("Stopped");
