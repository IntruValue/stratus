"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './context/AuthContext';

export default function Home() {
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (user) {
            router.push('/dashboard');
        } else {
            router.push('/login');
        }
    }, [user, router]);

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
            <h1 className="text-white text-3xl">Loading...</h1>
        </div>
    );
}
