// Utility to parse PDF text Client-Side Only
// We use dynamic imports to prevent Next.js build from crashing on worker files

export async function extractTextFromPdf(file: File): Promise<string> {
    if (typeof window === 'undefined') {
        throw new Error("PDF extraction is client-side only");
    }

    try {
        const arrayBuffer = await file.arrayBuffer();

        // 1. Dynamic Import to avoid build-time bundling issues
        const pdfjs = await import('pdfjs-dist');

        // 2. Set Worker manually to CDN to avoid Webpack processing it
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

        // 3. Load Document
        const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        let fullText = '';

        // 4. Extract Text
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();

            const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');

            fullText += pageText + '\n\n';
        }

        return fullText.trim();

    } catch (error) {
        console.error('PDF Parse Error:', error);
        throw new Error('Could not read PDF. Please ensure it is a valid text-based PDF file.');
    }
}
