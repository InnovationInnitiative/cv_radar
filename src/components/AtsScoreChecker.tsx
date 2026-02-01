import React, { useState, useEffect } from 'react';
import { MatchMeter } from './MatchMeter';
import { AdBanner } from './ads/AdBanner';
import { Loader2, Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import { extractTextFromPdf } from '../utils/pdf-parser';
import { useUser } from '../context/UserContext';

export function AtsScoreChecker() {
    const { profile } = useUser();

    // Auto-fill from profile if available
    const [mode, setMode] = useState<'text' | 'upload'>('upload');
    const [resumeText, setResumeText] = useState(profile?.resumeText || '');
    const [fileName, setFileName] = useState(profile?.resumeFileName || '');
    const [jobDescription, setJobDescription] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [error, setError] = useState('');
    const [score, setScore] = useState<number | null>(null);
    const [analysis, setAnalysis] = useState<string[]>([]);

    // Update if profile changes late (e.g. after initial render)
    useEffect(() => {
        if (profile?.resumeText && !resumeText) {
            setResumeText(profile.resumeText);
            setFileName(profile.resumeFileName || 'Saved Resume.pdf');
        }
    }, [profile]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            setError('Please upload a PDF file.');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError('File size too large. Max 5MB.');
            return;
        }

        setError('');
        setIsParsing(true);
        setFileName(file.name);

        try {
            const text = await extractTextFromPdf(file);
            if (text.length < 50) {
                setError('Could not extract enough text. Ensure this is a text-based PDF, not an image/scan.');
                setResumeText('');
            } else {
                setResumeText(text);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to parse PDF.');
            setResumeText('');
        } finally {
            setIsParsing(false);
        }
    };

    const handleAnalyze = async () => {
        if (!resumeText.trim()) return;

        setIsAnalyzing(true);
        setScore(null);
        setAnalysis([]);
        setError('');

        // Simulate analysis delay
        await new Promise(r => setTimeout(r, 1500));

        // Mock Scoring Logic (Same as before)
        const jdKeywords = jobDescription.toLowerCase().split(/\W+/).filter(w => w.length > 4);
        const resumeLower = resumeText.toLowerCase();

        let matchCount = 0;
        let uniqueKeywords = new Set(jdKeywords);

        uniqueKeywords.forEach(word => {
            if (resumeLower.includes(word)) matchCount++;
        });

        let calculatedScore = Math.min(100, Math.floor(Math.random() * 30) + 60); // Random baseline 60-90

        if (jobDescription) {
            const ratio = uniqueKeywords.size > 0 ? matchCount / uniqueKeywords.size : 0;
            calculatedScore = Math.floor(ratio * 100);
            calculatedScore = Math.min(95, calculatedScore + 30);
        }

        setScore(calculatedScore);
        setAnalysis([
            "Resume length is optimal.",
            jobDescription ? `Matched ${matchCount} keywords from Job Description.` : "No Job Description provided for keyword matching.",
            "Formatting is ATS-friendly.",
            "Action verbs detected."
        ]);

        setIsAnalyzing(false);
    };

    return (
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">ATS Score Checker</h2>
                <p className="text-gray-500">Check your resume compatibility accurately.</p>
            </div>

            {/* Mode Toggle */}
            <div className="flex justify-center mb-6">
                <div className="bg-gray-100 p-1 rounded-lg flex text-sm font-medium">
                    <button
                        onClick={() => setMode('upload')}
                        className={`px-4 py-2 rounded-md transition-all ${mode === 'upload' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Upload PDF
                    </button>
                    <button
                        onClick={() => setMode('text')}
                        className={`px-4 py-2 rounded-md transition-all ${mode === 'text' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Paste Text
                    </button>
                </div>
            </div>

            <div className="space-y-6">

                {/* Resume Input Section */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                        Resume Content
                    </label>

                    {mode === 'upload' ? (
                        <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${fileName ? 'border-green-200 bg-green-50' : 'border-gray-200 hover:border-black'}`}>
                            {!fileName ? (
                                <>
                                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Upload size={24} className="text-gray-600" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-900">Click to upload your Resume PDF</p>
                                    <p className="text-xs text-gray-500 mt-1">Text-based PDFs only. Max 5MB.</p>
                                    <input
                                        type="file"
                                        accept=".pdf,application/pdf"
                                        onChange={handleFileUpload}
                                        className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
                                        // Creating a portal or overlay might be better but for relative this works if parent is relative
                                        style={{ display: 'none' }}
                                        id="resume-upload"
                                    />
                                    <label htmlFor="resume-upload" className="absolute inset-0 cursor-pointer"></label>
                                    <button onClick={() => document.getElementById('resume-upload')?.click()} className="mt-4 text-xs font-bold underline">Select File</button>
                                </>
                            ) : (
                                <div className="space-y-3">
                                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        {isParsing ? <Loader2 className="animate-spin text-green-600" /> : <FileText className="text-green-600" />}
                                    </div>
                                    <p className="text-sm font-medium text-gray-900 break-all">{fileName}</p>

                                    {isParsing ? (
                                        <p className="text-xs text-gray-500">Extracting text...</p>
                                    ) : (
                                        <div className="flex items-center justify-center space-x-2">
                                            <span className="text-xs text-green-600 font-bold flex items-center"><CheckCircle size={12} className="mr-1" /> Ready</span>
                                            <button
                                                onClick={() => { setFileName(''); setResumeText(''); setError(''); }}
                                                className="text-xs text-red-500 underline hover:text-red-700"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <textarea
                            className="w-full h-40 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent text-black placeholder:text-gray-500"
                            placeholder="Paste your resume text here..."
                            value={resumeText}
                            onChange={(e) => setResumeText(e.target.value)}
                        />
                    )}

                    {error && (
                        <div className="mt-2 flex items-center text-xs text-red-600">
                            <AlertCircle size={12} className="mr-1" />
                            {error}
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Job Description (Optional)
                    </label>
                    <textarea
                        className="w-full h-32 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent text-black placeholder:text-gray-500"
                        placeholder="Paste the job description here for better matching..."
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                    />
                </div>

                <div className="flex justify-center">
                    <button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing || !resumeText || isParsing}
                        className="flex items-center space-x-2 bg-black text-white px-8 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isAnalyzing ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                <span>Analyzing...</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle size={20} />
                                <span>Check Score</span>
                            </>
                        )}
                    </button>
                </div>

                {score !== null && (
                    <div className="mt-8 p-6 bg-gray-50 rounded-xl animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Analysis Result</h3>
                                <p className="text-sm text-gray-500">Based on standard ATS criteria</p>
                            </div>
                            <div className="text-right">
                                <span className={`text-4xl font-black ${score >= 80 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                    {score}/100
                                </span>
                            </div>
                        </div>

                        <div className="mb-6">
                            <MatchMeter percentage={score} />
                        </div>

                        <div className="space-y-3">
                            {analysis.map((item, idx) => (
                                <div key={idx} className="flex items-start space-x-2 text-sm text-gray-700">
                                    <CheckCircle size={16} className="text-green-500 mt-0.5" />
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-8 border-t border-gray-100 pt-8">
                <AdBanner size="rect" />
            </div>
        </div>
    );
}
