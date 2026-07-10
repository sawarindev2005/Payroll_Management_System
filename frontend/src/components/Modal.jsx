export default function Modal({ title, subtitle, children }) {
    return (
        <div className="modal-overlay">
            <div className="modal">
                <h2>{title}</h2>
                {subtitle && <p className="auth-subtitle">{subtitle}</p>}
                {children}
            </div>
        </div>
    );
}
