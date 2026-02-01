'use client';
import React, { useState, useEffect } from 'react';
import { JobListing } from '@/lib/job-service';
import { Trash2, Plus, Save, Lock, Eye, EyeOff, ExternalLink } from 'lucide-react';

export default function AdminPage() {
    const [pass1, setPass1] = useState('');
    const [pass2, setPass2] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const [internships, setInternships] = useState<JobListing[]>([]);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');

    // Fetch initial data
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/internships');
            if (res.ok) {
                const data = await res.json();
                setInternships(data);
            }
        } catch (e) {
            console.error(e);
            setMsg('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // We fetch data even if not authenticated, but we can't save without passwords
        fetchData();
    }, []);

    const handleLogin = () => {
        if (pass1 === 'secret2026' && pass2 === 'adAGARAVAV@3308172425') {
            setIsAuthenticated(true);
            setMsg('');
        } else {
            setMsg('Invalid Credentials. Access Denied.');
        }
    };

    const handleAdd = () => {
        const newJob: JobListing = {
            id: `custom-${Date.now()}`,
            title: 'New Internship Role',
            company: 'Company Name',
            link: 'https://example.com',
            pubDate: new Date().toISOString(),
            source: 'Featured',
            snippet: 'Description of the role...',
        };
        setInternships([newJob, ...internships]);
    };

    const handleRemove = (id: string) => {
        if (!confirm('Are you sure you want to delete this listing?')) return;
        setInternships(internships.filter(j => j.id !== id));
    };

    const handleChange = (id: string, field: keyof JobListing, value: string) => {
        setInternships(internships.map(j =>
            j.id === id ? { ...j, [field]: value } : j
        ));
    };

    const handleSave = async () => {
        setLoading(true);
        setMsg('Saving...');
        try {
            const res = await fetch('/api/internships', {
                method: 'POST',
                body: JSON.stringify({
                    passwordOne: pass1,
                    passwordTwo: pass2,
                    internships
                })
            });

            if (res.ok) {
                setMsg('Saved successfully!');
                // Refresh to verify persistence if needed, but local state is fine
            } else {
                setMsg('Failed to save. Check passwords or connection.');
            }
        } catch (e) {
            setMsg('Error saving data.');
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
                <div className="max-w-md w-full bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700">
                    <div className="flex justify-center mb-6">
                        <div className="bg-red-500 p-4 rounded-full bg-opacity-10 text-red-500">
                            <Lock size={48} />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-center mb-2">Restricted Access</h1>
                    <p className="text-gray-400 text-center mb-8">Double-factor authentication required for database modification.</p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-mono text-gray-500 mb-1">SECURITY LAYER 1</label>
                            <input
                                type={showPass ? "text" : "password"}
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500 focus:outline-none"
                                placeholder="Password 1"
                                value={pass1}
                                onChange={e => setPass1(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-mono text-gray-500 mb-1">SECURITY LAYER 2</label>
                            <input
                                type={showPass ? "text" : "password"}
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500 focus:outline-none"
                                placeholder="Password 2"
                                value={pass2}
                                onChange={e => setPass2(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-400">
                            <button onClick={() => setShowPass(!showPass)} className="flex items-center gap-2 hover:text-white">
                                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                {showPass ? "Hide Keys" : "Show Keys"}
                            </button>
                        </div>

                        {msg && <div className="p-3 bg-red-900/30 text-red-200 rounded border border-red-900/50 text-sm text-center">{msg}</div>}

                        <button
                            onClick={handleLogin}
                            className="w-full bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-bold py-3 rounded-lg transition-all shadow-lg mt-4"
                        >
                            Access Mainframe
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10 px-6 py-4 flex justify-between items-center shadow-sm">
                <h1 className="text-xl font-bold font-mono text-gray-800 flex items-center gap-2">
                    <Lock size={20} className="text-red-500" />
                    ADMIN_OVERRIDE_MODE
                </h1>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500 font-mono hidden md:inline">Edits are live immediately</span>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center gap-2 bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 transition-colors disabled:opacity-50 font-medium"
                    >
                        <Save size={18} />
                        {loading ? 'Committing...' : 'Commit Changes'}
                    </button>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Manage Pinned Internships</h2>
                    <button
                        onClick={handleAdd}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                    >
                        <Plus size={18} /> Add New Listing
                    </button>
                </div>

                {msg && (
                    <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${msg.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {msg}
                    </div>
                )}

                <div className="space-y-6">
                    {internships.map((job) => (
                        <div key={job.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group hover:border-indigo-300 transition-colors">
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Company</label>
                                        <input
                                            type="text"
                                            value={job.company}
                                            onChange={(e) => handleChange(job.id, 'company', e.target.value)}
                                            className="w-full font-bold text-lg border-b border-gray-300 focus:border-indigo-600 focus:outline-none py-1 bg-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Role Title</label>
                                        <input
                                            type="text"
                                            value={job.title}
                                            onChange={(e) => handleChange(job.id, 'title', e.target.value)}
                                            className="w-full font-medium text-lg border-b border-gray-300 focus:border-indigo-600 focus:outline-none py-1 bg-transparent"
                                        />
                                    </div>
                                </div>

                                <div className="gap-4 mb-4">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Description / Snippet</label>
                                    <textarea
                                        value={job.snippet}
                                        onChange={(e) => handleChange(job.id, 'snippet', e.target.value)}
                                        className="w-full text-sm text-gray-600 border border-gray-200 rounded p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[80px]"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                                    <div className="md:col-span-10">
                                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Apply Link</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={job.link}
                                                onChange={(e) => handleChange(job.id, 'link', e.target.value)}
                                                className="w-full text-xs text-blue-600 font-mono bg-blue-50 border border-blue-100 rounded px-2 py-1 focus:outline-none"
                                            />
                                            <a href={job.link} target="_blank" rel="noreferrer" className="p-1 hover:bg-gray-100 rounded text-gray-400">
                                                <ExternalLink size={16} />
                                            </a>
                                        </div>
                                    </div>
                                    <div className="md:col-span-2 flex justify-end">
                                        <button
                                            onClick={() => handleRemove(job.id)}
                                            className="flex items-center gap-1 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-full transition text-xs font-bold uppercase tracking-wide opacity-80 group-hover:opacity-100"
                                        >
                                            <Trash2 size={14} /> Remove
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-6 py-2 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400 font-mono">
                                <span>ID: {job.id}</span>
                                <span>{new Date(job.pubDate).toLocaleString()}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-12 text-center">
                    <button onClick={handleAdd} className="text-indigo-600 font-medium hover:underline">
                        + Add one more position
                    </button>
                </div>
            </main>
        </div>
    );
}
