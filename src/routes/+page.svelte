<script>
    import { onMount } from 'svelte';
    import toast, { Toaster } from 'svelte-french-toast';
    import ServerDashboard from "../lib/components/ServerDashboard.svelte";

    let serverStatus = "Stopped";
    let hasNotifiedServerStarted = false;

    async function fetchServerStatus() {
        try {
            const response = await fetch('/api/docker/start');
            if (response.ok) {
                const status = await response.text();
                serverStatus = status;

                if (serverStatus === "Online" && !hasNotifiedServerStarted) {
                    toast.success("The server is now online!");
                    hasNotifiedServerStarted = true;
                }
            }
        } catch (error) {
            console.error("Error fetching server status:", error);
        }
    }

    function startPolling() {
        setInterval(fetchServerStatus, 5000); // Poll every 5 seconds
    }

    onMount(() => {
        startPolling();
    });
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>
<ServerDashboard></ServerDashboard>

<Toaster />
