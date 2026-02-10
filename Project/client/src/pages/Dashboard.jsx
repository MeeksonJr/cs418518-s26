
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import "../Signup.css";
import Field from "../components/Field";

export default function Dashboard() {
    const { user, profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [passwordForm, setPasswordForm] = useState({
        newPassword: "",
        confirmPassword: "",
    });

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

    return (
        <div className="dashboard-container">
            <h2>Welcome, {profile?.first_name || user?.email}</h2>

            <div className="profile-section">
                <h3>Profile Information</h3>
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Name:</strong> {profile?.first_name} {profile?.last_name}</p>
                <p><strong>UIN:</strong> {profile?.uin}</p>
                <p><strong>Account Status:</strong> {profile?.is_admin ? "Admin" : "Student"}</p>
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
