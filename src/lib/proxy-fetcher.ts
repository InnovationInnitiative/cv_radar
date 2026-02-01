
/**
 * InsightCareers Proxy Cascade
 * Implements the "Zero-API" discovery engine logic.
 */

export async function fetchWithProxy(targetUrl: string): Promise<string | null> {
    const proxies = [
        { name: 'AllOrigins', url: `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}` },
        { name: 'ThingProxy', url: `https://thingproxy.freeboard.io/fetch/${targetUrl}` },
        { name: 'CorsProxy', url: `https://corsproxy.io/?${encodeURIComponent(targetUrl)}` },
        { name: 'CodeTabs', url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}` }
    ];

    // Shuffle proxies to distribute load (Simple Fisher-Yates)
    for (let i = proxies.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [proxies[i], proxies[j]] = [proxies[j], proxies[i]];
    }

    for (const proxy of proxies) {
        try {
            console.log(`Attempting fetch via ${proxy.name}: ${proxy.url}`);
            const response = await fetch(proxy.url, {
                signal: AbortSignal.timeout(8000) // 8s timeout
            });

            if (!response.ok) throw new Error(`Status ${response.status}`);

            // AllOrigins returns JSON logic
            if (proxy.name === 'AllOrigins') {
                const data = await response.json();
                return data.contents;
            }

            return await response.text();
        } catch (error) {
            console.warn(`Failed via ${proxy.name}`, error);
            continue; // Try next proxy
        }
    }

    throw new Error(`All proxies failed for ${targetUrl}`);
}
