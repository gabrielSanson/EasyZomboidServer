<script>
    import { onMount } from 'svelte';
    // let serverStatus = "Stopped";
    import { serverStatus } from '$lib/stores/serverStore';
    let isLoading = false;
    let textarea;
    let hasNotifiedServerStarted = false; // Flag to track notification
    let logs = ""
    async function fetchServerLogs() {
        try {
            const response = await fetch('/api/docker/start', {
                method: 'POST'
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            function processBuffer() {
                const lines = buffer.split("\n");
                for (const line of lines) {
                    // Log the raw line data for debugging
                    console.log("Log Line:", line);

                    // Update server status based on the log entry
                    if (line.includes("Network easyzomboidserver_default Creating")) {
                        serverStatus = "Initializing";
                    } else if (line.includes("Starting server install")) {
                        serverStatus = "Updating Game Files";
                    } else if (line.includes("Update complete, launching Steamcmd")) {
                        serverStatus = "Zomboid Server Initializing";
                    } else if (line.includes("SERVER STARTED")) {
                        serverStatus = "Online";
                        if (!hasNotifiedServerStarted) {
                            alert("Server has started!");
                            hasNotifiedServerStarted = true;
                        }
                    } else if (line.includes("QuitCommand") || line.includes("projectzomboid exited with code")) {
                        serverStatus = "Stopped";
                    }

                    logs += line + "\n";
                }
                buffer = "";
                scrollToBottom();
            }

            function readStream() {
                reader.read().then(({ done, value }) => {
                    if (done) {
                        return;
                    }
                    buffer += decoder.decode(value, { stream: true });
                    processBuffer();
                    readStream();
                }).catch((error) => {
                    console.error("Error reading stream:", error);
                });
            }

            readStream();
        } catch (error) {
            console.error("Error starting server:", error);
        } finally {
            isLoading = false;
        }
    }

    async function startServer() {
        logs = "";
        isLoading = true;
        await fetchServerLogs();
    }

    async function stopServer() {
        logs = "";
        isLoading = true;
        try {
            let response = await fetch("/api/docker/stop", {
                method: "POST",
            });
            if (response.ok) {
                serverStatus = "Stopped";
                hasNotifiedServerStarted = false; // Reset flag when stopped
            }
        } catch (error) {
            console.error("Error stopping server:", error);
        } finally {
            isLoading = false;
        }
    }

    async function restartServer() {
        await stopServer();
        await startServer();
    }

    function scrollToBottom() {
        if (textarea) {
            textarea.scrollTop = textarea.scrollHeight;
        }
    }

    onMount(() => {
        // Optionally initialize status
    });
</script>


<style>
    textarea {
        width: 100%;
        height: 100%;
        resize: none; /* Prevent resizing */
        overflow-y: auto; /* Ensure scrollbar is available */
    }
</style>

<div class="container">
    <h1>Server Dashboard</h1>
    <div class="controls">
        {#if $serverStatus ==="Stopped" }
            <button on:click={startServer}>Start Server</button>
        {/if}

        {#if $serverStatus !== "Stopped"}
            <button on:click={stopServer}>Stop Server</button>
        {/if}

        <!-- {#if $serverStatus === "Online"}
            <button on:click={restartServer}>Restart Server</button>
        {/if} -->
    </div>
</div>
