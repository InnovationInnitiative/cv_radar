
'use client';

import React, { useState } from 'react';
import { useUser, UserProfile } from '../context/UserContext';
import { CITIES, MAJORS } from '../lib/constants';
import { X } from 'lucide-react';

export function UserProfileModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { profile, saveProfile } = useUser();
    const [formData, setFormData] = useState<UserProfile>(profile || {
        name: '',
        cgpa: 0,
        city: '',
        major: '',
        year: ''
    });

    // Update form data when profile changes or modal opens
    React.useEffect(() => {
        if (profile) {
            setFormData(profile);
        }
    }, [profile, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        saveProfile(formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md relative animate-in fade-in zoom-in duration-200">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <X size={24} />
                </button>
                <div className="mb-6">
                    <h2 className="text-2xl font-bold font-mono text-black">Auditor Profile</h2>
                    <p className="text-sm text-gray-500 mt-1">Add details to get better insights and personalized results.</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-black">Name</label>
                        <input
                            type="text"
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-black"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-black">CGPA (0-10)</label>
                            <input
                                type="number"
                                step="0.1"
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-black"
                                value={formData.cgpa}
                                onChange={e => setFormData({ ...formData, cgpa: parseFloat(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-black">Current Year</label>
                            <select
                                className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-black"
                                value={formData.year}
                                onChange={e => setFormData({ ...formData, year: e.target.value })}
                            >
                                <option value="">Select</option>
                                <option value="1">1st Year</option>
                                <option value="2">2nd Year</option>
                                <option value="3">3rd Year</option>
                                <option value="4">4th Year</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-black">Major / Branch</label>
                        <select
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-black"
                            value={formData.major}
                            onChange={e => setFormData({ ...formData, major: e.target.value })}
                        >
                            <option value="">Select Major</option>
                            {MAJORS.map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-black">Preferred City</label>
                        <select
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-black"
                            value={formData.city}
                            onChange={e => setFormData({ ...formData, city: e.target.value })}
                        >
                            <option value="">Select City</option>
                            {CITIES.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    {/* PDF Upload Removed for Vercel Build Stability */}

                    <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors">
                        Save Profile
                    </button>
                </form>
            </div>
        </div>
    );
}
