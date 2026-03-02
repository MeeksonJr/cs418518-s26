import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "../Signup.css";
import Field from "../components/Field";

export default function Login() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const [form, setForm] = useState({
        email: "",
        password: "",
    });

    // MFA States
    const [showMFA, setShowMFA] = useState(false);
    const [mfaCode, setMfaCode] = useState("");

    useEffect(() => {
        async function checkMFAProgress() {
            const { data: aalData, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
            if (error) return;

            if (aalData.nextLevel === 'aal2' && aalData.currentLevel !== 'aal2') {
                setShowMFA(true);
            } else if (aalData.currentLevel === 'aal2') {
                navigate("/dashboard");
            }
        }
        checkMFAProgress();
    }, [navigate]);

    async function handleLogin(e) {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: form.email,
                password: form.password,
            });

            if (error) {
                if (error.message === "Email not confirmed") {
                    throw new Error("Please verify your email before logging in.");
                }
                throw error;
            }

            // Check Authenticator Assurance Level (AAL)
            const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
            if (aalError) throw aalError;

            if (aalData.nextLevel === 'aal2' && aalData.currentLevel !== 'aal2') {
                setShowMFA(true);
                setLoading(false);
                return;
            }

            // Successfully logged in (either AAL1 is enough or already AAL2)
            navigate("/dashboard");

        } catch (err) {
            console.error("Login error:", err);
            setMessage(err.message || "Failed to login.");
            setLoading(false);
        }
    }

    async function handleMFAVerify(e) {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const { data: listData, error: factorsError } = await supabase.auth.mfa.listFactors();
            if (factorsError) throw factorsError;

            const factors = listData?.all || [];
            const totpFactor = factors.find(f => f.factor_type === 'totp' && f.status === 'verified');
            if (!totpFactor) throw new Error("No verified TOTP factor found.");

            const { data: verifyData, error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
                factorId: totpFactor.id,
                code: mfaCode,
            });

            if (verifyError) throw verifyError;

            // Successfully verified MFA
            navigate("/dashboard");
        } catch (err) {
            setMessage(err.message);
        } finally {
            setLoading(false);
        }
    }

    if (showMFA) {
        return (
            <div className="auth-container">
                <form className="signup-form" onSubmit={handleMFAVerify}>
                    <h3 className="signup-title">Two-Factor Authentication</h3>
                    <p>Please enter the 6-digit code from your authenticator app.</p>

                    {message && <div className="message error">{message}</div>}

                    <Field label="Verification Code">
                        <input
                            type="text"
                            className="signup-input"
                            value={mfaCode}
                            onChange={(e) => setMfaCode(e.target.value)}
                            placeholder="000000"
                            maxLength={6}
                            required
                        />
                    </Field>

                    <button className="signup-btn" type="submit" disabled={loading}>
                        {loading ? "Verifying..." : "Verify Code"}
                    </button>

                    <div className="auth-links">
                        <button type="button" onClick={() => setShowMFA(false)} className="cancel-btn">
                            Back to Login
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <form className="signup-form" onSubmit={handleLogin}>
                <h3 className="signup-title">Login</h3>
                {message && <div className={`message ${message.includes("verify") ? "warning" : "error"}`}>{message}</div>}

                <Field label="Email">
                    <input
                        type="email"
                        className="signup-input"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        disabled={loading}
                        required
                    />
                </Field>

                <Field label="Password">
                    <input
                        type="password"
                        className="signup-input"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        disabled={loading}
                        required
                    />
                </Field>

                <button className="signup-btn" type="submit" disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                </button>

                <div className="auth-links">
                    <Link to="/register">Create an account</Link> | <Link to="/reset-password">Forgot Password?</Link>
                </div>
            </form>
        </div>
    );
}
