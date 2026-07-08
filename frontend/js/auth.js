const TOKEN_KEY = 'salary_app_token';
const USER_KEY = 'salary_app_user';

function saveSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function getUser() {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
}

function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

function logout() {
    clearSession();
    window.location.href = 'login.html';
}

// เรียกตอนโหลดหน้า: ถ้ายังไม่ login หรือ role ไม่ตรง จะเด้งไปหน้าที่ถูกต้องให้เอง
function requireRole(role) {
    const token = getToken();
    const user = getUser();

    if (!token || !user) {
        window.location.href = 'login.html';
        return null;
    }

    if (role && user.role !== role) {
        window.location.href = user.role === 'admin' ? 'index.html' : 'salary.html';
        return null;
    }

    return user;
}

// fetch ที่แนบ token อัตโนมัติ และเด้งไป login ถ้า token หมดอายุ/ไม่ถูกต้อง
async function authFetch(url, options = {}) {
    const res = await fetch(url, {
        ...options,
        headers: {
            ...(options.headers || {}),
            Authorization: `Bearer ${getToken()}`,
        },
    });

    if (res.status === 401) {
        clearSession();
        window.location.href = 'login.html';
        throw new Error('Unauthorized');
    }

    return res;
}
