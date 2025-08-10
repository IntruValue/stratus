// context/AuthContext.js
// This file has been corrected to ensure the AuthContext.Provider always wraps the application.

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebaseClient';

// Create the context with a default value.
// This ensures that `useAuth` never returns `undefined`.
const AuthContext = createContext({
    user: null,
    loading: true,
});

/**
 * The AuthProvider component manages and provides the authentication state.
 */
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Listen for changes in Firebase auth state
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        // Cleanup the listener when the component unmounts
        return () => unsubscribe();
    }, []); // Empty array ensures this runs only once

    const value = { user, loading };

    // The Provider is now the top-level component returned, which makes the context
    // always available to all children, regardless of the loading state.
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook to easily consume the AuthContext in other components.
 */
export const useAuth = () => {
    return useContext(AuthContext);
};