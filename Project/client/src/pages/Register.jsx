
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "../Signup.css"; // Reusing existing CSS for now
import Field from "../components/Field"; // Assume we move Field to components, or import from ../Field if we don't move it.

// For now, let's keep it simple and assume we might not have moved Field yet, but I should move it to components to be clean.
// Actually, I'll write Field.jsx into components in the next step or assume I'll do it now. 
// I'll inline the Field component or better, create it in components.
// Let's assume I will Create Field in components/Field.jsx first or concurrently.
// I'll stick to relative imports assuming I move it.

export default function Register() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        uin: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const [errors, setErrors] = useState({});

    function updateField(field, value) {
        setForm((prev) => ({ ...prev, [field]: value }));
        // Clear error
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
    }

    function validate() {
        const e = {};
        if (!form.firstName.trim()) e.firstName = "First name is required";
        if (!form.lastName.trim()) e.lastName = "Last name is required";
        if (!/^\d{8}$/.test(form.uin)) e.uin = "UIN must be 8 digits";
        if (!form.email.includes("@")) e.email = "Valid email required";
        if (form.password.length < 6) e.password = "Minimum 6 characters";
        if (form.password !== form.confirmPassword)
            e.confirmPassword = "Passwords do not match";
        return e;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const v = validate();
        setErrors(v);

        if (Object.keys(v).length === 0) {
            setLoading(true);
            setMessage("");

            try {
                const { data, error } = await supabase.auth.signUp({
                    email: form.email,
                    password: form.password,
                    options: {
                        data: {
                            first_name: form.firstName,
                            last_name: form.lastName,
                            uin: form.uin,
                            // role: 'user' // Default is user, admin set via backend
                        },
                    },
                });

                if (error) throw error;

                setMessage("Registration successful! Please check your email for the verification link.");
                // clear form?
            } catch (err) {
                console.error("Registration error:", err);
                setMessage(err.message || "Failed to register.");
            } finally {
                setLoading(false);
            }
        }
    }

    return (
        <div className="auth-container">
            <form className="signup-form" onSubmit={handleSubmit}>
                <h3 className="signup-title">Create Account</h3>

                {message && <div className={`message ${message.includes("successful") ? "success" : "error"}`}>{message}</div>}

                <Field label="First Name" error={errors.firstName}>
                    <input
                        className={`signup-input ${errors.firstName ? "error" : ""}`}
                        value={form.firstName}
                        onChange={(e) => updateField("firstName", e.target.value)}
                        disabled={loading}
                    />
                </Field>

                <Field label="Last Name" error={errors.lastName}>
                    <input
                        className={`signup-input ${errors.lastName ? "error" : ""}`}
                        value={form.lastName}
                        onChange={(e) => updateField("lastName", e.target.value)}
                        disabled={loading}
                    />
                </Field>

                <Field label="UIN" error={errors.uin}>
                    <input
                        className={`signup-input ${errors.uin ? "error" : ""}`}
                        value={form.uin}
                        onChange={(e) => updateField("uin", e.target.value)}
                        disabled={loading}
                    />
                </Field>

                <Field label="Email" error={errors.email}>
                    <input
                        type="email"
                        className={`signup-input ${errors.email ? "error" : ""}`}
                        value={form.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        disabled={loading}
                    />
                </Field>

                <Field label="Password" error={errors.password}>
                    <input
                        type="password"
                        className={`signup-input ${errors.password ? "error" : ""}`}
                        value={form.password}
                        onChange={(e) => updateField("password", e.target.value)}
                        disabled={loading}
                    />
                </Field>

                <Field label="Confirm Password" error={errors.confirmPassword}>
                    <input
                        type="password"
                        className={`signup-input ${errors.confirmPassword ? "error" : ""}`}
                        value={form.confirmPassword}
                        onChange={(e) => updateField("confirmPassword", e.target.value)}
                        disabled={loading}
                    />
                </Field>

                <button className="signup-btn" type="submit" disabled={loading}>
                    {loading ? "Registering..." : "Sign Up"}
                </button>

                <div className="auth-links">
                    Already have an account? <Link to="/login">Login</Link>
                </div>
            </form>
        </div>
    );
}
