import { useState } from "react";
import Field from "./Field";
import "./Signup.css";

export default function Signup({ onRegister }) {
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
  }

  function validate() {
    const e = {};
    if (!form.firstName.trim()) e.firstName = "First name is required";
    if (!form.lastName.trim()) e.lastName = "Last name is required";
    if (!/^\d{9}$/.test(form.uin)) e.uin = "UIN must be 9 digits";
    if (!form.email.includes("@")) e.email = "Valid email required";
    if (form.password.length < 6) e.password = "Minimum 6 characters";
    if (form.password !== form.confirmPassword)
      e.confirmPassword = "Passwords do not match";
    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const v = validate();
    setErrors(v);

    if (Object.keys(v).length === 0) {
      onRegister({
        firstName: form.firstName,
        lastName: form.lastName,
        uin: form.uin,
        email: form.email.toLowerCase(),
      });

      
    }
  }

  return (
    <form className="signup-form" onSubmit={handleSubmit}>
      <h3 className="signup-title">Create Account</h3>

      <Field label="First Name" error={errors.firstName}>
        <input
          className={`signup-input ${errors.firstName ? "error" : ""}`}
          value={form.firstName}
          onChange={(e) => updateField("firstName", e.target.value)}
        />
      </Field>

      <Field label="Last Name" error={errors.lastName}>
        <input
          className={`signup-input ${errors.lastName ? "error" : ""}`}
          value={form.lastName}
          onChange={(e) => updateField("lastName", e.target.value)}
        />
      </Field>

      <Field label="UIN" error={errors.uin}>
        <input
          className={`signup-input ${errors.uin ? "error" : ""}`}
          value={form.uin}
          onChange={(e) => updateField("uin", e.target.value)}
        />
      </Field>

      <Field label="Email" error={errors.email}>
        <input
          className={`signup-input ${errors.email ? "error" : ""}`}
          value={form.email}
          onChange={(e) => updateField("email", e.target.value)}
        />
      </Field>

      <Field label="Password" error={errors.password}>
        <input
          type="password"
          className={`signup-input ${errors.password ? "error" : ""}`}
          value={form.password}
          onChange={(e) => updateField("password", e.target.value)}
        />
      </Field>

      <Field label="Confirm Password" error={errors.confirmPassword}>
        <input
          type="password"
          className={`signup-input ${errors.confirmPassword ? "error" : ""}`}
          value={form.confirmPassword}
          onChange={(e) => updateField("confirmPassword", e.target.value)}
        />
      </Field>

      <button className="signup-btn" type="submit">
        Sign Up
      </button>
    </form>
  );
}


