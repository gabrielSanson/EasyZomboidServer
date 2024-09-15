<script>
    import { onMount, afterUpdate } from "svelte";
    let serverStatus = "Stopped";
    let logs = "";
    let isLoading = false;
    let textarea;

    async function startServer() {
        logs = "";
        isLoading = true;

        try {
            const response = await fetch("/api/docker/start", {
                method: "POST",
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

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

            function processBuffer() {
                const lines = buffer.split("\n");
                for (const line of lines) {
                    logs += line + "\n";

                    // Update serverStatus based on the most recent relevant log entry
                    if (line.includes("Network easyzomboidserver_default Creating")) {
                        serverStatus = "Initializing";
                    } else if (line.includes("Starting server install")) {
                        serverStatus = "Updating Game Files";
                    } else if (line.includes("Update complete, launching Steamcmd")) {
                        serverStatus = "Zomboid Server Initializing";
                    } else if (line.includes("SERVER STARTED")) {
                        serverStatus = "Online";
                    } else if (line.includes("QuitCommand") || line.includes("projectzomboid exited with code")) {
                        serverStatus = "Stopped";
                    }
                }
                buffer = "";
                scrollToBottom();
            }

            readStream();
        } catch (error) {
            console.error("Error starting server:", error);
        } finally {
            isLoading = false;
        }
    }

    async function stopServer() {
        logs = "";
        isLoading = true;
        try {
            const response = await fetch("/api/docker/stop", {
                method: "POST",
            });
            if (!response.ok) {
                throw new Error("Failed to stop server");
            }
            serverStatus = "Stopped";
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
        // Optionally fetch initial status
    });

    afterUpdate(() => {
        scrollToBottom();
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
    <p>Status: {serverStatus}</p>

    {#if isLoading}
        <p>Loading...</p>
    {/if}

    <textarea 
        rows="32" 
        bind:this={textarea} 
        contenteditable="false" 
        bind:textContent={logs}
    ></textarea>

    <div class="controls">
        {#if serverStatus === "Stopped"}
            <button on:click={startServer}>Start Server</button>
        {/if}

        {#if serverStatus !== "Stopped"}
            <button on:click={stopServer}>Stop Server</button>
        {/if}

        {#if serverStatus === "Online"}
            <button on:click={restartServer}>Restart Server</button>
        {/if}
    </div>
</div>
