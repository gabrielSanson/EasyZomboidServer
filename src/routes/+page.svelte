<script>
    import { onMount } from 'svelte';
    import toast, { Toaster } from 'svelte-french-toast';
    import ServerDashboard from "../lib/components/ServerDashboard.svelte";
    import { serverStatus } from '../lib/stores/serverStore'; // Import the store

    let hasNotifiedServerStarted = false;

    async function fetchServerStatus() {
        try {
            const response = await fetch('/api/docker/status');
            if (response.ok) {
                const status = await response.text();
                
                // Update the store with the new server status
                serverStatus.set(status);

                // Show notification only when the server status changes to "Online"
                if (status === "Online" && !hasNotifiedServerStarted) {
                    toast.success("The server is now online!");
                    hasNotifiedServerStarted = true;
                } else if (status === "Zomboid Server Initializing") {
                    // Optionally handle other intermediate statuses if needed
                    // toast.success("The server is initializing...");
                }
            }
        } catch (error) {
            console.error("Error fetching server status:", error);
        }
    }

    function startPolling() {
        // Poll every 5 seconds
        setInterval(fetchServerStatus, 1000);
    }

    onMount(() => {
        fetchServerStatus(); // Fetch status once on mount
        startPolling();
    });
</script>

<h1>{$serverStatus}</h1>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>
<ServerDashboard></ServerDashboard>

<Toaster />
