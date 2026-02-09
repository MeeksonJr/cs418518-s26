import "./Signup.css";

export default function Field({ label, error, children }) {
  return (
    <div className="signup-group">
      <label className="signup-label">{label}</label>
      {children}
      {error && <div className="signup-error">{error}</div>}
    </div>
  );
}