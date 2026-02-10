
import { Link } from "react-router-dom";

export default function Home() {
    return (
        <div className="home-container">
            <h1>Welcome to CS418 Project</h1>
            <p>Secure Student Advising System</p>

            <div className="cta-buttons">
                <Link to="/login" className="signup-btn">Login</Link>
                <Link to="/register" className="secondary-btn">Register</Link>
            </div>
        </div>
    );
}
