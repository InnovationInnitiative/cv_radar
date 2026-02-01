
import React from 'react';

interface VibeGaugeProps {
    score: number;
}

export function VibeGauge({ score }: VibeGaugeProps) {
    // Color logic
    let color = 'text-red-500';
    if (score >= 40) color = 'text-yellow-500';
    if (score >= 70) color = 'text-green-500';

    // SVG calc
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="relative flex flex-col items-center justify-center">
            <svg className="w-24 h-24 transform -rotate-90">
                <circle
                    className="text-gray-200"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="48"
                    cy="48"
                />
                <circle
                    className={`${color} transition-all duration-1000 ease-out`}
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="48"
                    cy="48"
                />
            </svg>
            <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center">
                <span className={`text-2xl font-bold ${color}`}>{score}</span>
                <span className="text-xs text-gray-500">VIBE</span>
            </div>
        </div>
    );
}
