
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import "../Signup.css";
import Field from "../components/Field";

export default function Dashboard() {
    const { user, profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [profileMessage, setProfileMessage] = useState("");

    const [passwordForm, setPasswordForm] = useState({
        newPassword: "",
        confirmPassword: "",
    });

    const [profileForm, setProfileForm] = useState({
        first_name: "",
        last_name: "",
        uin: "",
    });

    // Initialize profile form when profile loads
    useEffect(() => {
        if (profile) {
            setProfileForm({
                first_name: profile.first_name || "",
                last_name: profile.last_name || "",
                uin: profile.uin || "",
            });
        }
    }, [profile]);

    async function handlePasswordChange(e) {
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
