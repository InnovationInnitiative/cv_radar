'use client';
import { useEffect, useRef } from 'react';

/**
 * Adsterra Sidebar "Skyscraper" Ads
 * Two vertical banners placed on the empty sides of the desktop view.
 * Hidden on mobile.
 */
export function AdSidebar() {
    return (
        <>
            {/* Left Sidebar */}
            <div className="hidden xl:flex fixed left-4 top-24 bottom-0 w-[160px] flex-col items-center z-0 pointer-events-none">
                <div className="pointer-events-auto mt-4">
                    <SafeAdsterraSidebar />
                </div>
            </div>

            {/* Right Sidebar */}
            <div className="hidden xl:flex fixed right-4 top-24 bottom-0 w-[160px] flex-col items-center z-0 pointer-events-none">
                <div className="pointer-events-auto mt-4">
                    <SafeAdsterraSidebar />
                </div>
            </div>
        </>
    );
}

function SafeAdsterraSidebar() {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;

        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) return;

        // Clear content
        doc.open();
        doc.write(`
            <!DOCTYPE html>
            <html>
            <head><style>body{margin:0;padding:0;overflow:hidden;background:transparent;}</style></head>
            <body>
                <script type="text/javascript">
                    atOptions = {
                        'key' : '7c273d007f605e92443588db0d37d081',
                        'format' : 'iframe',
                        'height' : 600,
                        'width' : 160,
                        'params' : {}
                    };
                </script>
                <script type="text/javascript" src="https://www.highperformanceformat.com/7c273d007f605e92443588db0d37d081/invoke.js"></script>
            </body>
            </html>
        `);
        doc.close();
    }, []);

    return (
        <iframe
            ref={iframeRef}
            width={160}
            height={600}
            scrolling="no"
            frameBorder="0"
            className="border border-dashed border-gray-300 rounded bg-gray-50"
        />
    );
}
