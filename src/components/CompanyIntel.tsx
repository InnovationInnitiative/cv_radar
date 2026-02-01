import React, { useEffect, useState } from 'react';
import { fetchJobsForQuery, JobListing } from '../lib/job-service';
import { calculateReputationScore } from '../lib/scoring';
import { Loader2, ExternalLink, ThumbsUp, ThumbsDown, AlertCircle, Info } from 'lucide-react';

const STEPS = [
    { label: 'Scanning employee reviews...', querySuffix: 'employee reviews' },
    { label: 'Analyzing salary data...', querySuffix: 'software engineer salary' },
    { label: 'Checking work culture...', querySuffix: 'work culture reddit' },
    { label: 'Finding interview experiences...', querySuffix: 'interview experience' }
];

export function CompanyIntel({ companyName, jobDescription, onReputationCalculated }: { companyName: string, jobDescription?: string, onReputationCalculated?: (score: number) => void }) {
    const [intel, setIntel] = useState<JobListing[]>([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const [reputation, setReputation] = useState<{ status: string, score: number, signals: string[] } | null>(null);

    // Context Extraction Helper
    const extractContext = (desc: string) => {
        // Look for specific program names often capitalized
        // e.g. "Summer Analyst Program", "Engineering Intern", "Risk Management"
        // Heuristic: Capitalized words followed by "Program" or "Intern" or "Team"
        const programRegex = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Program|Intern|Team|Unit|Division))\b/g;
        const matches = desc.match(programRegex) || [];
        // Return unique, longest first
        return [...new Set(matches)].sort((a, b) => b.length - a.length)[0] || "";
    };

    useEffect(() => {
        if (!companyName) return;

        const runStaggeredSearch = async () => {
            setIntel([]);
            setReputation(null);
            setCurrentStep(0);
            setIsComplete(false);

            let allResults: JobListing[] = [];

            // Extract Context
            const contextKeyword = jobDescription ? extractContext(jobDescription) : "";
            const isContextUseful = contextKeyword.length > 5 && !contextKeyword.includes(companyName); // Avoid redundancy

            // Dynamic Steps
            const DYNAMIC_STEPS = [
                { label: 'Scanning employee reviews...', query: `"${companyName}" employee reviews` },
                {
                    label: isContextUseful ? `Checking "${contextKeyword}" specifics...` : 'Analyzing salary data...',
                    query: isContextUseful ? `"${companyName}" "${contextKeyword}" reviews` : `"${companyName}" software engineer salary`
                },
                { label: 'Checking work culture...', query: `"${companyName}" work culture reddit` },
                { label: 'Finding interview experiences...', query: `"${companyName}" interview experience` }
            ];

            for (let i = 0; i < DYNAMIC_STEPS.length; i++) {
                setCurrentStep(i);

                // 1. Fetch data for this step
                try {
                    const results = await fetchJobsForQuery(DYNAMIC_STEPS[i].query, "");
                    // Accumulate locally first to ensure we catch everything for scoring
                    allResults = [...allResults, ...results];

                    setIntel(prev => {
                        const combined = [...prev, ...results];
                        // Simple dedupe by ID
                        const seen = new Set();
                        return combined.filter(item => {
                            const duplicate = seen.has(item.id);
                            seen.add(item.id);
                            return !duplicate;
                        }).slice(0, 10); // Keep top 10 max
                    });
                } catch (e) {
                    console.warn(`Step ${i} failed`, e);
                }

                // 2. Artificial Delay
                await new Promise(r => setTimeout(r, 1200));
            }

            // Calculate Reputation at the end
            const rep = calculateReputationScore(allResults);
            setReputation(rep);
            if (onReputationCalculated) {
                onReputationCalculated(rep.score);
            }
            setIsComplete(true);
        };

        runStaggeredSearch();
    }, [companyName, jobDescription, onReputationCalculated]);

    if (!companyName) return null;

    return (
        <div className="bg-white rounded-xl shadow-sm p-6 mt-8 border border-blue-100">
            <h3 className="text-lg font-bold text-black mb-4 flex items-center justify-between">
                <span className="flex items-center">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2">DEEP DIVE</span>
                    Intel on {companyName}
                </span>
                {!isComplete && <Loader2 className="animate-spin text-blue-600" size={16} />}

                {/* Transparency Tooltip */}
                <div className="group relative">
                    <Info size={14} className="text-gray-400 cursor-help" />
                    <div className="absolute right-0 top-6 w-64 bg-black text-white text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                        Aggregated from public feeds (Google News, Reddit, Glassdoor) via active auditing proxies.
                    </div>
                </div>
            </h3>

            {/* Progress Log */}
            {!isComplete && (
                <div className="mb-4 bg-gray-50 p-3 rounded-md border border-gray-100">
                    <div className="flex items-center text-sm text-gray-600">
                        <Loader2 className="animate-spin mr-2" size={14} />
                        {STEPS[currentStep]?.label || 'Finalizing...'}
                    </div>
                    <div className="w-full bg-gray-200 h-1 mt-2 rounded-full overflow-hidden">
                        <div
                            className="bg-blue-500 h-full transition-all duration-300"
                            style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Value Judgment / Reputation Card */}
            {isComplete && reputation && reputation.status !== 'Neutral' && (
                <div className={`mb-6 p-4 rounded-lg flex items-start ${reputation.status === 'Positive' ? 'bg-green-50 border border-green-200' :
                    reputation.status === 'Negative' ? 'bg-red-50 border border-red-200' : 'bg-orange-50 border border-orange-200'
                    }`}>
                    <div className={`mr-3 mt-1 ${reputation.status === 'Positive' ? 'text-green-600' :
                        reputation.status === 'Negative' ? 'text-red-600' : 'text-orange-600'
                        }`}>
                        {reputation.status === 'Positive' ? <ThumbsUp size={20} /> :
                            reputation.status === 'Negative' ? <ThumbsDown size={20} /> : <AlertCircle size={20} />}
                    </div>
                    <div>
                        <h4 className={`font-bold text-sm ${reputation.status === 'Positive' ? 'text-green-800' :
                            reputation.status === 'Negative' ? 'text-red-800' : 'text-orange-800'
                            }`}>
                            Verdict: {reputation.status} Signals Detected
                        </h4>
                        <p className="text-xs text-gray-600 mt-1">
                            Our analysis flagged keywords in the public feed affecting the trust score.
                        </p>
                        {reputation.signals.length > 0 && (
                            <ul className="mt-2 space-y-1">
                                {reputation.signals.map((sig, i) => (
                                    <li key={i} className="text-xs font-medium text-gray-700">• {sig}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}

            {isComplete && intel.length === 0 ? (
                <p className="text-gray-500 text-sm">No specific intel found via public feeds.</p>
            ) : (
                <div className="space-y-4">
                    {intel.map(item => (
                        <div key={item.id} className="border-b border-gray-100 last:border-0 pb-3 last:pb-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <a href={item.link} target="_blank" className="font-medium text-gray-800 hover:text-blue-600 block mb-1">
                                {item.title}
                            </a>
                            <div className="flex justify-between items-center text-xs text-gray-500">
                                <span>{item.source}</span>
                                <span>{new Date(item.pubDate).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}

                    {isComplete && (
                        <div className="pt-2">
                            <a href={`https://www.google.com/search?q=${encodeURIComponent(companyName + ' reviews')}`} target="_blank" className="text-xs text-blue-600 font-bold flex items-center hover:underline">
                                View all search results <ExternalLink size={10} className="ml-1" />
                            </a>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
