import type { Handle } from '@sveltejs/kit';
import Docker from 'dockerode';

const docker = new Docker();

async function getContainerStatus(containerName: string): Promise<string> {
    try {
        const container = docker.getContainer(containerName);
        const data = await container.inspect();
        return data.State.Running ? 'Running' : 'Stopped';
    } catch (error) {
        // Check if the error indicates that the container does not exist
        if (error.statusCode === 404) {
            return 'Stopped';
        }
        console.error(`Error inspecting container: ${error.message}`);
        return 'Unknown';
    }
}

async function getContainerLogs(containerName: string): Promise<string> {
    try {
        const container = docker.getContainer(containerName);
        const logs = await container.logs({ stdout: true, stderr: true });
        return logs.toString();
    } catch (error) {
        // Handle specific errors for fetching logs
        if (error.statusCode === 404) {
            return 'No logs available';
        }
        console.error(`Error fetching container logs: ${error.message}`);
        return '';
    }
}

function extractLatestStatus(logs: string): string {
    const lines = logs.trim().split('\n');
    let latestStatus = "Unknown"; // Default status

    for (const line of lines) {
        if (line.includes("Network easyzomboidserver_default Creating")) {
            latestStatus = "Initializing";
        } else if (line.includes("Starting server install")) {
            latestStatus = "Updating Game Files";
        } else if (line.includes("Update complete, launching Steamcmd")) {
            latestStatus = "Zomboid Server Initializing";
        } else if (line.includes("SERVER STARTED")) {
            latestStatus = "Online";
        } else if (line.includes("QuitCommand") || line.includes("projectzomboid exited with code")) {
            latestStatus = "Stopped";
        }
    }

    return latestStatus;
}

const handle: Handle = async ({ event, resolve }) => {
    if (event.url.pathname === '/api/docker/status') {
        const containerName = 'projectzomboid';
        const status = await getContainerStatus(containerName);

        if (status === 'Running') {
            const logs = await getContainerLogs(containerName);
            const serverStatus = extractLatestStatus(logs);

            return new Response(serverStatus, {
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                },
            });
        } else {
            return new Response(status, {
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                },
            });
        }
    }

    const response = await resolve(event);

    response.headers.set('Access-Control-Allow-Origin', 'http://localhost:5173');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

    return response;
};

export { handle };
