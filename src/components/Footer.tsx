import Link from 'next/link';
import { Lock } from 'lucide-react';

export function Footer() {
    return (
        <footer className="bg-white border-t border-gray-200 mt-auto">
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">

                    <div className="text-center md:text-left">
                        <h3 className="text-lg font-bold text-black">InsightCareers</h3>
                        <p className="text-xs text-gray-500 mt-1">
                            The Transparency Engine. Built for students, by engineers.
                        </p>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-6 text-sm text-gray-600">
                        <Link href="/about" className="hover:text-black transition-colors">
                            About
                        </Link>
                        <Link href="#" className="hover:text-black transition-colors">
                            Privacy Policy
                        </Link>
                        <Link href="#" className="hover:text-black transition-colors">
                            Terms of Service
                        </Link>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400">
                    <p>© {new Date().getFullYear()} InsightCareers. All rights reserved.</p>

                    <Link
                        href="/secret-admin"
                        className="flex items-center gap-1 hover:text-gray-600 transition-colors opacity-50 hover:opacity-100"
                    >
                        <Lock size={12} />
                        <span>Admin</span>
                    </Link>
                </div>
            </div>
        </footer>
    );
}
