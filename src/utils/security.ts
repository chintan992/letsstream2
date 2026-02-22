import { DevToolsDetector } from 'developer-tools-detector';

/**
 * Security mechanisms to prevent easy access to the developer console.
 */
export const initSecurity = () => {
    // Prevent context menu (right click)
    document.addEventListener("contextmenu", e => e.preventDefault());

    // Prevent common devtools keyboard shortcuts
    document.addEventListener("keydown", e => {
        // F12
        if (e.key === "F12") {
            e.preventDefault();
        }
        // Ctrl+Shift+I / Cmd+Option+I - element inspector
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "I" || e.key === "i")) {
            e.preventDefault();
        }
        // Ctrl+Shift+J / Cmd+Option+J - console
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "J" || e.key === "j")) {
            e.preventDefault();
        }
        // Ctrl+Shift+C / Cmd+Option+C - element selection
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "C" || e.key === "c")) {
            e.preventDefault();
        }
        // Ctrl+U / Cmd+U - view source
        if ((e.ctrlKey || e.metaKey) && (e.key === "U" || e.key === "u")) {
            e.preventDefault();
        }
    });

    // Intercept the fetch call from developer-tools-detector to handle the detection
    // by clearing the console and reloading the page as required by the user.
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
        if (typeof args[0] === 'string' && args[0].includes('/log-devtools-detected')) {
            console.clear();
            window.location.reload();
            return new Response('ok'); // Return fake response to satisfy the fetch
        }
        return originalFetch(...args);
    };

    // Initialize the detector
    const detector = new DevToolsDetector(["/"], {
        consoleLog: true,     // This triggers the fetch call we intercept
        checkDuration: "always",
        blockIfDetected: false // We handle the blocking behavior manually above
    });

    // The package generates an HTML string meant for backend injection like:
    // <script> (function() { ... })() </script>
    // We need to extract the JavaScript and run it.
    const scriptHtml = detector.getDetectionScript();
    const scriptContentMatch = scriptHtml.match(/<script>([\s\S]*?)<\/script>/i);

    if (scriptContentMatch && scriptContentMatch[1]) {
        const script = document.createElement('script');
        script.textContent = scriptContentMatch[1];
        document.head.appendChild(script);
    }
};
