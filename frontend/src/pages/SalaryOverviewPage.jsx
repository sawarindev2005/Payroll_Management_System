import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api/client';
import Topbar from '../components/Topbar';
import BottomNav from '../components/BottomNav';
import { formatBaht } from './SalaryRecordCard';

function isThisMonth(dateString) {
    if (!dateString) return false;
    const d = new Date(dateString);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

export default function SalaryOverviewPage() {
    const [me, setMe] = useState(null);
    const [current, setCurrent] = useState(null);
    const [advancesThisMonth, setAdvancesThisMonth] = useState(0);
    const [error, setError] = useState('');

    useEffect(() => {
        async function load() {
            const [meRes, historyRes, requestsRes] = await Promise.all([
                apiFetch('/employees/me'),
                apiFetch('/salary-records/me'),
                apiFetch('/claim-requests/me'),
            ]);

            if (!meRes.ok) {
                setError('ไม่พบข้อมูลเงินเดือนของคุณ');
                return;
            }
            setMe(await meRes.json());

            if (historyRes.ok) {
                const history = await historyRes.json();
                const now = new Date();
                setCurrent(
                    history.find(
                        (r) => r.period_year === now.getFullYear() && r.period_month === now.getMonth() + 1
                    ) || null
                );
            }

            if (requestsRes.ok) {
                const requests = await requestsRes.json();
                const total = requests
                    .filter((r) => r.type === 'advance' && r.status === 'approved' && isThisMonth(r.reviewed_at))
                    .reduce((sum, r) => sum + Number(r.amount), 0);
                setAdvancesThisMonth(total);
            }
        }
        load();
    }, []);

    return (
        <div className="page-content">
            <Topbar
                title="เงินเดือนของฉัน"
                navLinks={
                    <>
                        <Link to="/salary/history" className="btn btn-outline">
                            ประวัติเงินเดือน
                        </Link>
                        <Link to="/salary/requests" className="btn btn-outline">
                            เบิกเงิน
                        </Link>
                    </>
                }
            />

            <div className="salary-card">
                {error ? (
                    <p className="error-text">{error}</p>
                ) : !me || !current ? (
                    <p>กำลังโหลดข้อมูล...</p>
                ) : (
                    <>
                        <div className="salary-row">
                            <span>ชื่อพนักงาน</span>
                            <strong>{me.name}</strong>
                        </div>
                        <div className="salary-row">
                            <span>ตำแหน่ง</span>
                            <strong>{me.position}</strong>
                        </div>
                        <div className="salary-row">
                            <span>เงินเดือนฐาน</span>
                            <strong>{formatBaht(current.base_salary)} บาท</strong>
                        </div>
                        <div className="salary-row">
                            <span>โบนัส/เงินเพิ่ม</span>
                            <strong className="text-positive">+{formatBaht(current.bonus)} บาท</strong>
                        </div>
                        {advancesThisMonth > 0 ? (
                            <>
                                <div className="salary-row">
                                    <span>หักอื่นๆ</span>
                                    <strong className="text-negative">
                                        -{formatBaht(Math.max(Number(current.deduction) - advancesThisMonth, 0))} บาท
                                    </strong>
                                </div>
                                <div className="salary-row">
                                    <span>เบิกล่วงหน้าที่อนุมัติแล้ว (เดือนนี้)</span>
                                    <strong className="text-negative">-{formatBaht(advancesThisMonth)} บาท</strong>
                                </div>
                            </>
                        ) : (
                            <div className="salary-row">
                                <span>รายการหัก</span>
                                <strong className="text-negative">-{formatBaht(current.deduction)} บาท</strong>
                            </div>
                        )}
                        <div className="salary-row salary-net">
                            <span>เงินเดือนสุทธิ</span>
                            <strong>{formatBaht(current.net_salary)} บาท</strong>
                        </div>
                    </>
                )}
            </div>

            <BottomNav />
        </div>
    );
}
