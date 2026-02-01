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
                    <div className="w-[160px] h-[600px] bg-gray-50 border border-dashed border-gray-300 rounded flex items-center justify-center text-center p-2">
                        <span className="text-xs text-gray-400">
                            [Paste 160x600 <br /> Script Here]
                        </span>
                    </div>
                </div>
            </div>

            {/* Right Sidebar */}
            <div className="hidden xl:flex fixed right-4 top-24 bottom-0 w-[160px] flex-col items-center z-0 pointer-events-none">
                <div className="pointer-events-auto mt-4">
                    <div className="w-[160px] h-[600px] bg-gray-50 border border-dashed border-gray-300 rounded flex items-center justify-center text-center p-2">
                        <span className="text-xs text-gray-400">
                            [Paste 160x600 <br /> Script Here]
                        </span>
                    </div>
                </div>
            </div>
        </>
    );
}
