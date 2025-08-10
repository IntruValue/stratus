import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useState } from 'react';

/**
 * The main navigation bar for the application.
 * It displays different links based on the user's authentication status.
 * It also highlights the currently active page.
 */
export default function Navbar() {
    const { user } = useAuth();
    const router = useRouter();

    // State to manage the visibility of the user profile dropdown menu.
    const [profileOpen, setProfileOpen] = useState(false);

    /**
     * Handles the user sign-out process.
     * It signs the user out of Firebase and redirects them to the login page.
     */
    const handleSignOut = async () => {
        try {
            await signOut(auth);
            // After sign out, redirect to the login page for a clean user flow.
            router.push('/login');
        } catch (error) {
            console.error('Sign out error:', error);
            // Optionally, show an error message to the user.
        }
    };

    /**
     * A helper function to determine if a given navigation link is currently active.
     * @param {string} pathname - The path of the link to check (e.g., '/dashboard').
     * @returns {boolean} - True if the path is the current page, false otherwise.
     */
    const isActive = (pathname) => router.pathname === pathname;

    return (
        <nav className="bg-white shadow-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo - links to dashboard if logged in, otherwise to homepage */}
                    <Link href={user ? "/dashboard" : "/"}>
                        <a className="flex-shrink-0 flex items-center space-x-2 cursor-pointer">
                            <svg className="h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            <span className="text-2xl font-bold text-gray-900">Stratus Trading</span>
                        </a>
                    </Link>

                    {/* Authenticated User Links */}
                    {user && (
                        <div className="hidden md:flex items-center">
                            <div className="ml-10 flex items-baseline space-x-1">
                                <Link href="/dashboard">
                                    <a className={`${isActive('/dashboard') ? 'bg-gray-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100 hover:text-blue-600'} px-3 py-2 rounded-md text-sm font-medium`}>Dashboard</a>
                                </Link>
                                <Link href="/portfolio">
                                    <a className={`${isActive('/portfolio') ? 'bg-gray-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100 hover:text-blue-600'} px-3 py-2 rounded-md text-sm font-medium`}>Portfolio</a>
                                </Link>
                                <Link href="/autotrader">
                                    <a className={`${router.pathname.startsWith('/autotrader') ? 'bg-gray-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100 hover:text-blue-600'} px-3 py-2 rounded-md text-sm font-medium`}>Auto-Trader</a>
                                </Link>
                            </div>

                            {/* Profile Dropdown */}
                            <div className="ml-4 relative">
                                <div>
                                    <button onClick={() => setProfileOpen(!profileOpen)} className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                        <span className="sr-only">Open user menu</span>
                                        <img className="h-8 w-8 rounded-full" src="https://placehold.co/32x32/E0E7FF/4F46E5?text=U" alt="User avatar" />
                                    </button>
                                </div>
                                {profileOpen && (
                                    <div onMouseLeave={() => setProfileOpen(false)} className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                                        <Link href="/account-settings">
                                            <a className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Settings</a>
                                        </Link>
                                        <a href="#" onClick={handleSignOut} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Sign out</a>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Public Links for Logged-Out Users */}
                    {!user && (
                        <div className="hidden md:flex items-center space-x-4">
                            <Link href="/login"><a className="text-gray-600 hover:text-blue-600 font-medium">Log In</a></Link>
                            <Link href="/signup"><a className="bg-blue-600 text-white px-4 py-2 rounded-md shadow-sm hover:bg-blue-700 transition font-medium">Get Started Free</a></Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
