
import React from 'react';
import { JobListing } from '../lib/job-service';
import Link from 'next/link';
import { ExternalLink, Calendar, Building2 } from 'lucide-react';
import DOMPurify from 'dompurify';

interface JobCardProps {
    job: JobListing;
}

export function JobCard({ job }: JobCardProps) {
    // Pass job details via query params to remain stateless
    const queryParams = new URLSearchParams({
        url: job.link,
        title: job.title,
        source: job.source,
        date: job.pubDate,
        ...(job.company ? { company: job.company } : {}) // Pass explicit company if we have it
    }).toString();
    const sanitize = (html: string) => {
        if (typeof window === 'undefined') return html;
        return DOMPurify.sanitize(html);
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">
                        <Link href={`/job/view?${queryParams}`} className="hover:text-blue-600 transition-colors">
                            {job.title}
                        </Link>
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
                        {job.source.toLowerCase().includes('verified') ? (
                            <span className="flex items-center text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                                <span className="mr-1">✓</span>
                                {job.source}
                            </span>
                        ) : (
                            <span className="flex items-center">
                                <Building2 size={14} className="mr-1" />
                                {job.source}
                            </span>
                        )}
                        <span className="flex items-center">
                            <Calendar size={14} className="mr-1" />
                            {job.pubDate}
                        </span>
                    </div>
                </div>
                <Link
                    href={`/job/view?${queryParams}`}
                    className="bg-black text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors"
                >
                    Audit Job
                </Link>
            </div>

            <div
                className="mt-4 text-gray-600 text-sm line-clamp-3"
                dangerouslySetInnerHTML={{ __html: sanitize(job.snippet) }}
            />
        </div>
    );
}
