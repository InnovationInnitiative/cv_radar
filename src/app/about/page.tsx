
import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AdBanner } from '../../components/ads/AdBanner';

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-3xl mx-auto px-4 py-12">
                <Link href="/" className="inline-flex items-center text-gray-600 hover:text-black mb-8">
                    <ArrowLeft size={20} className="mr-2" /> Back to Home
                </Link>

                <h1 className="text-4xl font-bold mb-6">About the Tech</h1>

                <div className="prose prose-lg">
                    <p className="lead text-xl text-gray-600">
                        InsightCareers is a stateless, client-side "Career Auditor" designed to bring transparency to the job market.
                    </p>

                    <h2>The Mathematics of "Vibe"</h2>
                    <p>
                        Our Corporate Vibe Score isn't just a random number. It uses a **Tanh Normalization** (Hyperbolic Tangent) function to map sentiment to a 0-100 scale:
                    </p>
                    <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                        VibeScore = 50 + (tanh(rawScore / 10) * 50)
                    </pre>
                    <p>
                        This ensures that extreme signals (toxic keywords) diminish in impact as they accumulate, preventing a single word from skewing the entire score, while centering average descriptions around 50.
                    </p>

                    <h2>Zero-Database Architecture</h2>
                    <p>
                        We respect your privacy by design. InsightCareers operates without a centralized database.
                        All your profile data (CGPA, preferences) is stored locally in your browser's <code>localStorage</code>.
                        We cannot see, sell, or leak your data because we never touch it.
                    </p>

                    <h2>The Proxy Cascade</h2>
                    <p>
                        To fetch job data without an API, we utilize a distributed "Proxy Cascade" that attempts to reach job boards via multiple verified gateways, ensuring reliable access to the "truth" (raw HTML) for our auditing engine.
                    </p>
                </div>

                <AdBanner size="rect" />
            </div>
        </div>
    );
}
