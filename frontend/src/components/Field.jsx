export default function Field({ label, htmlFor, wide, children }) {
    return (
        <div className={`field${wide ? ' field-wide' : ''}`}>
            <label htmlFor={htmlFor}>{label}</label>
            {children}
        </div>
    );
}
