
/**
 * InsightCareers Scoring Engine
 * Client-Side Processing for Sentiment and Matching.
 */

// SRS 3.2: Corporate Vibe-Score Lexicon
const POSITIVE_TOKENS = ["mentorship", "stipend", "growth", "inclusive", "learning", "equity", "remote", "flexible"];
const NEGATIVE_TOKENS = ["unpaid", "toxic", "late hours", "overtime", "layoff", "urgent", "fast-paced", "stress"];

// SRS 3.2: Normalization (The S-Curve)
export function calculateVibeScore(text: string): { score: number; details: { positive: number; negative: number; tokens: string[] } } {
    const lowerText = text.toLowerCase();
    let rawScore = 0;
    const matches: string[] = [];
    let posCount = 0;
    let negCount = 0;

    POSITIVE_TOKENS.forEach(token => {
        // Simple inclusion check, can be improved with regex for word boundaries
        if (lowerText.includes(token)) {
            rawScore += 5;
            posCount++;
            matches.push(`+${token}`);
        }
    });

    NEGATIVE_TOKENS.forEach(token => {
        if (lowerText.includes(token)) {
            rawScore -= 10;
            negCount++;
            matches.push(`-${token}`);
        }
    });

    // Tanh Normalization: 50 + (tanh(rawScore / 10) * 50)
    const normalizedScore = 50 + (Math.tanh(rawScore / 10) * 50);

    return {
        score: Math.round(normalizedScore),
        details: {
            positive: posCount,
            negative: negCount,
            tokens: matches
        }
    };
}

// SRS 3.3: Personalized Match Engine (PME)
interface UserProfile {
    cgpa: number;
    city: string;
    major: string;
    resumeText?: string;
}

interface JobDetails {
    description: string;
    location: string;
    qualifications: string;
}

export function calculateMatchScore(user: UserProfile, job: JobDetails): { matchPercentage: number; flags: string[] } {
    let score = 100;
    const flags: string[] = [];

    // 1. Academic Audit (CGPA)
    // Simplified extraction logic for demo
    const cgpaMatch = job.description.match(/CGPA\s*(?:of|:)?\s*(\d+(\.\d+)?)/i);
    if (cgpaMatch) {
        const requiredCgpa = parseFloat(cgpaMatch[1]);
        if (user.cgpa < requiredCgpa) {
            score -= 50;
            flags.push(`CGPA Gap: Requires ${requiredCgpa}`);
        }
    }

    // 2. Location Audit
    // Reduced penalty (Was 30, now 15) to be less harsh
    // Added specific location detail to the flag
    if (!job.location.toLowerCase().includes(user.city.toLowerCase()) && !job.location.toLowerCase().includes('remote')) {
        score -= 15;
        // Heuristic: If identifying location is hard from raw text, clean it up or allow "Unknown"
        // But here job.location is passed as description text in current implementation?
        // Wait, in JobAuditPage: location: text. 
        // That's bad. The text is the WHOLE description. "Job is in [Whole Description]" is wrong.
        // I need to check if we can pass a better location.
        // For now, I will assume job.location MIGHT imply the City if extracted, but since it's passing 'text', 
        // I should just say "Location Mismatch" unless distinct extraction exists.

        // Actually, looking at JobAuditPage, it passes 'text' for location. This is a bug in the *caller*.
        // But I can't fix extraction purely here.
        // I will change the logic to: "Location Mismatch: Job location differs from ${user.city}"
        flags.push(`Location Mismatch: Job location differs from ${user.city}`);
    }

    // 3. Subject/Major Audit
    // Reduced penalty (Was 20, now 10)
    if (!job.qualifications.toLowerCase().includes(user.major.toLowerCase())) {
        score -= 10;
        flags.push(`Stream Mismatch: Job requirements differ from ${user.major}`);
    }

    // 4. Resume Keyword Match (The "Skill Match")
    if (user.resumeText) {
        // Extract significant words from JD and Resume (>4 chars)
        const getKeywords = (txt: string) => new Set(txt.toLowerCase().match(/\b[a-z]{4,}\b/g) || []);

        const jdKeywords = getKeywords(job.description);
        const resumeKeywords = getKeywords(user.resumeText);

        // Intersection
        let matchCount = 0;
        jdKeywords.forEach(k => {
            if (resumeKeywords.has(k)) matchCount++;
        });

        // Similarity Ratio (Jaccard-ish but simpler: % of JD covered by Resume)
        // Cap calculation base to avoid huge JDs diluting score
        const totalRelevant = Math.min(jdKeywords.size, 50);
        const ratio = totalRelevant > 0 ? matchCount / totalRelevant : 0;
        const matchPercentage = Math.round(ratio * 100);

        // Boost/Penalty logic
        // If match > 50%, we give a boost. If < 20%, slight penalty.
        if (matchPercentage > 40) {
            // Good match!
            // No penalty, maybe even ignoring earlier penalties? 
            // We just won't subtract.
        } else if (matchPercentage < 15) {
            score -= 20;
            flags.push("Low Relevance: Resume content has low overlap with Job Description.");
        }

        // We can return this ratio separately or mix it.
        // Let's mix it into the final score heavily now.
        // 50% Base score comes from this match
        score = (score * 0.5) + (Math.min(100, matchPercentage * 1.5) * 0.5);
    } else {
        // No resume? Default Penalty or just neutral?
        // Neutral for now, but maybe a flag
        flags.push("Resume Missing: Upload resume to check Skill Match.");
    }

    return {
        matchPercentage: Math.max(0, Math.round(score)),
        flags
    };
}

