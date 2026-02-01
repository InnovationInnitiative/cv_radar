
'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { searchJobs, searchWithProfile, JobListing, SearchCategory } from '../lib/job-service';
import { UserProfileModal } from '../components/UserProfileModal';
import { JobCard } from '../components/JobCard';
import { AdNativeFeed } from '../components/ads/AdNativeFeed';
// import { CompanyCard } from '../components/CompanyCard';
// import { INDIAN_COMPANIES, CompanyInfo } from '../lib/companies-seed';
// import { AtsScoreChecker } from '../components/AtsScoreChecker';
import { Search, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';

const AtsScoreChecker = dynamic(() => import('../components/AtsScoreChecker').then(mod => mod.AtsScoreChecker), {
  ssr: false,
  loading: () => <div className="p-8 text-center bg-white rounded-xl shadow-sm">Loading ATS Engine...</div>
});

export default function Home() {
  const { profile } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchCategory>('internships');
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [masterGithubJobs, setMasterGithubJobs] = useState<JobListing[]>([]); // Store original GitHub list

  // Companies Data Removed
  // const [filteredCompanies, setFilteredCompanies] = useState<CompanyInfo[]>(INDIAN_COMPANIES);

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  /* REMOVED: Auto-open on mount
  useEffect(() => {
    if (!profile) {
      setIsModalOpen(true);
    }
  }, [profile]);
  */

  // Auto-refresh when tab changes
  useEffect(() => {
    // If no query, run personalized feed automatically
    if (!query && profile) {
      runPersonalizedFeed();
    } else if (query) {
      handleSearch(new Event('submit') as any);
    }
  }, [activeTab, profile?.major]);

  // PROGRESSIVE FEED LOADER
  const runPersonalizedFeed = async () => {
    if (!profile) return;
    setLoading(true);
    setJobs([]); // Clear previous
    setStatusMsg('Initializing personalized search...');

    // Dynamic Import
    const { getSearchTerms, getCategorySuffix, fetchJobsForQuery, deduplicateJobs } = await import('../lib/job-service');
    const { fetchGithubInternships, fetchGithubJobs } = await import('../lib/github-fetcher');

    let currentJobs: JobListing[] = [];

    // 0. PINNED INTERNSHIPS (Dynamic Fetch)
    if (activeTab === 'internships') {
      try {
        // Fetch from our local API (which reads from JSON/DB)
        const res = await fetch('/api/internships');
        let pinned: JobListing[] = [];
        if (res.ok) {
          pinned = await res.json();
        } else {
          // Fallback to static if API fails
          const { PINNED_INDIAN_INTERNSHIPS } = await import('../lib/pinned-internships');
          pinned = PINNED_INDIAN_INTERNSHIPS;
        }

        currentJobs = [...pinned];
        setJobs([...currentJobs]);
        setStatusMsg('Loaded Featured Indian Internships...');
      } catch (e) {
        console.warn("Pinned fetch failed", e);
        // Fallback just in case
        try {
          const { PINNED_INDIAN_INTERNSHIPS } = await import('../lib/pinned-internships');
          currentJobs = [...PINNED_INDIAN_INTERNSHIPS];
          setJobs([...currentJobs]);
        } catch (err) { console.error("Fatal pinned error", err); }
      }
    }

    // 0.5. TARGETED COMPANY SEARCH (Indian Giants)
    if (activeTab === 'internships') {
      setStatusMsg('Scanning top Indian companies...');
      try {
        const { INDIAN_COMPANIES } = await import('../lib/companies-seed');
        // Pick 3 random targets
        const targets = INDIAN_COMPANIES
          .filter(c => ['MNC', 'Unicorn'].includes(c.tier))
          .sort(() => 0.5 - Math.random())
          .slice(0, 3);

        for (const company of targets) {
          const batch = await fetchJobsForQuery(`${company.name}`, "internship India", "when:14d");
          if (batch.length > 0) {
            currentJobs = [...currentJobs, ...batch];
            setJobs(deduplicateJobs(currentJobs, profile.major || "fresher", activeTab));
          }
        }
      } catch (e) { console.warn("Targeted search failed", e); }
    }


    // 1. Fetch GitHub Community List FIRST (High Quality, verified)
    if (activeTab === 'internships' || activeTab === 'jobs') {
      setStatusMsg('Fetching verified community lists (GitHub)...');
      try {
        let ghJobs: JobListing[] = [];
        if (activeTab === 'internships') {
          ghJobs = await fetchGithubInternships('internships');
        } else {
          ghJobs = await fetchGithubJobs('jobs');
        }

        if (ghJobs.length > 0) {
          setMasterGithubJobs(ghJobs); // Save Master Copy
          // Merge GitHub with Pinned
          currentJobs = [...currentJobs, ...ghJobs];
          // Dedupe again to keep pinned at top (dedupe preserves order)
          currentJobs = deduplicateJobs(currentJobs, profile.major || "fresher", activeTab);
          setJobs([...currentJobs]);
        }
      } catch (e) {
        console.warn("GitHub fetch failed", e);
      }
    }

    // 2. Then run Google News Scan
    const terms = getSearchTerms(profile, activeTab);
    const suffix = getCategorySuffix(activeTab);

    for (const term of terms) {
      setStatusMsg(`Scanning for "${term}"...`);
      try {
        const batch = await fetchJobsForQuery(term, suffix);

        // Progressive Update
        if (batch.length > 0) {
          // Merge and Dedupe immediately
          const rawCombined = [...currentJobs, ...batch];
          // We use the PROFILE MAJOR as the context for deduplication to keep it relevant
          currentJobs = deduplicateJobs(rawCombined, profile.major || "fresher", activeTab);
          setJobs([...currentJobs]); // Force re-render with new reference
        }

        // Polite Delay (Visual feedback for user too!)
        await new Promise(r => setTimeout(r, 2000));
      } catch (e) {
        console.warn(`Error fetching ${term}`, e);
      }
    }

    setStatusMsg('');
    setLoading(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);

    if (!profile) {
      e?.preventDefault();
      setIsModalOpen(true);
      setLoading(false);
      return;
    }

    setStatusMsg(`Searching for "${query}"...`);

    // SPECIAL HANDLING FOR COMPANIES TAB REMOVED
    /* 
    if (activeTab === 'companies') { ... } 
    */

    let localResults: JobListing[] = [];

    // 1. Filter Local GitHub Jobs Client-Side
    if (masterGithubJobs.length > 0 && query.trim()) {
      const q = query.toLowerCase();
      localResults = masterGithubJobs.filter(job =>
        job.title.toLowerCase().includes(q) ||
        job.company?.toLowerCase().includes(q) ||
        job.snippet.toLowerCase().includes(q)
      );
    } else if (masterGithubJobs.length > 0 && !query.trim()) {
      localResults = [...masterGithubJobs];
    }

    // Show local results immediately while waiting for API
    setJobs(localResults);

    // 2. Fetch External Results (if query exists)
    if (query.trim()) {
      try {
        const apiResults = await searchJobs(query, activeTab);

        // Merge Local + API
        // We put Local first as they are "Verified"
        const combined = [...localResults, ...apiResults];

        // Use dedupe helper to remove duplicates if any
        setJobs(combined);
      } catch (e) {
        console.error(e);
        // Keep showing local results if API fails
      }
    } else if (activeTab !== 'internships') {
      // If empty query and NOT internships (which has github), run personalized
      if (profile) await runPersonalizedFeed();
    }

    setLoading(false);
    setStatusMsg('');
  };

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">iC</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-black">InsightCareers</h1>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-sm font-medium text-gray-700 hover:text-black border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            {profile ? (
              <>
                <span className="font-bold text-black">{profile.name}</span>
                <span className="text-xs text-gray-500">(Edit Profile)</span>
              </>
            ) : (
              'Add / Edit Details'
            )}
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-4xl mx-auto px-4 mt-2">
          <div className="flex space-x-8 border-b border-gray-100">
            {['internships', 'jobs', 'ats'].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  if (!profile) {
                    setIsModalOpen(true);
                    return;
                  }
                  setActiveTab(tab as any);
                }}
                className={`pb-3 text-sm font-medium transition-colors border-b-2 capitalize ${activeTab === tab ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
              >
                {tab === 'ats' ? 'CV ATS Score Checker' : tab}
              </button>
            ))}
          </div>

          {/* New: Filters */}
          <div className="flex justify-end mt-4">
            <select
              className="text-sm border-gray-200 rounded-md shadow-sm focus:border-black focus:ring-black"
              onChange={(e) => {
                if (!profile) {
                  setIsModalOpen(true);
                  e.target.value = ""; // Reset selection
                  return;
                }
                const loc = e.target.value.toLowerCase();
                if (!loc) {
                  setJobs(masterGithubJobs);
                } else {
                  const filtered = masterGithubJobs.filter(j => j.snippet.toLowerCase().includes(loc));
                  setJobs(filtered);
                }
              }}
            >
              <option value="">All Locations</option>
              <option value="bangalore">Bangalore</option>
              <option value="remote">Remote</option>
              <option value="hyderabad">Hyderabad</option>
              <option value="mumbai">Mumbai</option>
              <option value="delhi">Delhi</option>
              <option value="pune">Pune</option>
            </select>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 mt-8">
        {/* 
        {activeTab === 'ats' ? (
          <AtsScoreChecker />
        ) : (
*/}
        {activeTab === 'ats' ? (
          <AtsScoreChecker />
        ) : (
          <>
            {/* Search Hero */}
            <div className="text-center mb-12">
              <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
                {activeTab === 'internships' && "Find Student Internships"}
                {activeTab === 'jobs' && "Find Full-Time Roles"}
              </h2>
              <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
                "Verify descriptions. Detect red flags. Get the truth."
              </p>

              <form onSubmit={handleSearch} className="relative max-w-xl mx-auto">
                <input
                  type="text"
                  placeholder={activeTab === 'internships' ? "Search for internships..." : "Search for roles..."}
                  className="w-full pl-12 pr-4 py-4 rounded-full border border-gray-300 shadow-sm focus:ring-2 focus:ring-black focus:outline-none text-lg text-black placeholder:text-gray-500"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <button
                  type="submit"
                  disabled={loading && !!query} // Only disable if searching specific query
                  className="absolute right-2 top-2 bottom-2 bg-black text-white px-6 rounded-full font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" /> : 'Audit'}
                </button>
              </form>
            </div>

            {/* Status Indicator (Progressive Loading) */}
            {loading && (
              <div className="flex justify-center mb-6">
                <div className="bg-white border border-gray-200 px-4 py-2 rounded-full shadow-sm flex items-center space-x-3 text-sm text-gray-600 animate-pulse">
                  <Loader2 size={16} className="animate-spin text-indigo-600" />
                  <span>{statusMsg || 'Scanning...'}</span>
                </div>
              </div>
            )}

            {/* Results */}
            <div className="space-y-4">
              {!profile ? (
                <div className="text-center py-20 animate-in fade-in slide-in-from-bottom-4">
                  <div className="mb-6">
                    <span className="text-6xl">📋</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Start Your Audit</h3>
                  <p className="text-gray-500 mb-8 max-w-md mx-auto">
                    We need your details to match you with valid {activeTab === 'internships' ? 'internships' : 'jobs'} and filter out the noise.
                  </p>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-black text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  >
                    Add details to fetch {activeTab === 'internships' ? 'internship' : 'job'}
                  </button>
                </div>
              ) : (
                <>
                  {jobs.map((job, index) => (
                    <React.Fragment key={job.id}>
                      <JobCard job={job} />
                      {(index + 1) % 5 === 0 && <AdNativeFeed />}
                    </React.Fragment>
                  ))}

                  {/* Empty State Logic */}
                  {jobs.length === 0 && !loading && (
                    <div className="text-center py-20 text-gray-500 col-span-full">
                      {profile && !query ? (
                        <div className="space-y-4">
                          <div className="text-6xl mb-4">🕵️‍♀️</div>
                          <p>We couldn't find any high-quality matches right now.</p>
                          <p className="text-xs text-gray-400 max-w-md mx-auto">
                            Our "Anti-Noise" filters might be too strict, or the proxies are taking a break.
                          </p>
                          <button
                            onClick={() => runPersonalizedFeed()}
                            className="mt-4 px-6 py-2 bg-indigo-50 text-indigo-700 font-bold rounded-lg hover:bg-indigo-100 transition-colors"
                          >
                            Try Force Refresh
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p>No results found for "{query}".</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>

      <UserProfileModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </main>
  );
}
