
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function AdminDashboard() {
    const [users, setUsers] = useState([]);
    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('forms');
    const [selectedUser, setSelectedUser] = useState(null);

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

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
    };

    return (
        <div className="admin-dashboard-container">
            <h2>Admin Dashboard</h2>
            
            <div className="admin-tabs">
                <button 
                    className={`admin-tab-btn ${activeTab === 'forms' ? 'active' : ''}`}
                    onClick={() => setActiveTab('forms')}
                >
                    Advising Forms
                </button>
                <button 
                    className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    Manage Users
                </button>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
                    <div className="spinner"></div>
                </div>
            ) : (
                <>
                    {activeTab === 'forms' && (
                        <div className="history-list" style={{ animation: 'fadeIn 0.5s ease' }}>
                            {forms.length === 0 ? (
                                <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>No forms submitted yet.</p>
                            ) : (
                                forms.map(f => (
                                    <Link 
                                        to={`/admin/review/${f.id}`} 
                                        key={f.id} 
                                        className="history-card"
                                    >
                                        <div className="card-info">
                                            <span className="card-term">{getUserName(f.student_id)}</span>
                                            <span className="card-date" style={{ color: 'rgba(255,255,255,0.7)' }}>{f.advising_term} &bull; Submitted: {formatDate(f.created_at)}</span>
                                        </div>
                                        <span className={`status-badge ${f.status.toLowerCase()}`}>
                                            {f.status}
                                        </span>
                                    </Link>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div className="users-grid" style={{ animation: 'fadeIn 0.5s ease' }}>
                            {users.length === 0 ? (
                                <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>No users found.</p>
                            ) : (
                                users.map(u => (
                                    <div 
                                        key={u.id} 
                                        className="user-card"
                                        onClick={() => setSelectedUser(u)}
                                    >
                                        <div className="user-card-header">
                                            <span className="user-card-name">{u.first_name} {u.last_name}</span>
                                            <span className={`user-card-role ${u.is_admin ? 'role-admin' : 'role-student'}`}>
                                                {u.is_admin ? 'Admin' : 'Student'}
                                            </span>
                                        </div>
                                        <div className="user-card-details">
                                            <span><strong>UIN:</strong> {u.uin}</span>
                                            <span><strong>Email:</strong> {u.username}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </>
            )}

            {/* User Details Modal */}
            {selectedUser && (
                <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setSelectedUser(null)}>×</button>
                        
                        <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'white' }}>User Details</h3>
                        
                        <div className="profile-edit-section" style={{ padding: 0, background: 'transparent', border: 'none' }}>
                            <div className="form-section">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h2 style={{ margin: 0, fontSize: '1.8rem' }}>{selectedUser.first_name} {selectedUser.last_name}</h2>
                                    <span className={`status-badge ${selectedUser.is_admin ? 'approved' : 'pending'}`}>
                                        {selectedUser.is_admin ? 'Administrator' : 'Student'}
                                    </span>
                                </div>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>
                                    <p style={{ margin: 0 }}><strong>Email/Username:</strong> {selectedUser.username}</p>
                                    <p style={{ margin: 0 }}><strong>University ID Number:</strong> {selectedUser.uin}</p>
                                    <p style={{ margin: 0 }}><strong>Account Created:</strong> {selectedUser.updated_at ? formatDate(selectedUser.updated_at) : 'N/A'}</p>
                                    
                                    <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(0,122,255,0.1)', borderRadius: '12px', border: '1px solid rgba(0,122,255,0.3)' }}>
                                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#007aff' }}>
                                            <strong>Note:</strong> Multi-Factor Authentication (MFA/2FA) is managed directly through Supabase Auth Settings and is active for this account according to security policies.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button 
                            className="cancel-btn" 
                            style={{ width: '100%', marginTop: '2rem' }}
                            onClick={() => setSelectedUser(null)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
