
'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { fetchWithProxy } from '../../../lib/proxy-fetcher';
import { calculateVibeScore, calculateMatchScore } from '../../../lib/scoring';
import { useUser } from '../../../context/UserContext';
import { VibeGauge } from '../../../components/VibeGauge';
import { MatchMeter } from '../../../components/MatchMeter';
import { Readability } from '@mozilla/readability';
import DOMPurify from 'dompurify';
import { ArrowLeft, AlertTriangle, CheckCircle, ShieldAlert, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { CompanyIntel } from '../../../components/CompanyIntel';
import { RelatedJobs } from '../../../components/RelatedJobs';
import { AdBanner } from '../../../components/ads/AdBanner';

import { Suspense } from 'react';

function JobAuditContent() {
    const searchParams = useSearchParams();
    const url = searchParams.get('url');
    const title = searchParams.get('title');
    const source = searchParams.get('source');
    const date = searchParams.get('date');
    const explicitCompany = searchParams.get('company');

    const snippet = searchParams.get('snippet') || '';

    const { profile } = useUser();
    const [loading, setLoading] = useState(true);
    const [auditResult, setAuditResult] = useState<any>(null);
    const [content, setContent] = useState('');
    const [isPartial, setIsPartial] = useState(false);

    // New: Intel Reputation Integration
    const [intelScore, setIntelScore] = useState(0);

    // Determine effective company name (Prefer explicit > extracted)
    const companyName = explicitCompany || extractCompanyName(title || '', source || '');

    useEffect(() => {
        if (!url) return;

        const runAudit = async () => {
            try {
                setLoading(true);
                // Reset Intel Score on new audit
                setIntelScore(0);

                const html = await fetchWithProxy(url);

                if (html) {
                    // Full Audit
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const reader = new Readability(doc);
                    const article = reader.parse();

                    const cleanContent = article?.textContent || '';
                    const cleanHtml = DOMPurify.sanitize(article?.content || '');

                    // WAF/Anti-Bot Detection checks
                    const weakContent = cleanContent.length < 100;
                    const errorPhrases = [
                        "Access Denied",
                        "You don't have permission",
                        "Reference #",
                        "Incapsula",
                        "Cloudflare",
                        "Security Check",
                        "errors.edgesuite.net"
                    ];
                    const isBlocked = errorPhrases.some(p => cleanContent.includes(p));

                    if (weakContent || isBlocked) {
                        throw new Error("Content looks like a block page or is empty");
                    }

                    setContent(cleanHtml || snippet); // Fallback to snippet if extraction fails
                    analyze(cleanContent || snippet, false);
                } else {
                    throw new Error("Proxy failed");
                }
            } catch (err) {
                console.warn("Full audit failed, falling back to snippet", err);
                // Partial Audit (Snippet Only)
                setContent(DOMPurify.sanitize(snippet));
                analyze(snippet, true);
            } finally {
                setLoading(false);
            }
        };

        const analyze = (text: string, partial: boolean) => {
            setIsPartial(partial);
            const vibe = calculateVibeScore(text);
            const extractedLocation = extractLocation(text);
            const extractedStream = extractStream(text);

            const match = profile ? calculateMatchScore(profile, {
                description: text,
                location: extractedLocation,
                qualifications: extractedStream
            }) : null;
            setAuditResult({ vibe, match });
        };

        runAudit();
    }, [url, profile, snippet]);

    // Callback when Deep Dive Intel finishes
    const handleReputationUpdate = (score: number) => {
        setIntelScore(score);
    };

    if (!url) return <div>Invalid URL</div>;

    // Computed Total Score (Capped at 100)
    const safeScore = (num: number) => isNaN(num) ? 0 : num;

    let adjustedVibe = 0;

    if (auditResult) {
        // Base Calculation
        adjustedVibe = safeScore(auditResult.vibe.score) + safeScore(intelScore);

        // Relevance Boost (from Resume Match)
        if (auditResult.match) {
            if (auditResult.match.matchPercentage >= 75) {
                adjustedVibe += 15; // High relevance boost
            } else if (auditResult.match.matchPercentage < 30) {
                adjustedVibe -= 10; // Irrelevant penalty
            }
        }
    }

    const finalVibeScore = auditResult ? Math.min(100, Math.max(0, adjustedVibe)) : 0;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-5xl mx-auto px-4 py-8">
                <Link href="/" className="inline-flex items-center text-gray-600 hover:text-black mb-6">
                    <ArrowLeft size={20} className="mr-2" /> Back to Search
                </Link>

                {loading ? (
                    <div className="bg-white rounded-xl shadow-sm p-12 text-center animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                        <p className="mt-6 text-gray-500">Auditing job via Proxy Cascade...</p>
                    </div>
                ) : auditResult ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Partial Audit Warning */}
                        {isPartial && (
                            <div className="lg:col-span-3 bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-xl flex items-center">
                                <ShieldAlert size={20} className="mr-2" />
                                <span className="text-sm">
                                    <strong>Limited Access:</strong> The target site blocked our deep-scan proxies.
                                    Showing an analysis based on the available snippet. <a href={url} target="_blank" className="underline font-bold ml-1">View Full Job</a>
                                </span>
                            </div>
                        )}
                        {/* Left: Audit Report */}
                        <div className="lg:col-span-1 space-y-6">

                            {/* Authenticity Badge */}
                            <div className="bg-white rounded-xl shadow-sm p-6 border-t-4 border-black">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">Vibe Audit</h3>
                                <VibeGauge score={finalVibeScore} />

                                <div className="mt-6 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-green-600 font-medium">Positive Signals</span>
                                        <span>{auditResult.vibe.details.positive}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-red-600 font-medium">Red Flags</span>
                                        <span>{auditResult.vibe.details.negative}</span>
                                    </div>
                                    {intelScore !== 0 && (
                                        <div className="flex justify-between text-sm pt-2 border-t border-gray-100 mt-2">
                                            <span className={intelScore > 0 ? "text-blue-600 font-bold" : "text-orange-600 font-bold"}>
                                                Intel Impact
                                            </span>
                                            <span className="font-bold">{intelScore > 0 ? `+${intelScore}` : intelScore}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Match Score */}
                            {auditResult.match && (
                                <div className="bg-white rounded-xl shadow-sm p-6">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">Profile Match</h3>
                                    <MatchMeter percentage={auditResult.match.matchPercentage} />

                                    {auditResult.match.flags.length > 0 ? (
                                        <ul className="mt-4 space-y-2">
                                            {auditResult.match.flags.map((flag: string, i: number) => (
                                                <li key={i} className="flex items-start text-xs text-red-600">
                                                    <AlertTriangle size={12} className="mr-1 mt-0.5 flex-shrink-0" />
                                                    {flag}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="mt-4 flex items-center text-sm text-green-600">
                                            <CheckCircle size={16} className="mr-2" />
                                            Good fit based on extract!
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Generated Audit Report */}
                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">Generated Audit Report</h3>
                                <div className="prose prose-sm text-gray-600 space-y-2">
                                    <p>
                                        <div className="flex items-center gap-2 mb-3">
                                            <strong>Status:</strong>
                                            {(() => {
                                                try {
                                                    const deadline = extractDeadline(content);
                                                    const status = getApplicationStatus(deadline);

                                                    // User Requested "Secondary/Not Available" style for unknown
                                                    if (status === 'UNKNOWN') {
                                                        return (
                                                            <span className="px-2 py-1 rounded text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-500 border border-gray-200">
                                                                ⚪ Date Not Found
                                                            </span>
                                                        );
                                                    }

                                                    return (
                                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                            }`}>
                                                            {status === 'OPEN' ? `🟢 Open (Apply by ${deadline?.toLocaleDateString()})` :
                                                                `🔴 Closed (Ended ${deadline?.toLocaleDateString()})`}
                                                        </span>
                                                    );
                                                } catch (e) {
                                                    return <span className="text-xs text-gray-400">Status unavailable</span>;
                                                }
                                            })()}
                                        </div>

                                        <strong>Executive Summary:</strong> The <strong>{extractJobRole(title || '')}</strong> position at <strong>{companyName}</strong>
                                        {extractLocation(content) !== 'Unknown Location' && ` in ${extractLocation(content)}`}
                                        {extractStream(content) !== 'Any Stream' && ` targeting ${extractStream(content)} graduates`}
                                        {date && ` (Posted: ${new Date(date).toLocaleDateString()})`}
                                        has received a Vibe Score of <span className={`font-bold ${finalVibeScore > 60 ? 'text-green-600' : finalVibeScore < 40 ? 'text-red-600' : 'text-orange-600'}`}>{finalVibeScore}/100</span>.

                                        <br /><br />
                                        <strong>Verdict:</strong> {finalVibeScore > 75 ? "Excellent Opportunity. Highly recommended due to positive company reputation and clear role definition." :
                                            finalVibeScore > 40 ? "Proceed with Caution. Check for specific red flags in the audit below." :
                                                "High Risk. Significant negative signals detected regarding work culture or compensation."}
                                    </p>
                                    <p>
                                        <strong>Key Signals:</strong> Our analysis detected {auditResult.vibe.details.positive} positive indicators.
                                        {auditResult.vibe.details.tokens.length > 0 && ` (Signals: ${auditResult.vibe.details.tokens.join(', ')})`}
                                    </p>
                                    <p>
                                        <strong>Candidate Fit:</strong> {profile && auditResult.match ? `Based on your profile, we calculated a ${auditResult.match.matchPercentage}% match.` : "Profile not set or match pending."}
                                        {profile && auditResult.match && auditResult.match.flags.length > 0 && ` Attention is needed regarding: ${auditResult.match.flags.join(', ')}.`}
                                    </p>
                                </div>
                            </div>

                            {/* Ad Placeholder */}
                            <AdBanner size="rect" />
                        </div>



                        {/* Right: Content */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-white rounded-xl shadow-sm p-8">
                                <h1 className="text-2xl font-bold mb-2 text-black">{title}</h1>
                                <div className="flex items-center justify-between mb-6">
                                    <div className="text-sm text-gray-500">{source}</div>
                                    <a
                                        href={url}
                                        target="_blank"
                                        className="inline-flex items-center px-6 py-2.5 bg-black text-white font-bold rounded-full hover:bg-gray-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                    >
                                        Apply Now
                                        <ExternalLink size={16} className="ml-2" />
                                    </a>
                                </div>

                                <div className="prose prose-sm max-w-none text-gray-800" dangerouslySetInnerHTML={{ __html: content }} />
                            </div>

                            <CompanyIntel
                                companyName={companyName}
                                jobDescription={content} // Pass full content for improved context extraction
                                onReputationCalculated={handleReputationUpdate}
                            />

                            {/* Related Opportunities (New) */}
                            <RelatedJobs companyName={companyName} />
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

export default function JobAuditPage() {
    return (
        <Suspense fallback={<div className="p-12 text-center text-gray-500">Loading Job Audit...</div>}>
            <JobAuditContent />
        </Suspense>
    );
}

// Helper to extract known Indian cities for better mismatch flags
function extractLocation(text: string): string {
    const CITIES = ['Bangalore', 'Bengaluru', 'Pune', 'Hyderabad', 'Mumbai', 'Chennai', 'Delhi', 'Noida', 'Gurgaon', 'Gurugram', 'Kolkata', 'Ahmedabad', 'Remote', 'Work from Home'];
    const found = CITIES.find(city => text.toLowerCase().includes(city.toLowerCase()));

    // Normalize names
    if (found?.toLowerCase() === 'bengaluru') return 'Bangalore';
    if (found?.toLowerCase() === 'gurugram') return 'Gurgaon';
    if (found?.toLowerCase() === 'work from home') return 'Remote';

    return found || 'Unknown Location';
}

// Helper to extract Stream/Major requirements
function extractStream(text: string): string {
    const STREAMS = [
        'Computer Science', 'CSE', 'Information Technology', 'IT',
        'Electronics', 'ECE', 'EEE', 'Mechanical', 'Civil',
        'MBA', 'BBA', 'B.Com', 'M.Tech', 'B.Tech', 'Biotech'
    ];
    const found = STREAMS.find(s => text.toLowerCase().includes(s.toLowerCase()));

    // Normalization
    if (found?.toUpperCase() === 'CSE') return 'Computer Science';
    if (found?.toUpperCase() === 'IT') return 'Information Technology';
    if (found?.toUpperCase() === 'ECE') return 'Electronics';

    return found || 'Any Stream';
}

// Helper to extract real company name from news titles
function extractCompanyName(title: string, source: string): string {
    const NEWS_SOURCES = [
        'Mint', 'TechCrunch', 'Reuters', 'Bloomberg', 'NDTV', 'Times of India', 'Economic Times',
        'Moneycontrol', 'Business Standard', 'Financial Express', 'Hindustan Times', 'News18',
        'India Today', 'The Hindu', 'Deccan Herald', 'MSN', 'Jagran Josh', 'Adda247', 'Testbook',
        'Careers360', 'Shiksha', 'LiveMint', 'The Indian Express', 'Firstpost', 'DNA India',
        'Zee News', 'ABP Live', 'Business Insider', 'Forbes', 'CNBC', 'Naukri', 'Foundit'
    ];

    // If source is a known news outlet, trust the Title first
    const isNewsSource = NEWS_SOURCES.some(s => source.includes(s));

    if (isNewsSource || source.includes('News')) {
        // Heuristic: Company name is usually the first 1-2 words of the title
        // e.g. "Infosys off-campus..." -> "Infosys"
        // e.g. "TCS hiring..." -> "TCS"
        const firstWord = title.split(' ')[0];
        const secondWord = title.split(' ')[1];

        // Return first word if it looks like a proper noun (capitalized), else fallback
        if (firstWord && firstWord[0] === firstWord[0].toUpperCase()) {
            // If second word is also Capitalized (e.g. Goldman Sachs), take both
            // BUT exclude generic role indicators
            const GENERIC_SUFFIXES = ['Off-campus', 'Hiring', 'Recruits', 'Says', 'Internship', 'Intern', 'Program', 'Programme', 'Training', 'Apprentice', 'Batch', 'Drive', 'Exam', 'Jobs'];

            if (secondWord && secondWord[0] === secondWord[0].toUpperCase() && !GENERIC_SUFFIXES.includes(secondWord)) {
                return `${firstWord} ${secondWord}`.replace(/['":]/g, '');
            }
            return firstWord.replace(/['":]/g, '');
        }
    }

    // Default: Use source if it's likely the company itself
    return source?.replace(' - Google News', '') || '';
}

// Helper to extract clean job role from title
function extractJobRole(title: string): string {
    // Remove "Hiring", "Company Name", "Source" clutter
    // e.g. "Infosys is hiring Software Engineers for Pune" -> "Software Engineers"
    // This is hard with regex. 
    // Simpler approach: Remove known suffix/prefix words.
    let role = title
        .replace(/hiring/gi, '')
        .replace(/recruitment/gi, '')
        .replace(/drive/gi, '')
        .replace(/application/gi, '')
        .replace(/apply/gi, '')
        .replace(/online/gi, '')
        .replace(/off-campus/gi, '')
        .replace(/internship/gi, 'Intern') // Normalize
        .replace(/ - .*/, '') // Remove source at end
        .trim();

    // If it becomes too short, return original (truncated)
    if (role.length < 5) return title.split('-')[0].trim();

    return role;
}

// Helper to extract Application Deadline
function extractDeadline(text: string): Date | null {
    try {
        // Regex for "Apply by [Date]", "Deadline: [Date]", "Last Date: [Date]"
        const simpleDateRegex = /(?:apply by|deadline|last date|closes on|expires on)\s*[:\-]?\s*([a-zA-Z]{3,9}\s\d{1,2}(?:st|nd|rd|th)?,?\s?\d{4}|\d{1,2}\s[a-zA-Z]{3,9}\s\d{4}|\d{4}-\d{2}-\d{2})/i;

        const match = text.match(simpleDateRegex);
        if (match && match[1]) {
            const date = new Date(match[1]);
            if (!isNaN(date.getTime())) return date;
        }
        return null;
    } catch (e) {
        return null;
    }
}

// Helper to determine status
function getApplicationStatus(deadline: Date | null): 'OPEN' | 'CLOSED' | 'UNKNOWN' {
    try {
        if (!deadline) return 'UNKNOWN';
        const today = new Date();
        // Reset time to compare just dates
        today.setHours(0, 0, 0, 0);
        deadline.setHours(23, 59, 59, 999); // End of deadline day

        return deadline >= today ? 'OPEN' : 'CLOSED';
    } catch (e) {
        return 'UNKNOWN';
    }
}
