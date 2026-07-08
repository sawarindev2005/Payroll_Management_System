const API_URL = 'http://localhost:5000/api/employees';

const form = document.getElementById('employee-form');
const idField = document.getElementById('employee-id');
const nameField = document.getElementById('name');
const positionField = document.getElementById('position');
const baseSalaryField = document.getElementById('base_salary');
const bonusField = document.getElementById('bonus');
const deductionField = document.getElementById('deduction');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const tableBody = document.getElementById('employee-table-body');
const usernameDisplay = document.getElementById('username-display');
const logoutBtn = document.getElementById('logout-btn');

const USERS_API_URL = 'http://localhost:5000/api/users';
const accountModalOverlay = document.getElementById('account-modal-overlay');
const accountModalEmployeeName = document.getElementById('account-modal-employee-name');
const accountForm = document.getElementById('account-form');
const accountEmployeeIdField = document.getElementById('account-employee-id');
const accountUsernameField = document.getElementById('account-username');
const accountPasswordField = document.getElementById('account-password');
const accountCancelBtn = document.getElementById('account-cancel-btn');
const accountErrorMessage = document.getElementById('account-error-message');

async function fetchEmployees() {
    const res = await authFetch(API_URL);
    const employees = await res.json();
    renderTable(employees);
}

function renderTable(employees) {
    tableBody.innerHTML = '';
    employees.forEach((emp) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${emp.name}</td>
            <td>${emp.position}</td>
            <td>${Number(emp.base_salary).toFixed(2)}</td>
            <td>${Number(emp.bonus).toFixed(2)}</td>
            <td>${Number(emp.deduction).toFixed(2)}</td>
            <td>${Number(emp.net_salary).toFixed(2)}</td>
            <td>${
                emp.account_username
                    ? `<span class="username-badge">${emp.account_username}</span>
                       <button class="btn btn-danger btn-sm remove-account-btn" data-user-id="${emp.user_id}">ลบบัญชี</button>`
                    : `<button class="btn btn-edit btn-sm create-account-btn" data-id="${emp.id}" data-name="${emp.name}">สร้างบัญชี</button>`
            }</td>
            <td>
                <button class="btn btn-edit btn-sm edit-btn" data-id="${emp.id}">แก้ไข</button>
                <button class="btn btn-danger btn-sm delete-btn" data-id="${emp.id}">ลบ</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function resetForm() {
    form.reset();
    idField.value = '';
    submitBtn.textContent = 'เพิ่มพนักงาน';
    cancelBtn.style.display = 'none';
}

async function fillFormForEdit(id) {
    const res = await authFetch(`${API_URL}/${id}`);
    const emp = await res.json();
    idField.value = emp.id;
    nameField.value = emp.name;
    positionField.value = emp.position;
    baseSalaryField.value = emp.base_salary;
    bonusField.value = emp.bonus;
    deductionField.value = emp.deduction;
    submitBtn.textContent = 'บันทึกการแก้ไข';
    cancelBtn.style.display = 'inline-block';
}

async function handleSubmit(event) {
    event.preventDefault();

    const payload = {
        name: nameField.value,
        position: positionField.value,
        base_salary: parseFloat(baseSalaryField.value),
        bonus: parseFloat(bonusField.value) || 0,
        deduction: parseFloat(deductionField.value) || 0,
    };

    const id = idField.value;
    if (id) {
        await authFetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
    } else {
        await authFetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
    }

    resetForm();
    fetchEmployees();
}

async function handleDelete(id) {
    if (!confirm('ยืนยันการลบพนักงานคนนี้?')) return;
    await authFetch(`${API_URL}/${id}`, { method: 'DELETE' });
    fetchEmployees();
}

function openAccountModal(employeeId, employeeName) {
    accountForm.reset();
    accountErrorMessage.textContent = '';
    accountEmployeeIdField.value = employeeId;
    accountModalEmployeeName.textContent = employeeName;
    accountModalOverlay.style.display = 'flex';
}

function closeAccountModal() {
    accountModalOverlay.style.display = 'none';
}

async function handleAccountSubmit(event) {
    event.preventDefault();
    accountErrorMessage.textContent = '';

    const payload = {
        employee_id: accountEmployeeIdField.value,
        username: accountUsernameField.value,
        password: accountPasswordField.value,
    };

    const res = await authFetch(USERS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
        accountErrorMessage.textContent = data.message || 'สร้างบัญชีไม่สำเร็จ';
        return;
    }

    closeAccountModal();
    fetchEmployees();
}

async function handleRemoveAccount(userId) {
    if (!confirm('ยืนยันการลบบัญชี login นี้? พนักงานคนนี้จะ login เข้าระบบไม่ได้อีก')) return;
    await authFetch(`${USERS_API_URL}/${userId}`, { method: 'DELETE' });
    fetchEmployees();
}

form.addEventListener('submit', handleSubmit);
cancelBtn.addEventListener('click', resetForm);
logoutBtn.addEventListener('click', logout);
accountForm.addEventListener('submit', handleAccountSubmit);
accountCancelBtn.addEventListener('click', closeAccountModal);

tableBody.addEventListener('click', (event) => {
    const id = event.target.dataset.id;
    const userId = event.target.dataset.userId;

    if (event.target.classList.contains('edit-btn')) {
        fillFormForEdit(id);
    } else if (event.target.classList.contains('delete-btn')) {
        handleDelete(id);
    } else if (event.target.classList.contains('create-account-btn')) {
        openAccountModal(id, event.target.dataset.name);
    } else if (event.target.classList.contains('remove-account-btn')) {
        handleRemoveAccount(userId);
    }
});

const currentUser = requireRole('admin');
if (currentUser) {
    usernameDisplay.textContent = currentUser.username;
    fetchEmployees();
}
