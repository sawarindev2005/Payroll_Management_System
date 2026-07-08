const LOGIN_API_URL = 'http://localhost:5000/api/auth/login';

const loginForm = document.getElementById('login-form');
const errorMessage = document.getElementById('error-message');

// ถ้า login ค้างอยู่แล้ว เด้งไปหน้าตัวเองเลยไม่ต้อง login ซ้ำ
(function redirectIfLoggedIn() {
    const user = getUser();
    if (user && getToken()) {
        window.location.href = user.role === 'admin' ? 'index.html' : 'salary.html';
    }
})();

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorMessage.textContent = '';

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const res = await fetch(LOGIN_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (!res.ok) {
        errorMessage.textContent = data.message || 'เข้าสู่ระบบไม่สำเร็จ';
        return;
    }

    saveSession(data.token, data.user);
    window.location.href = data.user.role === 'admin' ? 'index.html' : 'salary.html';
});
