
export default function Field({ label, children, error }) {
    return (
        <div className="field-group">
            <label className="field-label" style={{ color: 'rgba(255,255,255,0.9)' }}>{label}</label>
            {children}
            {error && <span className="field-error" style={{ color: '#ff4d4f', textShadow: '0 0 10px rgba(255, 77, 79, 0.3)' }}>{error}</span>}
        </div>
    );
}
