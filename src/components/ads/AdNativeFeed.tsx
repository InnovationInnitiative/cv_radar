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

            const script = document.createElement('script');
            script.async = true;
            script.dataset.cfasync = "false";
            script.src = "https://pl28623982.effectivegatecpm.com/ef2db968c608b3cbc01db06c8fe5d696/invoke.js";

            if (bannerRef.current) {
                bannerRef.current.appendChild(script);
            }
        }
    }, []);

    return (
        <div className="my-8 mx-auto w-full max-w-4xl p-4 bg-gray-50 border border-dashed border-gray-300 rounded-xl flex items-center justify-center min-h-[100px]">
            <div ref={bannerRef} className="text-center w-full">
                <p className="text-xs text-gray-400 mb-2 font-mono">SPONSORED OPPORTUNITY</p>
                {/* Specific Adsterra Container */}
                <div id="container-ef2db968c608b3cbc01db06c8fe5d696"></div>
            </div>
        </div>
    );
}
