
import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "../Signup.css";
import Field from "../components/Field";

export default function ResetPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    async function handleReset(e) {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            // Redirect to dashboard where they can change password
            const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: 'http://localhost:5173/dashboard', // Dev URL
            });

            if (error) throw error;
            setMessage("Password reset link sent to your email.");
        } catch (err) {
            setMessage(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-container">
            <form className="signup-form" onSubmit={handleReset}>
                <h3 className="signup-title">Reset Password</h3>
                {message && <div className={`message ${message.includes("sent") ? "success" : "error"}`}>{message}</div>}

                <Field label="Email">
                    <input
                        type="email"
                        className="signup-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                    />
                </Field>

                <button className="signup-btn" type="submit" disabled={loading}>
                    {loading ? "Sending..." : "Send Reset Link"}
                </button>

                <div className="auth-links">
                    <Link to="/login">Back to Login</Link>
                </div>
            </form>
        </div>
    );
}
