
import React from 'react';

interface MatchMeterProps {
    percentage: number;
}

export function MatchMeter({ percentage }: MatchMeterProps) {
    let color = 'bg-red-500';
    if (percentage >= 50) color = 'bg-yellow-500';
    if (percentage >= 80) color = 'bg-green-500';

    return (
        <div className="w-full">
            <div className="flex justify-between mb-1">
                <span className="text-xs font-medium text-gray-700">Match Potential</span>
                <span className="text-xs font-medium text-gray-700">{percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                    className={`${color} h-2.5 rounded-full transition-all duration-1000`}
                    style={{ width: `${Math.min(100, Math.max(0, percentage || 0))}%` }}
                ></div>
            </div>
        </div>
    );
}
