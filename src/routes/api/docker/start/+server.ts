import { spawn } from 'child_process';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async () => {
  let serverStatus = "Initializing"; // Default status
  let logs = "";

  return new Response(
    new ReadableStream({
      start(controller) {
        const process = spawn('docker', ['compose', 'up']);

        process.stdout.on('data', (data) => {
          logs += data.toString();
          controller.enqueue(data);

          // Update server status based on log content
          if (logs.includes("Network easyzomboidserver_default Creating")) {
            serverStatus = "Initializing";
          } else if (logs.includes("Starting server install")) {
            serverStatus = "Updating Game Files";
          } else if (logs.includes("Update complete, launching Steamcmd")) {
            serverStatus = "Zomboid Server Initializing";
          } else if (logs.includes("SERVER STARTED")) {
            serverStatus = "Online";
          } else if (logs.includes("QuitCommand") || logs.includes("projectzomboid exited with code")) {
            serverStatus = "Stopped";
          }

          // Optionally send status updates to client
          // Note: For simplicity, this example sends status as logs
          controller.enqueue(`\nStatus: ${serverStatus}`);
        });

        process.stderr.on('data', (data) => {
          controller.enqueue(data);
        });

        process.on('close', (code) => {
          if (code !== 0) {
            console.error(`Docker compose up failed with exit code ${code}`);
          }
          controller.close();
        });
      },
    }),
    {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    }
  );
};
    