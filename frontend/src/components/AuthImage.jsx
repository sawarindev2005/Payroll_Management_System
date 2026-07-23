import { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';

// <img> ธรรมดาแนบ JWT header ไม่ได้ จึงต้อง fetch ผ่าน apiFetch แล้วแปลงเป็น blob URL แทน
export default function AuthImage({ path, alt, className }) {
    const [src, setSrc] = useState(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        let objectUrl;
        let cancelled = false;
        setSrc(null);
        setError(false);

        apiFetch(path)
            .then((res) => {
                if (!res.ok) throw new Error('load failed');
                return res.blob();
            })
            .then((blob) => {
                if (cancelled) return;
                objectUrl = URL.createObjectURL(blob);
                setSrc(objectUrl);
            })
            .catch(() => {
                if (!cancelled) setError(true);
            });

        return () => {
            cancelled = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [path]);

    if (error) return <span className="error-text">โหลดรูปไม่สำเร็จ</span>;
    if (!src) return <span>กำลังโหลดรูป...</span>;

    return (
        <a href={src} target="_blank" rel="noopener noreferrer">
            <img src={src} alt={alt} className={className} />
        </a>
    );
}
