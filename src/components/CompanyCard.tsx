
import React from 'react';
import { CompanyInfo } from '../lib/companies-seed';
import { Building2, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';

interface CompanyCardProps {
    company: CompanyInfo;
}

export function CompanyCard({ company }: CompanyCardProps) {
    // Generate a deep link to the company view page (yet to be created, but we will plan for it)
    // We will reuse the job view mechanism OR create a dedicated one.
    // Ideally, we want /company/view?name=Zomato using the query param to fetch intel.
    const queryParams = new URLSearchParams({
        company: company.name,
        source: 'Directory',
        title: `${company.name} Overview`,
        url: `https://google.com/search?q=${encodeURIComponent(company.name)}` // Placeholder for audit validation
    }).toString();

    const getTierColor = (tier: string) => {
        switch (tier) {
            case 'Unicorn': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'MNC': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Service-Based': return 'bg-gray-100 text-gray-700 border-gray-200';
            default: return 'bg-green-100 text-green-700 border-green-200';
        }
    };

    // Helper to capitalize words
    const formatName = (name: string) => {
        return name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all transform hover:-translate-y-1 group">
            <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center text-xl font-bold text-gray-400 border border-gray-100 group-hover:bg-black group-hover:text-white transition-colors">
                    {company.name.charAt(0).toUpperCase()}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getTierColor(company.tier)}`}>
                    {company.tier}
                </span>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-1">{formatName(company.name)}</h3>
            <p className="text-sm text-gray-500 mb-4 flex items-center">
                <Building2 size={14} className="mr-1" /> {company.industry}
            </p>

            <p className="text-sm text-gray-600 mb-6 line-clamp-2 h-10">
                {company.description}
            </p>

            <Link
                href={`/job/view?${queryParams}`}
                className="w-full block text-center bg-black text-white font-bold py-2.5 rounded-lg hover:bg-gray-800 transition-colors"
                title="Click to generate an audit report for this company"
            >
                Check Vibe Score
            </Link>
        </div>
    );
}
