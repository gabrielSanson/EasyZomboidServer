// src/routes/api/docker/logs/+server.ts
import { exec } from 'child_process';
import { Readable } from 'stream';

export const GET = async () => {
    const stream = new Readable({
        read() { /* No-op */ }
    });

    function processLogData(logLine: string) {
        if (logLine.includes("Network easyzomboidserver_default Creating")) {
            stream.push(`event: statusUpdate\n`);
            stream.push(`data: ${JSON.stringify({ status: 'Initializing' })}\n\n`);
        } else if (logLine.includes("Starting server install")) {
            stream.push(`event: statusUpdate\n`);
            stream.push(`data: ${JSON.stringify({ status: 'Updating Game Files' })}\n\n`);
        } else if (logLine.includes("SERVER STARTED")) {
            stream.push(`event: serverOnline\n`);
            stream.push(`data: "The server is now online!"\n\n`);
        } else if (logLine.includes("QuitCommand") || logLine.includes("projectzomboid exited with code")) {
            stream.push(`event: statusUpdate\n`);
            stream.push(`data: ${JSON.stringify({ status: 'Stopped' })}\n\n`);
        }
    }

    const command = 'docker logs -f projectzomboid'; // Adjust to your container name
    const dockerProcess = exec(command);

    dockerProcess.stdout.on('data', (data) => {
        const logLines = data.toString().split('\n');
        logLines.forEach(processLogData);
    });

    dockerProcess.stderr.on('data', (data) => {
        console.error(`stderr: ${data.toString()}`);
    });

    dockerProcess.on('exit', (code) => {
        stream.push(`event: serverStopped\n`);
        stream.push(`data: "Server stopped with code ${code}"\n\n`);
        stream.push(null);
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        }
    });
};
