import { spawn } from 'child_process';
import type { RequestHandler } from '@sveltejs/kit';

let serverStatus = "Stopped"; // Default status
let lastSentStatus = ""; // Track the last sent status
let streamClosed = false; // Track if the stream has been closed

export const POST: RequestHandler = async () => {
  return new Response(
    new ReadableStream({
      start(controller) {
        const process = spawn('docker', ['compose', 'up']);

        process.stdout.on('data', (data) => {
          if (streamClosed) return; // Skip if the stream is closed

          const logs = data.toString();
          console.log("Logs Data:", logs); // Debug log

          // Determine new server status based on log content
          let newStatus = serverStatus;
          if (logs.includes("Network easyzomboidserver_default Creating")) {
            newStatus = "Initializing";
          } else if (logs.includes("Starting server install")) {
            newStatus = "Updating Game Files";
          } else if (logs.includes("Update complete, launching Steamcmd")) {
            newStatus = "Zomboid Server Initializing";
          } else if (logs.includes("SERVER STARTED")) {
            newStatus = "Online";
          } else if (logs.includes("QuitCommand") || logs.includes("projectzomboid exited with code")) {
            newStatus = "Stopped";
          }

          // Update server status only if it has changed
          if (newStatus !== serverStatus) {
            serverStatus = newStatus;
            if (newStatus !== lastSentStatus) {
              controller.enqueue(`\nStatus: ${serverStatus}`);
              lastSentStatus = newStatus;
            }
          }
        });

        process.stderr.on('data', (data) => {
          if (!streamClosed) {
            console.error(data.toString());
          }
        });

        process.on('close', (code) => {
          if (!streamClosed) {
            if (code !== 0) {
              console.error(`Docker compose up failed with exit code ${code}`);
            }
            streamClosed = true;
            controller.close();
          }
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
  