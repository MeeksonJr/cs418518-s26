
import { useState, useEffect } from "react";
import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import AdvisingForm from "./AdvisingForm";
import "../App.css";

const formatDate = (dateString) => {
    const date = new Date(dateString);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
};

export default function AdvisingHistory() {
    const { user } = useAuth();
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    const isNew = location.pathname === '/advising/new';
    const isEdit = !!id;
    const isSplit = isNew || isEdit;

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

    const handleFormSuccess = (isCancel = false) => {
        if (!isCancel) {
            fetchRecords(); // Refresh the list
        }
        navigate("/advising");
    };

    return (
        <div className={`advising-layout ${isSplit ? 'split-active' : ''}`}>
            
            {/* Master View: History List */}
            <div className="master-view">
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '2rem',
                    padding: '0 10px'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <h2 style={{ fontSize: isSplit ? '1.8rem' : '2.5rem', transition: 'font-size 0.6s' }}>
                            {isSplit ? "History" : "Course Advising"}
                        </h2>
                        {!isSplit && (
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', margin: 0 }}>
                                Manage your academic course plans
                            </p>
                        )}
                    </div>
                    {!isNew && (
                        <Link to="/advising/new" className="signup-btn" style={{
                            textDecoration: 'none',
                            width: 'auto',
                            padding: '10px 20px',
                            margin: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <span>+</span>
                            {isSplit ? "" : "New Record"}
                        </Link>
                    )}
                </div>

                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '50px 0' }}>
                        <div className="spinner"></div>
                    </div>
                ) : records.length === 0 ? (
                    <div className="empty-history" style={{ padding: '60px 20px' }}>
                        <div className="empty-history-icon" style={{ width: '80px', height: '80px' }}>📋</div>
                        <h3>No records found</h3>
                        <Link to="/advising/new" className="signup-btn" style={{ textDecoration: 'none', width: 'auto', marginTop: '1rem' }}>
                            Start New
                        </Link>
                    </div>
                ) : (
                    <div className="history-list">
                        {records.map(record => (
                            <Link 
                                to={`/advising/edit/${record.id}`} 
                                key={record.id} 
                                className={`history-card ${id === record.id ? 'active-card' : ''}`}
                                style={id === record.id ? { 
                                    background: 'rgba(0, 122, 255, 0.1)', 
                                    borderColor: 'rgba(0, 122, 255, 0.4)' 
                                } : {}}
                            >
                                <div className="card-info">
                                    <span className="card-date">{formatDate(record.created_at)}</span>
                                    <span className="card-term">{record.advising_term}</span>
                                </div>
                                <span className={`status-badge ${record.status.toLowerCase()}`}>
                                    {isSplit ? record.status.charAt(0) : record.status}
                                </span>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Detail View: Selection / Form */}
            <div className="detail-view">
                {isSplit ? (
                    <AdvisingForm 
                        key={id || 'new'}
                        embeddedId={id} 
                        onSuccess={handleFormSuccess} 
                    />
                ) : (
                    <div style={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        color: 'rgba(255,255,255,0.2)',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👈</div>
                        <p>Select a record or click "New Record" to begin</p>
                    </div>
                )}
            </div>
        </div>
    );
}
