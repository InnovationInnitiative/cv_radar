
import { JobListing, SearchCategory } from './job-service';
import { fetchWithProxy } from './proxy-fetcher';

// MIT Licensed List (Free to use with credit)
const VANSH_REPO_URL = "https://raw.githubusercontent.com/summer2026internships/Summer2026-Internships/main/README.md";
const VANSH_NEW_GRAD_REPO_URL = "https://raw.githubusercontent.com/vanshb03/New-Grad-2026/main/README.md";
const OHIO_REPO_URL = "https://raw.githubusercontent.com/Ohi-AIA/2026-Batch-Opportunities/main/README.md";

export async function fetchGithubInternships(category: SearchCategory): Promise<JobListing[]> {
    if (category !== 'internships') return [];

    try {
        console.log("Fetching GitHub Internships...");

        // Fetch Global list (Vansh Repo) as fallback
        const markdown = await fetchWithProxy(VANSH_REPO_URL);
        if (!markdown) return [];

        const globalJobs = parseGithubMarkdown(markdown, "internships", "global");
        return globalJobs;

    } catch (e) {
        console.error("Failed to fetch GitHub list", e);
        return [];
    }
}

export async function fetchGithubJobs(category: SearchCategory): Promise<JobListing[]> {
    if (category !== 'jobs') return [];

    try {
        console.log("Fetching GitHub Full-Time Jobs...");
        const markdown = await fetchWithProxy(VANSH_NEW_GRAD_REPO_URL);
        if (!markdown) return [];

        return parseGithubMarkdown(markdown, "jobs", "global");

    } catch (e) {
        console.error("Failed to fetch GitHub list", e);
        return [];
    }
}

function parseGithubMarkdown(markdown: string, type: 'internships' | 'jobs', region: 'global' | 'india'): JobListing[] {
    const lines = markdown.split('\n');
    const jobs: JobListing[] = [];
    let lastCompany = '';

    for (const line of lines) {
        if (!line.includes('|') || line.includes('---') || line.toLowerCase().includes('company')) continue;

        const cols = line.split('|').map(c => c.trim());
        // Markdown table split results in empty strings at start/end if pipes border the line
        // | Col1 | Col2 | -> ["", "Col1", "Col2", ""]
        // Filter out those empty matches to get real content
        const cleanCols = cols.filter(c => c !== '');

        if (cleanCols.length < 4) continue;

        // Parse Columns based on region/repo structure heuristics
        // Standard (Vansh): Company | Role | Location | Apply
        // Ohi-AIA: Company | Role | Location | Batch | Apply (5 cols)

        let companyIdx = 0;
        let roleIdx = 1;
        let locationIdx = 2;
        let linkIdx = 3;

        // Auto-detect format variation
        if (cleanCols.length >= 5) {
            // Likely Ohi-AIA format
            linkIdx = 4;
        }

        let company = cleanCols[companyIdx].replace(/\[|\]/g, '').replace(/\*\*|__/g, '');
        // Extract Name from [Name](link)
        if (company.includes('(') && company.includes(')')) {
            company = company.split(']')[0].replace('[', '');
        }

        // Handle "Same as above"
        if (company === '↳' || company === '' || company === '"') {
            company = lastCompany;
        } else {
            lastCompany = company;
        }

        if (!company) continue;

        const role = cleanCols[roleIdx].replace(/\*\*|__/g, '');
        const location = cleanCols[locationIdx].replace(/\*\*|__/g, '');

        // Extract Link from [Apply](url) or <a href="url">
        const rawLink = cleanCols[linkIdx];
        const linkMatch = rawLink.match(/\((https?:\/\/[^)]+)\)/) || rawLink.match(/href="([^"]+)"/) || rawLink.match(/(https?:\/\/[^\s]+)/);
        const link = linkMatch ? linkMatch[1] : '';

        // Skip invalid/closed
        if (!link || link.includes('🔒') || rawLink.toLowerCase().includes('closed')) continue;

        let id = `gh-${region}-${company}-${role}`.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '').toLowerCase();

        // Unique ID check
        let uniqueId = id;
        let counter = 2;
        while (jobs.some(j => j.id === uniqueId)) {
            uniqueId = `${id}-${counter}`;
            counter++;
        }

        jobs.push({
            id: uniqueId,
            title: `${company} - ${role}`,
            link: link,
            pubDate: new Date().toISOString(),
            source: region === 'india' ? "Verified (India Off-Campus)" : "Community List (Verified)",
            snippet: `Verified Listing: ${role} position at ${company}.\nLocation: ${location}.\nRegion: ${region.toUpperCase()}`,
            company: company
        });
    }

    console.log(`Parsed ${jobs.length} ${type} from GitHub (${region})`);
    return jobs;
}
