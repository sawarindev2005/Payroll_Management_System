export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const TOKEN_KEY = 'salary_app_token';
const USER_KEY = 'salary_app_user';

export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
}

export function saveSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

// fetch ที่แนบ JWT อัตโนมัติ และเด้งไป /login ถ้า token หมดอายุ/ไม่ถูกต้อง
export async function apiFetch(path, options = {}) {
    const res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            ...(options.headers || {}),
            Authorization: `Bearer ${getToken()}`,
        },
    });

    if (res.status === 401) {
        clearSession();
        window.location.href = '/login';
        throw new Error('Unauthorized');
    }

    return res;
}
