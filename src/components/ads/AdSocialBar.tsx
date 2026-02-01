'use client';
import { useEffect, useRef } from 'react';

/**
 * Adsterra Social Bar Component
 * This is the highest performing ad unit. 
 * PASTE YOUR SOCIAL BAR SCRIPT INSIDE THE useEffect.
 */
export function AdSocialBar() {
    const loaded = useRef(false);

    useEffect(() => {
        if (loaded.current) return;
        loaded.current = true;

        // --- PASTE YOUR ADSTERRA SOCIAL BAR SCRIPT HERE ---
        // Example:
        // const script = document.createElement('script');
        // script.src = '//pl12345678.example.com/ab/cd/ef/script.js';
        // script.type = 'text/javascript';
        // document.body.appendChild(script);
        // --------------------------------------------------

    }, []);

    return null; // Social bars render themselves outside the DOM flow
}
