"use client";
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [symbol, setSymbol] = useState('');

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (symbol.trim()) {
      router.push(`/stock/${symbol.toUpperCase()}`);
      setSymbol('');
    }
  };

  return (
    <nav className="bg-gray-800 p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-white text-2xl font-bold">
          Stratus
        </Link>

        {user && (
          <form onSubmit={handleSearch} className="flex-1 max-w-md mx-4">
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="Search Ticker (e.g., AAPL)"
              className="w-full p-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            />
          </form>
        )}

        <div>
          {user ? (
            <>
              <Link href="/dashboard" className="text-gray-300 hover:text-white mr-4">
                Dashboard
              </Link>
              <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition duration-300">
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-gray-300 hover:text-white mr-4">
                Login
              </Link>
              <Link href="/signup" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
