import { NextResponse } from 'next/server';
import { getStoredInternships, saveStoredInternships } from '@/lib/storage';
import { JobListing } from '@/lib/job-service';

// GET: Fetch all internships
export async function GET() {
    const data = await getStoredInternships();
    return NextResponse.json(data);
}

// POST: Update the internship list (Admin only)
// Requires correct headers or body with passwords
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { passwordOne, passwordTwo, internships } = body;

        // 2-FACTOR "PASSWORD" AUTH ;)
        // In a real app, use environmental variables or real auth.
        // Spec: "protected by 2 password"
        if (passwordOne !== "secret2026" || passwordTwo !== "adAGARAVAV@3308172425") {
            return NextResponse.json({ error: "Unauthorized: Invalid Credentials" }, { status: 401 });
        }

        if (!internships || !Array.isArray(internships)) {
            return NextResponse.json({ error: "Invalid Data" }, { status: 400 });
        }

        await saveStoredInternships(internships as JobListing[]);
        return NextResponse.json({ success: true, count: internships.length });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
