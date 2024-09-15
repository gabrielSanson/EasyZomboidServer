import type { Handle } from '@sveltejs/kit';

const handle: Handle = async ({ event, resolve }) => {
  const response = await resolve(event);

  response.headers.set('Access-Control-Allow-Origin', 'http://localhost:5173');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

  return response;
};

export { handle };
