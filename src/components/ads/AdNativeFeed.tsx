'use client';
import { useEffect, useRef } from 'react';

/**
 * Adsterra Native Banner (In-Feed)
 * Designed to be placed inside the feed.
 * PASTE YOUR 728x90 or NATIVE BANNER SCRIPT HERE.
 */
export function AdNativeFeed() {
    const bannerRef = useRef<HTMLDivElement>(null);
    const loaded = useRef(false);

    useEffect(() => {
        if (bannerRef.current && !loaded.current) {
            loaded.current = true;

            // --- PASTE YOUR ADSTERRA BANNER SCRIPT HERE ---
            // Note: If the script uses document.write(), it won't work in React efficiently.
            // Ideally, use the "Async" code from Adsterra that creates an iframe or div.

            // Example for simple iframe/script injection:
            /*
            const conf = document.createElement('script');
            conf.type = 'text/javascript';
            conf.src = '//www.highperformanceformat.com/watchnew?key=...';
            bannerRef.current.appendChild(conf);
            */
            // ----------------------------------------------
        }
    }, []);

    return (
        <div className="my-8 mx-auto w-full max-w-4xl p-4 bg-gray-50 border border-dashed border-gray-300 rounded-xl flex items-center justify-center min-h-[100px]">
            <div ref={bannerRef} id="adsterra-native-container" className="text-center">
                <p className="text-xs text-gray-400 mb-2 font-mono">SPONSORED OPPORTUNITY</p>
                {/* Script will inject here */}
                <div className="text-gray-300 text-sm">[Adsterra Native Banner Placeholder]</div>
            </div>
        </div>
    );
}
