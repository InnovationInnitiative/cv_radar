import fs from 'fs';
import path from 'path';
import { JobListing } from './job-service';

// Use /tmp for Vercel/Serverless writability if needed, though ephemeral.
// For local dev, we use the source directory to persist changes.
// In a real Vercel app, you need a database.
const DATA_FILE = path.join(process.cwd(), 'src', 'lib', 'internships.json');

export async function getStoredInternships(): Promise<JobListing[]> {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            return [];
        }
        const data = await fs.promises.readFile(DATA_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading internship data:", error);
        return [];
    }
}

export async function saveStoredInternships(internships: JobListing[]) {
    try {
        await fs.promises.writeFile(DATA_FILE, JSON.stringify(internships, null, 2));
        return true;
    } catch (error) {
        console.error("Error saving internship data:", error);
        return false;
    }
}
