import { spawn } from 'child_process';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async () => {
    return new Response(
        new ReadableStream({
            start(controller) {
                const process = spawn('docker', ['compose', 'down']);
                let isClosed = false;

                process.stdout.on('data', (data) => {
                    if (!isClosed) {
                        controller.enqueue(data);
                    }
                });

                process.stderr.on('data', (data) => {
                    if (!isClosed) {
                        controller.enqueue(data);
                    }
                });

                process.on('close', (code) => {
                    if (!isClosed) {
                        isClosed = true;
                        controller.close();
                        if (code !== 0) {
                            console.error(`Docker compose down failed with exit code ${code}`);
                        }
                    }
                });

                process.on('error', (error) => {
                    if (!isClosed) {
                        isClosed = true;
                        controller.error(error);
                    }
                });
            }
        }),
        {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8'
            }
        }
    );
};
