
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function AdminDashboard() {
    const [users, setUsers] = useState([]);
    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        try {
            const [usersResponse, formsResponse] = await Promise.all([
                supabase.from('profiles').select('*'),
                supabase.from('advising_records').select('*').order('created_at', { ascending: false })
            ]);

            if (usersResponse.error) throw usersResponse.error;
            if (formsResponse.error) throw formsResponse.error;

            setUsers(usersResponse.data);
            setForms(formsResponse.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const getUserName = (studentId) => {
        const user = users.find(u => u.id === studentId);
        return user ? `${user.first_name} ${user.last_name}` : 'Unknown Student';
    };

    return (
        <div className="dashboard-container">
            <h2>Admin Dashboard</h2>
            
            <section style={{ marginTop: '2rem' }}>
                <h3>Submitted Advising Forms</h3>
                {loading ? <p>Loading advising forms...</p> : (
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>Student Name</th>
                                <th>Term</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {forms.map(f => (
                                <tr key={f.id}>
                                    <td>
                                        <Link to={`/admin/review/${f.id}`} style={{ color: '#007aff', textDecoration: 'none', fontWeight: 'bold' }}>
                                            {getUserName(f.student_id)}
                                        </Link>
                                    </td>
                                    <td>{f.advising_term}</td>
                                    <td>
                                        <span className={`status-badge ${f.status.toLowerCase()}`}>
                                            {f.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>

            <section style={{ marginTop: '3rem' }}>
                <h3>Manage Users</h3>
                {loading ? <p>Loading users...</p> : (
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>Email/Username</th>
                                <th>Name</th>
                                <th>Role</th>
                                <th>UIN</th>
                                <th>2FA</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id}>
                                    <td>{u.username}</td>
                                    <td>{u.first_name} {u.last_name}</td>
                                    <td>{u.is_admin ? "Admin" : "Student"}</td>
                                    <td>{u.uin}</td>
                                    <td>{u.is_2fa_enabled ? "Yes" : "No"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>
        </div>
    );
}
