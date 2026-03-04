
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "../Signup.css";
import Field from "../components/Field";

export default function ResetPassword() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [isRecovery, setIsRecovery] = useState(false);

    // New Password States
    const [passwordForm, setPasswordForm] = useState({
        newPassword: "",
        confirmPassword: "",
    });

    // MFA States
    const [showMFA, setShowMFA] = useState(false);
    const [mfaCode, setMfaCode] = useState("");

    useEffect(() => {
        // Check if we are in a recovery session (after clicking email link)
        async function checkSession() {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                // If there's a session, we might be in recovery mode
                // Check if the event was PASSWORD_RECOVERY
                setIsRecovery(true);

                // Check AAL level if MFA is enabled
                const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
                if (!aalError) {
                    if (aalData.nextLevel === 'aal2' && aalData.currentLevel !== 'aal2') {
                        setShowMFA(true);
                    }
                }
            }
        }
        checkSession();

        // Listen for auth state changes (especially RECOVERY)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === "PASSWORD_RECOVERY") {
                setIsRecovery(true);

                // Check AAL level
                const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
                if (aalData?.nextLevel === 'aal2' && aalData?.currentLevel !== 'aal2') {
                    setShowMFA(true);
                }
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    async function handleRequestReset(e) {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: 'http://localhost:5173/reset-password',
            });

            if (error) throw error;
            setMessage("Password reset link sent to your email.");
        } catch (err) {
            setMessage(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleUpdatePassword(e) {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setMessage("Passwords do not match");
            return;
        }
        if (passwordForm.newPassword.length < 6) {
            setMessage("Password must be at least 6 characters");
            return;
        }

        setLoading(true);
        setMessage("");

        try {
            const { error } = await supabase.auth.updateUser({
                password: passwordForm.newPassword,
            });

            if (error) throw error;
            setMessage("Password updated successfully! Redirecting...");
            setTimeout(() => navigate("/dashboard"), 2000);
        } catch (err) {
            setMessage(err.message);
        } finally {
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

            const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
                factorId: totpFactor.id,
                code: mfaCode,
            });

            if (verifyError) throw verifyError;

            // Success! Hide MFA and show password form
            setShowMFA(false);
            setMfaCode("");
        } catch (err) {
            setMessage(err.message);
        } finally {
            setLoading(false);
        }
    }

    // Rendering Logic
    if (showMFA) {
        return (
            <div className="auth-container">
                <form className="signup-form" onSubmit={handleMFAVerify}>
                    <h3 className="signup-title">Confirm Identity (2FA)</h3>
                    <p>MFA is enabled on your account. Please verify before resetting password.</p>
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
                </form>
            </div>
        );
    }

    if (isRecovery) {
        return (
            <div className="auth-container">
                <form className="signup-form" onSubmit={handleUpdatePassword}>
                    <h3 className="signup-title">New Password</h3>
                    <p>Please enter your new password below.</p>
                    {message && <div className={`message ${message.includes("success") ? "success" : "error"}`}>{message}</div>}

                    <Field label="New Password">
                        <input
                            type="password"
                            className="signup-input"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            required
                            disabled={loading}
                        />
                    </Field>
                    <Field label="Confirm New Password">
                        <input
                            type="password"
                            className="signup-input"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                            required
                            disabled={loading}
                        />
                    </Field>
                    <button className="signup-btn" type="submit" disabled={loading}>
                        {loading ? "Updating..." : "Update Password"}
                    </button>
                </form>
            </div>
        );
    }

    // Default: Request Reset Link
    return (
        <div className="auth-container">
            <form className="signup-form" onSubmit={handleRequestReset}>
                <h3 className="signup-title">Reset Password</h3>
                <p>Enter your email to receive a password reset link.</p>
                {message && <div className={`message ${message.includes("sent") ? "success" : "error"}`}>{message}</div>}

                <Field label="Email">
                    <input
                        type="email"
                        className="signup-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        required
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
