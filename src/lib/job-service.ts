import { MAJOR_ALIASES } from './constants';
import { convertXML } from 'simple-xml-to-json';
import { fetchWithProxy } from './proxy-fetcher';

export interface JobListing {
    id: string;
    title: string;
    link: string;
    pubDate: string;
    source: string;
    snippet: string;
    company?: string;
}

export type SearchCategory = 'internships' | 'jobs' | 'ats';

export interface UserProfile {
    name: string;
    cgpa: number;
    city: string;
    major: string;
    year: string;
}

// Utility to filter out general news noise
function filterIrrelevantNews(jobs: JobListing[], queryTokens: string[] = [], category: SearchCategory = 'jobs'): JobListing[] {
    const NOISE_KEYWORDS = [
        "remark", "comment", "sparks", "discussion", "opinion", "says", "reaction",
        "viral", "video", "trend", "slam", "netizen", "twitter", "reddit",
        "advice", "tips", "guide", "how to", "can i", "can final", "why", "preparation", "syllabus",
        // Education noise
        "upsc", "ssc", "board", "cbse", "admit card", "result", "cutoff", "paper", "exam", "class 10", "class 12"
    ];

    const STRONG_SIGNALS = [
        "hiring", "hire", "intern", "job", "career", "opening", "vacancy", "role", "position", "apply", "recruitment", "drive", "opportunity"
    ];

    return jobs.filter(job => {
        const text = (job.title + " " + job.snippet).toLowerCase();

        // 1. Strict Blacklist (Always Kill Noise)
        const hasNoise = NOISE_KEYWORDS.some(word => text.includes(word));
        if (hasNoise) return false;

        // 2. Strict Internship Rule
        if (category === 'internships') {
            const isInternship = text.includes("intern") || text.includes("stipend") || text.includes("summer");
            // If it's an internship search, it MUST be about internships. 
            // "Software Engineer" job shouldn't appear in internship tab unless it says "Intern".
            if (!isInternship) return false;
        }

        // 3. Signal Check
        const hasStrongSignal = STRONG_SIGNALS.some(word => text.includes(word));
        const hasContextSignal = queryTokens.some(token => token.length > 3 && text.includes(token));

        if (!hasStrongSignal && !hasContextSignal) return false;

        // 4. Expiration Check (Safety Net)
        // Discard anything older than 30 days even if RSS returned it
        const pubDate = new Date(job.pubDate);
        const diffTime = Math.abs(new Date().getTime() - pubDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 30) return false;

        return true;
    });
}

