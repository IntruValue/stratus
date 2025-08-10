import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Redirect if user is already logged in
    if (!authLoading && user) {
        router.push('/dashboard');
        return null;
    }

    const submitForm = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push('/dashboard');
        } catch (err) {
            setError('Invalid email or password. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="bg-gray-50">
            <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    <div>
                        <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">
                            Sign in to your account
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-600">
                            Or{' '}
                            <Link href="/signup">
                                <a className="font-medium text-blue-600 hover:text-blue-500">create an account</a>
                            </Link>
                        </p>
                    </div>
                    <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10">
                        <form className="space-y-6" onSubmit={submitForm}>
                            {/* Email and Password Input fields go here, similar to signup.js */}
                            {/* ... */}
                            {error && <p className="text-sm text-red-600">{error}</p>}
                            <div>
                                <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 ...">
                                    {loading ? 'Signing in...' : 'Sign in'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}