
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function AdminDashboard() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    async function fetchUsers() {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*');

            if (error) throw error;
            setUsers(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="dashboard-container">
            <h2>Admin Dashboard</h2>
            <p>Manage Users and Advising Sheets (Upcoming)</p>

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
        </div>
    );
}
