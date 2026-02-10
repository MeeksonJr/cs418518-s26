
import { useState } from "react";
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

            // Successfully logged in, redirect to dashboard
            navigate("/dashboard");

        } catch (err) {
            console.error("Login error:", err);
            setMessage(err.message || "Failed to login.");
            setLoading(false);
        }
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
