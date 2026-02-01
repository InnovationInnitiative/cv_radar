'use client';
import { useEffect, useState } from 'react';

/**
 * Adsterra Popunder with Click Frequency Control
 * Triggers only after 5-6 clicks as requested.
 */
export function AdPopunder() {
    const [clickCount, setClickCount] = useState(0);
    const [triggered, setTriggered] = useState(false);

    useEffect(() => {
        const handleClick = () => {
            // Increment click count
            setClickCount(prev => {
                const newCount = prev + 1;

                // Trigger logic: Between 5 and 6 clicks
                if (newCount >= 5 && !triggered) {
                    triggerPopunder();
                    return newCount;
                }
                return newCount;
            });
        };

        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, [triggered]);

    const triggerPopunder = () => {
        if (triggered) return;
        setTriggered(true);
        console.log("Creating Popunder Ad...");

        // --- PASTE YOUR ADSTERRA POPUNDER SCRIPT HERE ---
        // Usually it's just a script tag.
        /*
        const script = document.createElement('script');
        script.src = '//pl12345678.example.com/xxxxx/invoke.js';
        document.body.appendChild(script);
        */
        // ------------------------------------------------
    };

    return null; // Invisible component
}
