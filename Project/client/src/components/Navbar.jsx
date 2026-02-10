
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../App.css";

export default function Navbar() {
    const { user, signOut, isAdmin } = useAuth();
    const navigate = useNavigate();

    async function handleLogout() {
        await signOut();
        navigate("/login");
    }

    return (
        <nav className="navbar">
            <div className="nav-brand" style={{ letterSpacing: '-1px' }}>CS418 Project</div>
            <div className="nav-links">
                {!user ? (
                    <>
                        <Link to="/">Home</Link>
                        <Link to="/login">Login</Link>
                        <Link to="/register">Register</Link>
                    </>
                ) : (
                    <>
                        <Link to="/dashboard">Dashboard</Link>
                        {isAdmin && <Link to="/admin">Admin</Link>}
                        <button onClick={handleLogout} className="logout-btn">Logout</button>
                    </>
                )}
            </div>
        </nav>
    );
}
