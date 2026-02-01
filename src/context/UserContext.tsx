
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

// SRS 3.3: User Profile Structure
export interface UserProfile {
    name: string;
    cgpa: number;
    city: string;
    major: string;
    year: string;
    resumeText?: string;
    resumeFileName?: string;
}

interface UserContextType {
    profile: UserProfile | null;
    saveProfile: (profile: UserProfile) => void;
    clearProfile: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [profile, setProfile] = useState<UserProfile | null>(null);

    // Load from localStorage on mount (Client-Side only)
    useEffect(() => {
        const stored = localStorage.getItem('insight_profile');
        if (stored) {
            try {
                setProfile(JSON.parse(stored));
            } catch (e) {
                console.error("Profile parse error", e);
            }
        }
    }, []);

    const saveProfile = (newProfile: UserProfile) => {
        setProfile(newProfile);
        localStorage.setItem('insight_profile', JSON.stringify(newProfile));
    };

    const clearProfile = () => {
        setProfile(null);
        localStorage.removeItem('insight_profile');
    };

    return (
        <UserContext.Provider value={{ profile, saveProfile, clearProfile }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
