
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import "../App.css";

export default function AdvisingHistory() {
    const { user } = useAuth();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchRecords();
        }
    }, [user]);

    async function fetchRecords() {
        try {
            const { data, error } = await supabase
                .from('advising_records')
                .select('*')
                .eq('student_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRecords(data || []);
        } catch (err) {
            console.error("Error fetching records:", err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="dashboard-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Course Advising History</h2>
                <Link to="/advising/new" className="signup-btn" style={{ textDecoration: 'none', width: 'auto', padding: '10px 20px' }}>
                    New Advising Record
                </Link>
            </div>

            {loading ? (
                <p>Loading records...</p>
            ) : records.length === 0 ? (
                <div className="profile-section">
                    <p>No advising records found.</p>
                </div>
            ) : (
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Term</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {records.map(record => (
                            <tr key={record.id}>
                                <td>
                                    <Link to={`/advising/edit/${record.id}`}>
                                        {new Date(record.created_at).toLocaleDateString()}
                                    </Link>
                                </td>
                                <td>{record.advising_term}</td>
                                <td>
                                    <span className={`status-badge ${record.status.toLowerCase()}`}>
                                        {record.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