// Reputation Analysis for Deep Intel
export function calculateReputationScore(items: any[]): { status: 'Positive' | 'Negative' | 'Mixed' | 'Neutral', score: number, signals: string[] } {
    let positiveCount = 0;
    let negativeCount = 0;
    const signals: string[] = [];

    const POS_KEYWORDS = [/\bgood\b/i, /\bgreat\b/i, /\bbest\b/i, /\bgrowth\b/i, /\bbalance\b/i, /\bfair\b/i, /\bbenefit\b/i, /\bpromot/i, /\bintern/i, /\bdrive\b/i, /\bhir/i, /\bopportunity\b/i];
    const NEG_KEYWORDS = [/\btoxic\b/i, /\bbad\b/i, /\bworst\b/i, /\bpolitics\b/i, /\bstress\b/i, /\blow pay\b/i, /\bovertime\b/i, /\bavoid\b/i, /\blayoff\b/i];

    items.forEach(item => {
        const text = (item.title + " " + (item.snippet || "")).toLowerCase();

        POS_KEYWORDS.forEach(regex => {
            if (regex.test(text)) {
                positiveCount++;
            }
        });

        NEG_KEYWORDS.forEach(regex => {
            if (regex.test(text)) {
                negativeCount++;
                signals.push("Warning: " + item.title);
            }
        });
    });

    let status: 'Positive' | 'Negative' | 'Mixed' | 'Neutral' = 'Neutral';
    let score = 0;

    // DRASTICALLY INCREASED WEIGHTS (+/- 30 instead of 10)
    // This allows the Company Reputation to override the generic Vibe Score.
    // Negative Intel will tank the score (e.g. 50 - 30 = 20 RED)
    // Positive Intel will boost it (e.g. 50 + 30 = 80 GREEN)
    if (positiveCount > 0 && negativeCount === 0) {
        status = 'Positive';
        score = 30;
    } else if (negativeCount > 0 && positiveCount === 0) {
        status = 'Negative';
        score = -30;
    } else if (positiveCount > 0 && negativeCount > 0) {
        status = 'Mixed';
        score = -10; // Mixed leans slightly negative for caution
    }

    return { status, score, signals: signals.slice(0, 3) }; // Limit signals
}
