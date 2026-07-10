import { createContext, useContext, useState, useCallback } from 'react';
import { getToken, getUser, saveSession, clearSession } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [token, setToken] = useState(getToken());
    const [user, setUser] = useState(getUser());

    const login = useCallback((newToken, newUser) => {
        saveSession(newToken, newUser);
        setToken(newToken);
        setUser(newUser);
    }, []);

    const logout = useCallback(() => {
        clearSession();
        setToken(null);
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ token, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
