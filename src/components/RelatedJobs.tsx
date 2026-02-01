
import React, { useEffect, useState } from 'react';
import { fetchJobsForQuery, JobListing } from '../lib/job-service';
import { Briefcase, Loader2, ExternalLink, Calendar, MapPin } from 'lucide-react';

interface RelatedJobsProps {
    companyName: string;
}

export function RelatedJobs({ companyName }: RelatedJobsProps) {
    const [jobs, setJobs] = useState<JobListing[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    useEffect(() => {
        if (!companyName) return;

        // "Polite" Delay: Wait 5 seconds before firing this search 
        // to avoid colliding with the main Critical Intel search.
        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                // Extended query to catch more results
                // e.g. "DRDO careers hiring recruitment vacancy"
                const query = `"${companyName}" careers hiring recruitment vacancy`;
                const results = await fetchJobsForQuery(query, "apply");

                // Filter: Must actually mention company in title
                const strictResults = results.filter(job =>
                    job.title.toLowerCase().includes(companyName.toLowerCase())
                ).slice(0, 5); // Take top 5

                setJobs(strictResults);
            } catch (err) {
                console.warn("Related jobs fetch failed", err);
            } finally {
                setLoading(false);
                setSearched(true);
            }
        }, 5000); // 5 Second Delay

        return () => clearTimeout(timer);
    }, [companyName]);

    // Don't render until we have at least started searching or have a name
    if (!companyName) return null;
    if (!loading && !searched) return null; // Hidden until the 5s timer kicks in

    return (
        <div className="bg-white rounded-xl shadow-sm p-6 mt-8 border border-gray-100">
            <h3 className="text-lg font-bold text-black mb-4 flex items-center">
                <Briefcase size={20} className="mr-2 text-indigo-600" />
                More Opportunities at {companyName}
            </h3>

            {loading ? (
                <div className="flex items-center text-sm text-gray-500 animate-pulse">
                    <Loader2 size={16} className="animate-spin mr-2" />
                    Scanning for other active listings...
                </div>
            ) : jobs.length === 0 ? (
                <div className="text-sm text-gray-500 italic">
                    No other active listings found in our public scan.
                    <a href={`https://www.google.com/search?q=${encodeURIComponent(companyName + " careers")}`} target="_blank" className="text-indigo-600 hover:underline ml-1">
                        Try Google Search
                    </a>
                </div>
            ) : (
                <div className="space-y-3">
                    {jobs.map(job => (
                        <div key={job.id} className="group p-3 hover:bg-indigo-50 rounded-lg border border-gray-100 transition-colors">
                            <a href={job.link} target="_blank" className="block">
                                <div className="font-semibold text-gray-800 group-hover:text-indigo-700 leading-tight mb-1">
                                    {job.title}
                                </div>
                                <div className="flex items-center text-xs text-gray-500 gap-3">
                                    <span className="flex items-center">
                                        <Calendar size={10} className="mr-1" />
                                        {new Date(job.pubDate).toLocaleDateString()}
                                    </span>
                                    <span className="flex items-center text-indigo-600 font-medium">
                                        Apply Now <ExternalLink size={10} className="ml-1" />
                                    </span>
                                </div>
                            </a>
                        </div>
                    ))}
                    <div className="pt-2 text-center">
                        <a href={`https://www.google.com/search?q=${encodeURIComponent(companyName + " careers hiring")}`} target="_blank" className="text-xs text-indigo-500 font-bold hover:underline">
                            View All Openings
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}
