import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import EmployeesPage from './pages/EmployeesPage';
import PayrollPage from './pages/PayrollPage';
import RequestsPage from './pages/RequestsPage';
import SalaryOverviewPage from './pages/SalaryOverviewPage';
import SalaryHistoryPage from './pages/SalaryHistoryPage';
import SalaryRequestsPage from './pages/SalaryRequestsPage';

export default function App() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route
                path="/"
                element={
                    <ProtectedRoute role="admin">
                        <EmployeesPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/payroll/:employeeId"
                element={
                    <ProtectedRoute role="admin">
                        <PayrollPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/requests"
                element={
                    <ProtectedRoute role="admin">
                        <RequestsPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/salary"
                element={
                    <ProtectedRoute role="employee">
                        <SalaryOverviewPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/salary/history"
                element={
                    <ProtectedRoute role="employee">
                        <SalaryHistoryPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/salary/requests"
                element={
                    <ProtectedRoute role="employee">
                        <SalaryRequestsPage />
                    </ProtectedRoute>
                }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
