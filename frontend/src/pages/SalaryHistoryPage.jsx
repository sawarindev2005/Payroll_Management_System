import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api/client';
import Topbar from '../components/Topbar';
import BottomNav from '../components/BottomNav';
import SalaryRecordCard from './SalaryRecordCard';

export default function SalaryHistoryPage() {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        async function loadSalaryHistory() {
            const res = await apiFetch('/salary-records/me');
            if (res.ok) setHistory(await res.json());
        }
        loadSalaryHistory();
    }, []);

    return (
        <div className="page-content">
            <Topbar
                title="ประวัติเงินเดือน"
                navLinks={
                    <>
                        <Link to="/salary" className="btn btn-outline">
                            เงินเดือนของฉัน
                        </Link>
                        <Link to="/salary/requests" className="btn btn-outline">
                            เบิกเงิน
                        </Link>
                    </>
                }
            />

            {history.length === 0 ? (
                <p className="empty-state">ยังไม่มีประวัติเงินเดือน</p>
            ) : (
                <div className="card-list">
                    {history.map((rec) => (
                        <SalaryRecordCard key={rec.id} record={rec} />
                    ))}
                </div>
            )}

            <BottomNav />
        </div>
    );
}