// Utility to deduplicate jobs by ID or Title similarity
export function deduplicateJobs(jobs: JobListing[], query: string = "", category: SearchCategory = 'jobs'): JobListing[] {
    const seen = new Set<string>();

    // Extract significant tokens from query for context matching
    const tokens = query.toLowerCase().split(' ').filter(t => t.length > 3 && !['hiring', 'apply', 'jobs'].includes(t));
    const cleanJobs = filterIrrelevantNews(jobs, tokens, category);

    // SORT: Weighted Priority (Location > Date)
    // 1. Tier 1 India (Top Cities) -> +40
    // 2. Remote -> +30
    // 3. Tier 2 (General India / Unknown) -> +20
    // 4. Foreign (Explicitly excluded countries) -> 0

    const getLocationScore = (txt: string, source: string) => {
        const text = txt.toLowerCase();

        // 1. ABSOLUTE PRIORITY: Featured / Pinned (Admin Controlled)
        if (source.includes("Featured")) return 200;

        // 2. Foreign / Non-India Filter (Aggressive)
        // Expanded list to catch "San Jose, CA", "San Francisco", etc.
        const FOREIGN = [
            "united states", "usa", "uk", "london", "germany", "berlin", "singapore", "canada", "australia", "dublin", "ireland", "france", "paris", "tokyo", "amsterdam", "netherlands", "sweden", "switzerland",
            "san francisco", "san jose", "new york", "los angeles", "chicago", "seattle", "austin", "boston", "california", "texas", "washington",
            ", ca", ", ny", ", tx", ", wa", ", ma", ", il", "north america", "europe"
        ];
        if (FOREIGN.some(c => text.includes(c))) return 0;

        // 3. Verified Indian Sources
        if (source.includes("Verified (India")) return 150;

        // 4. Other Verified Sources (e.g. Global List but not explicitly Foreign text)
        // We lower this below "Verified India" but above generic news
        if (source.includes("Verified")) return 80;

        // 5. Tier 1 Cities
        const TIER_1 = ["bangalore", "bengaluru", "delhi", "mumbai", "pune", "hyderabad", "chennai", "kolkata", "gurgaon", "noida", "ahmedabad", "india"];
        if (TIER_1.some(c => text.includes(c))) return 40;

        // 6. Remote
        if (text.includes("remote") || text.includes("wfh") || text.includes("work from home")) return 30;

        // 7. Tier 2 / Default (Assume India if source is local news/not foreign)
        return 20;
    };

    cleanJobs.sort((a, b) => {
        const textA = a.title + " " + a.snippet;
        const textB = b.title + " " + b.snippet;

        const scoreA = getLocationScore(textA, a.source);
        const scoreB = getLocationScore(textB, b.source);

        // Primary: Location Score Descending
        if (scoreA !== scoreB) {
            return scoreB - scoreA;
        }

        // Secondary: Date Descending (Newest First)
        return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
    });

    return cleanJobs.filter(job => {
        // More aggressive dedupe: Use first 30 chars of title + source
        const key = `${job.title.toLowerCase().substring(0, 30)}-${job.source.toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

// Core search function
// Core search function
export async function fetchJobsForQuery(query: string, suffix: string, timeLimit: string = "when:14d"): Promise<JobListing[]> {
    // FORCE FRESHNESS: Append "when:14d" to get results only from the last 14 days for jobs.
    // Allow overriding for Company Intel (which needs evergreen data).
    const encodedQuery = encodeURIComponent(`${query} ${suffix} ${timeLimit}`);
    const rssUrl = `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-IN&gl=IN&ceid=IN:en`;

    try {
        const xmlData = await fetchWithProxy(rssUrl);
        if (!xmlData) return [];

        const json = convertXML(xmlData);
        const channel = json.rss?.children?.find((c: any) => c.channel)?.channel;
        const items = channel?.children?.filter((c: any) => c.item).map((c: any) => c.item) || [];

        return items.map((item: any) => {
            const getText = (key: string) => {
                const node = item.children?.find((c: any) => c[key]);
                return node ? node[key].content : '';
            };
            return {
                id: getText('guid') || Math.random().toString(),
                title: getText('title'),
                link: getText('link'),
                pubDate: getText('pubDate'),
                source: getText('source'),
                snippet: getText('description')
            };
        });
    } catch (err) {
        console.warn(`Search failed for "${query}"`, err);
        return [];
    }
}

export async function searchJobs(query: string = "software engineer", category: SearchCategory = 'jobs'): Promise<JobListing[]> {
    let suffix = "hiring";
    if (category === 'internships') suffix = "internship hiring";

    // For ATS, we shouldn't really be searching jobs, but if called:
    if (category === 'ats') suffix = "resume tips";

    // 1. PINNED INTERNSHIPS (Highest Priority)
    let pinnedJobs: JobListing[] = [];
    if (category === 'internships') {
        const { PINNED_INDIAN_INTERNSHIPS } = await import('./pinned-internships');
        pinnedJobs = PINNED_INDIAN_INTERNSHIPS;
    }

    // 2. TARGETED COMPANY SEARCH (High Priority - Dynamic)
    // Pick 3 random Indian Unicorns/MNCs to specifically check for
    let targetedJobs: JobListing[] = [];
    if (category === 'internships') {
        const { INDIAN_COMPANIES } = await import('./companies-seed');
        // Filter for potential hirers
        const targets = INDIAN_COMPANIES
            .filter(c => ['MNC', 'Unicorn'].includes(c.tier))
            .sort(() => 0.5 - Math.random())
            .slice(0, 3); // Pick 3 random top companies

        const targetPromises = targets.map(c =>
            fetchJobsForQuery(`${c.name}`, "internship India", "when:7d") // Very fresh
        );

        const targetResults = await Promise.allSettled(targetPromises);
        targetedJobs = targetResults
            .map(r => r.status === 'fulfilled' ? r.value : [])
            .flat();
    }

    // 3. GENERIC RSS SEARCH (Medium Priority)
    const genericJobs = await fetchJobsForQuery(query, suffix);

    // Combine Everything
    const allJobs = [...pinnedJobs, ...targetedJobs, ...genericJobs];

    return deduplicateJobs(allJobs, query, category);
}



// Parallel Profile Search
// Helper to get search terms based on profile
export function getSearchTerms(profile: UserProfile, category: SearchCategory): string[] {
    let searchTerms: string[] = [];

    // 1. Generate Query Variations based on Profile (Throttled Mode)
    if (profile.major) {
        // 1. Major + Fresher (Standard News)
        searchTerms.push(`${profile.major} fresher`);
    }

    if (profile.city) {
        // Localized Search (Big City News)
        searchTerms.push(`jobs in ${profile.city} for freshers`);
    }

    // Default if profile is empty
    if (searchTerms.length === 0) searchTerms.push('hiring for freshers');

    return searchTerms;
}

// Helper to get suffix based on category
export function getCategorySuffix(category: SearchCategory): string {
    if (category === 'internships') return "internship hiring";
    return "hiring apply";
}

// Parallel Profile Search (Legacy/Batch Mode) -- Kept for compatibility but we will move to Progressive in UI
export async function searchWithProfile(profile: UserProfile, category: SearchCategory): Promise<JobListing[]> {
    const searchTerms = getSearchTerms(profile, category);
    const suffix = getCategorySuffix(category);

    // 2. Sequential Execution (Layered Loading)
    // We run requests one by one to avoid triggering proxy rate limits (429 Too Many Requests)
    // PROMISE.ALL IS REMOVED to prevent "burst" traffic.
    const results: JobListing[][] = [];

    for (const term of searchTerms) {
        try {
            const batch = await fetchJobsForQuery(term, suffix);
            if (batch.length > 0) {
                results.push(batch);
            }
            // Polite delay between requests
            await new Promise(resolve => setTimeout(resolve, 1500));
        } catch (e) {
            console.warn(`Failed to fetch for term "${term}"`, e);
            // Continue to next term even if one fails
        }
    }

    // 3. Aggregate & Deduplicate
    const allJobs = results.flat();
    return deduplicateJobs(allJobs, profile.major || "fresher", category);
}

// Legacy Company Intel Search (Removed)
// export async function getCompanyIntel(companyName: string): Promise<JobListing[]> { ... }
