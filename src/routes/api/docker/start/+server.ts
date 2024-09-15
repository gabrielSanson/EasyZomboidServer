// src/routes/api/docker/start/+server.ts
import { spawn } from 'child_process';
import type { RequestHandler } from '@sveltejs/kit';
import { hasNotificationBeenSent, setNotificationSent } from '$lib/utils/notificationManager';

let serverStatus = "Stopped"; // Default status

export const POST: RequestHandler = async () => {
  return new Response(
    new ReadableStream({
      start(controller) {
        const process = spawn('docker', ['compose', 'up']);

        process.stdout.on('data', (data) => {
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
            // Notify clients about the server start
            if (!hasNotificationBeenSent()) {
                // Here you can integrate with a notification service or set a flag
                console.log("Server started, notifying clients...");
                setNotificationSent(true); // Update flag to prevent duplicate notifications
            }
          } else if (logs.includes("QuitCommand") || logs.includes("projectzomboid exited with code")) {
            newStatus = "Stopped";
            setNotificationSent(false); // Reset notification flag on stop
          }

          // Update server status only if it has changed
          if (newStatus !== serverStatus) {
            serverStatus = newStatus;
            controller.enqueue(`\nStatus: ${serverStatus}`);
          }
        });

        process.stderr.on('data', (data) => {
          console.error(data.toString());
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

export const GET: RequestHandler = async () => {
  return new Response(serverStatus, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
