const ME_API_URL = 'http://localhost:5000/api/employees/me';

const salaryCard = document.getElementById('salary-card');
const usernameDisplay = document.getElementById('username-display');
const logoutBtn = document.getElementById('logout-btn');

function formatBaht(amount) {
    return Number(amount).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function loadMySalary() {
    const user = requireRole('employee');
    if (!user) return;

    usernameDisplay.textContent = user.username;

    const res = await authFetch(ME_API_URL);
    if (!res.ok) {
        salaryCard.innerHTML = '<p class="error-text">ไม่พบข้อมูลเงินเดือนของคุณ</p>';
        return;
    }

    const emp = await res.json();

    salaryCard.innerHTML = `
        <div class="salary-row">
            <span>ชื่อพนักงาน</span>
            <strong>${emp.name}</strong>
        </div>
        <div class="salary-row">
            <span>ตำแหน่ง</span>
            <strong>${emp.position}</strong>
        </div>
        <div class="salary-row">
            <span>เงินเดือนฐาน</span>
            <strong>${formatBaht(emp.base_salary)} บาท</strong>
        </div>
        <div class="salary-row">
            <span>โบนัส/เงินเพิ่ม</span>
            <strong class="text-positive">+${formatBaht(emp.bonus)} บาท</strong>
        </div>
        <div class="salary-row">
            <span>รายการหัก</span>
            <strong class="text-negative">-${formatBaht(emp.deduction)} บาท</strong>
        </div>
        <div class="salary-row salary-net">
            <span>เงินเดือนสุทธิ</span>
            <strong>${formatBaht(emp.net_salary)} บาท</strong>
        </div>
    `;
}

logoutBtn.addEventListener('click', logout);

loadMySalary();
