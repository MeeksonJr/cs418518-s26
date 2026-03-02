
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import "../Signup.css";
import Field from "../components/Field";
import { QRCodeSVG } from "qrcode.react";

export default function Dashboard() {
    const { user, profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [profileMessage, setProfileMessage] = useState("");
    const [mfaMessage, setMfaMessage] = useState("");

    const [passwordForm, setPasswordForm] = useState({
        newPassword: "",
        confirmPassword: "",
    });

    const [profileForm, setProfileForm] = useState({
        first_name: "",
        last_name: "",
        uin: "",
    });

    // MFA States
    const [mfaFactors, setMfaFactors] = useState([]);
    const [enrollData, setEnrollData] = useState(null);
    const [mfaCode, setMfaCode] = useState("");

    // Initialize profile form when profile loads
    useEffect(() => {
        if (profile) {
            setProfileForm({
                first_name: profile.first_name || "",
                last_name: profile.last_name || "",
                uin: profile.uin || "",
            });
        }
        fetchMfaFactors();
    }, [profile]);

    async function fetchMfaFactors() {
        try {
            const { data, error } = await supabase.auth.mfa.listFactors();
            if (error) throw error;
            setMfaFactors(data.all || []);
        } catch (err) {
            console.error("Error fetching MFA factors:", err);
        }
    }

    async function startMfaEnroll() {
        setLoading(true);
        setMfaMessage("");
        try {
            // Check for existing unverified factors and remove them to avoid conflicts
            const { data: factors } = await supabase.auth.mfa.listFactors();
            const unverified = factors?.all?.filter(f => f.status === 'unverified') || [];

            for (const factor of unverified) {
                await supabase.auth.mfa.unenroll({ factorId: factor.id });
            }

            const { data, error } = await supabase.auth.mfa.enroll({
                factorType: 'totp',
                friendlyName: `Authenticator ${new Date().toLocaleDateString()}`
            });
            if (error) throw error;
            setEnrollData(data);
        } catch (err) {
            console.error("Enrollment error:", err);
            setMfaMessage(err.message || "Failed to start enrollment.");
        } finally {
            setLoading(false);
        }
    }

    async function verifyMfaEnroll(e) {
        e.preventDefault();
        setLoading(true);
        setMfaMessage("");
        try {
            const { error } = await supabase.auth.mfa.challengeAndVerify({
                factorId: enrollData.id,
                code: mfaCode
            });
            if (error) throw error;

            // Update profile to mark 2FA as enabled
            await supabase.from('profiles').update({ is_2fa_enabled: true }).eq('id', user.id);

            setMfaMessage("2FA enrolled successfully!");
            setEnrollData(null);
            setMfaCode("");
            fetchMfaFactors();
        } catch (err) {
            setMfaMessage(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function unenrollMfa(factorId) {
        if (!confirm("Are you sure you want to disable 2FA?")) return;
        setLoading(true);
        try {
            const { error } = await supabase.auth.mfa.unenroll({ factorId });
            if (error) throw error;

            // Update profile
            await supabase.from('profiles').update({ is_2fa_enabled: false }).eq('id', user.id);

            setMfaMessage("2FA disabled.");
            fetchMfaFactors();
        } catch (err) {
            setMfaMessage(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handlePasswordChange(e) {
        e.preventDefault();
        // ... (existing password change logic remains the same)
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
            setMessage("Password updated successfully!");
            setPasswordForm({ newPassword: "", confirmPassword: "" });
        } catch (err) {
            setMessage(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleProfileUpdate(e) {
        e.preventDefault();
        setLoading(true);
        setProfileMessage("");

        // Validate UIN
        if (profileForm.uin.length !== 8 || !/^\d{8}$/.test(profileForm.uin)) {
            setProfileMessage("UIN must be exactly 8 digits");
            setLoading(false);
            return;
        }

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    first_name: profileForm.first_name,
                    last_name: profileForm.last_name,
                    uin: profileForm.uin,
                })
                .eq('id', user.id);

            if (error) throw error;
            setProfileMessage("Profile updated successfully!");

            // Refresh page to show updated info
            window.location.reload();
        } catch (err) {
            setProfileMessage(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="dashboard-container">
            <h2>Welcome, {profile?.first_name || user?.email}</h2>

            <div className="profile-section">
                <h3>Profile Information</h3>
                <p><strong>Email:</strong> {user?.email} <em>(cannot be changed)</em></p>
                <p><strong>Name:</strong> {profile?.first_name} {profile?.last_name}</p>
                <p><strong>UIN:</strong> {profile?.uin}</p>
                <p><strong>Account Status:</strong> {profile?.is_admin ? "Admin" : "Student"}</p>
            </div>

            <div className="mfa-section">
                <h3>2-Factor Authentication (MFA)</h3>
                {mfaMessage && <div className={`message ${mfaMessage.includes("success") ? "success" : "error"}`}>{mfaMessage}</div>}

                {mfaFactors.filter(f => f.status === 'verified').length > 0 ? (
                    <div>
                        <p className="success-text">✓ 2FA is active on your account.</p>
                        <ul>
                            {mfaFactors.map(factor => (
                                <li key={factor.id}>
                                    Type: {factor.factor_type} (Status: {factor.status})
                                    <button onClick={() => unenrollMfa(factor.id)} className="unenroll-btn" disabled={loading}>
                                        Disable 2FA
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <div>
                        <p>Protect your account with an Authenticator App (Google Authenticator, Duo, etc.)</p>
                        {!enrollData ? (
                            <div>
                                {mfaFactors.some(f => f.status === 'unverified') && (
                                    <p className="warning-text">You have an unverified 2FA setup. Please enable it again to finalize.</p>
                                )}
                                <button onClick={startMfaEnroll} className="signup-btn" disabled={loading}>
                                    Set Up 2FA
                                </button>
                            </div>
                        ) : (
                            <div className="mfa-enrollment">
                                <p>1. Scan this QR code with your authenticator app:</p>
                                {enrollData?.totp?.uri ? (
                                    <div style={{ background: 'white', padding: '10px', display: 'inline-block' }}>
                                        <QRCodeSVG value={enrollData.totp.uri} size={200} />
                                    </div>
                                ) : (
                                    <p className="error-text">QR code data not available. Please try again.</p>
                                )}
                                <p>Or enter manually: <code>{enrollData?.totp?.secret || "N/A"}</code></p>

                                <p>2. Enter the 6-digit code from your app:</p>
                                <form onSubmit={verifyMfaEnroll}>
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
                                    <button type="submit" className="signup-btn" disabled={loading}>
                                        Verify & Activate
                                    </button>
                                    <button type="button" onClick={() => setEnrollData(null)} className="cancel-btn">
                                        Cancel
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="profile-edit-section">
                <h3>Edit Profile</h3>
                {profileMessage && <div className={`message ${profileMessage.includes("success") ? "success" : "error"}`}>{profileMessage}</div>}
                <form onSubmit={handleProfileUpdate}>
                    <Field label="First Name">
                        <input
                            type="text"
                            className="signup-input"
                            value={profileForm.first_name}
                            onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                            required
                        />
                    </Field>
                    <Field label="Last Name">
                        <input
                            type="text"
                            className="signup-input"
                            value={profileForm.last_name}
                            onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                            required
                        />
                    </Field>
                    <Field label="UIN (8 digits)">
                        <input
                            type="text"
                            className="signup-input"
                            value={profileForm.uin}
                            onChange={(e) => setProfileForm({ ...profileForm, uin: e.target.value })}
                            maxLength={8}
                            pattern="\d{8}"
                            required
                        />
                    </Field>
                    <button className="signup-btn" type="submit" disabled={loading}>
                        Update Profile
                    </button>
                </form>
            </div>

            <div className="password-section">
                <h3>Change Password</h3>
                {message && <div className={`message ${message.includes("success") ? "success" : "error"}`}>{message}</div>}
                <form onSubmit={handlePasswordChange}>
                    <Field label="New Password">
                        <input
                            type="password"
                            className="signup-input"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            required
                        />
                    </Field>
                    <Field label="Confirm New Password">
                        <input
                            type="password"
                            className="signup-input"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                            required
                        />
                    </Field>
                    <button className="signup-btn" type="submit" disabled={loading}>
                        Update Password
                    </button>
                </form>
            </div>
        </div>
    );
}
