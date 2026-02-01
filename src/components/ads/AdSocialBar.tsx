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

        const script = document.createElement('script');
        script.src = "https://pl28623972.effectivegatecpm.com/a1/d2/70/a1d270f80e7415678f49140edc0d145d.js";
        script.async = true;
        document.body.appendChild(script);

    }, []);

    return null; // Social bars render themselves outside the DOM flow
}
