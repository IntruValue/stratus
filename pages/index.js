// pages/index.js
// This file's logic is now correct. It will always be rendered inside the
// AuthProvider, allowing useAuth() to work properly.

import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // This effect will run when the auth state changes.
  // If a user is logged in, it redirects them to their dashboard.
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // While checking for a user session, or if a user is found (and we are redirecting),
  // show a full-page loader to prevent a flash of the homepage content.
  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // If loading is complete and there is no user, render the public landing page.
  return (
    <div className="bg-white">
      <section className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight">
            Smarter Investing, <span className="text-blue-600">Automated.</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600">
            Unlock institutional-grade financial analysis and powerful auto-trading tools. Make data-driven decisions and execute your strategy seamlessly.
          </p>
          <div className="mt-8 flex justify-center space-x-4">
            <Link href="/login">
              <a className="text-gray-600 hover:text-blue-600 font-medium px-8 py-3 rounded-md">Log In</a>
            </Link>
            <Link href="/signup">
              <a className="bg-blue-600 text-white px-8 py-3 rounded-md text-lg font-medium shadow-lg hover:bg-blue-700 transition">
                Start Your Free Trial
              </a>
            </Link>
          </div>
        </div>
      </section>
      <footer className="bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <p className="text-base text-gray-400 text-center">&copy; 2025 Stratus Trading. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}