'use client';
import { useEffect, useRef } from 'react';

/**
 * Standard Adsterra Banner (300x250 or 728x90)
 * flexible container that adapts to the slot size.
 * PASTE YOUR SCRIPT HERE.
 */
export function AdBanner({ size = "auto" }: { size?: "auto" | "rect" | "leaderboard" }) {
    // Only render the Safe Banner for rectangular slots or auto slots
    // Leaderboards are not configured yet with this specific code
    return (
        <div className={`my-6 mx-auto bg-gray-50 border border-dashed border-gray-300 rounded flex items-center justify-center p-2
            ${size === 'rect' ? 'w-[300px] h-[250px]' : ''}
            ${size === 'leaderboard' ? 'w-[728px] h-[90px]' : ''}
            ${size === 'auto' ? 'w-full min-h-[100px]' : ''}
        `}>
            <SafeAdsterraBanner />
        </div>
    );
}

function SafeAdsterraBanner() {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;

        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) return;

        doc.open();
        doc.write(`
            <!DOCTYPE html>
            <html>
            <head><style>body{margin:0;padding:0;overflow:hidden;background:transparent;}</style></head>
            <body>
                <script type="text/javascript">
                    atOptions = {
                        'key' : '37f0944f1a5b6d77dfd0c523972d9b94',
                        'format' : 'iframe',
                        'height' : 250,
                        'width' : 300,
                        'params' : {}
                    };
                </script>
                <script type="text/javascript" src="https://www.highperformanceformat.com/37f0944f1a5b6d77dfd0c523972d9b94/invoke.js"></script>
            </body>
            </html>
        `);
        doc.close();
    }, []);

    return (
        <iframe
            ref={iframeRef}
            width={300}
            height={250}
            scrolling="no"
            frameBorder="0"
            style={{ width: '300px', height: '250px' }}
        />
    );
}
