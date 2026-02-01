'use client';
import { useEffect, useRef } from 'react';

/**
 * Standard Adsterra Banner (300x250 or 728x90)
 * flexible container that adapts to the slot size.
 * PASTE YOUR SCRIPT HERE.
 */
export function AdBanner({ size = "auto" }: { size?: "auto" | "rect" | "leaderboard" }) {
    const bannerRef = useRef<HTMLDivElement>(null);
    const loaded = useRef(false);

    useEffect(() => {
        if (bannerRef.current && !loaded.current) {
            loaded.current = true;
            // --- PASTE YOUR ADSTERRA SCRIPT HERE ---
            // Example:
            /*
             const conf = document.createElement('script');
             conf.src = '//...';
             bannerRef.current.appendChild(conf);
            */
            // ---------------------------------------
        }
    }, []);

    return (
        <div className={`my-6 mx-auto bg-gray-50 border border-dashed border-gray-300 rounded flex items-center justify-center p-2
            ${size === 'rect' ? 'w-[300px] h-[250px]' : ''}
            ${size === 'leaderboard' ? 'w-[728px] h-[90px]' : ''}
            ${size === 'auto' ? 'w-full min-h-[100px]' : ''}
        `}>
            <div ref={bannerRef} className="text-center">
                <span className="text-xs text-gray-400 block mb-1">ADVERTISEMENT</span>
                <span className="text-gray-300 text-xs">[Paste Script Here]</span>
            </div>
        </div>
    );
}
