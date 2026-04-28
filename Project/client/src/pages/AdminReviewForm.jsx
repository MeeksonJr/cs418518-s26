import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import Field from "../components/Field";
import "../App.css";

export default function AdminReviewForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [feedback, setFeedback] = useState("");

    const [record, setRecord] = useState(null);
    const [student, setStudent] = useState(null);
    const [courses, setCourses] = useState([]);

    useEffect(() => {
        fetchData();
    }, [id]);

    async function fetchData() {
        try {
            // 1. Fetch advising record
            const { data: recordData, error: recordError } = await supabase
                .from('advising_records')
                .select('*')
                .eq('id', id)
                .single();
            if (recordError) throw recordError;
            setRecord(recordData);

            // 2. Fetch student profile
            const { data: studentData, error: studentError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', recordData.student_id)
                .single();
            if (studentError) throw studentError;
            setStudent(studentData);

            // 3. Fetch courses
            const { data: coursesData, error: coursesError } = await supabase
                .from('advising_courses')
                .select('*')
                .eq('record_id', id);
            if (coursesError) throw coursesError;
            setCourses(coursesData || []);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleDecision(status) {
        setSaving(true);
        setError("");

        try {
            // Notify via email endpoint and update database (bypassing RLS)
            const response = await fetch('/api/notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recordId: id,
                    email: student.email || student.username,
                    status: status,
                    message: feedback,
                    studentName: `${student.first_name} ${student.last_name}`,
                    term: record.advising_term,
                    courses: courses.map(c => `${c.level} - ${c.course_name}`)
                })
            });

            if (!response.ok) {
                const resData = await response.json();
                throw new Error(resData.error || "Failed to process request");
            }

            navigate("/admin");
        } catch (err) {
            setError(err.message);
            setSaving(false);
        }
    }

    if (loading) return <div className="admin-dashboard-container"><div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}><div className="spinner"></div></div></div>;

    if (!record) return <div className="admin-dashboard-container"><p>Record not found.</p></div>;

    return (
        <div className="admin-dashboard-container">
            <h2>Review Advising Form</h2>
            
            {error && <div className="message error">{error}</div>}

            <div className="bento-layout" style={{ marginTop: '20px', animation: 'fadeIn 0.5s ease' }}>
                
                {/* Left Column: Context & Decision */}
                <div className="bento-column">
                    <div className="bento-card">
                        <h3>Student Information</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: 'rgba(255,255,255,0.8)' }}>
                            <p style={{ margin: 0 }}><strong>Name:</strong> {student?.first_name} {student?.last_name}</p>
                            <p style={{ margin: 0 }}><strong>UIN:</strong> {student?.uin}</p>
                            <p style={{ margin: 0 }}><strong>Email:</strong> {student?.username}</p>
                        </div>
                    </div>

                    <div className="bento-card">
                        <h3>Academic History</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: 'rgba(255,255,255,0.8)' }}>
                            <p style={{ margin: 0 }}><strong>Last Term:</strong> {record.last_term}</p>
                            <p style={{ margin: 0 }}><strong>Last GPA:</strong> {record.last_gpa}</p>
                            <p style={{ margin: 0 }}><strong>Current Term:</strong> {record.advising_term}</p>
                            <p style={{ margin: 0, marginTop: '8px' }}>
                                <strong>Status:</strong> <span className={`status-badge ${record.status.toLowerCase()}`}>{record.status}</span>
                            </p>
                        </div>
                    </div>

                    {record.status === 'Pending' ? (
                        <div className="bento-card">
                            <h3>Admin Decision</h3>
                            <Field label="Feedback Message (sent to student)">
                                <textarea
                                    className="signup-input"
                                    rows="4"
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    placeholder="Provide reason for rejection or advice for approval..."
                                    required
                                    style={{ background: 'rgba(0,0,0,0.2)' }}
                                />
                            </Field>

                            <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                                <button 
                                    type="button" 
                                    className="signup-btn" 
                                    style={{ background: '#28a745', margin: 0 }}
                                    onClick={() => handleDecision('Approved')}
                                    disabled={saving || !feedback.trim()}
                                >
                                    {saving ? "Processing..." : "Approve"}
                                </button>
                                <button 
                                    type="button" 
                                    className="signup-btn" 
                                    style={{ background: '#dc3545', margin: 0 }}
                                    onClick={() => handleDecision('Rejected')}
                                    disabled={saving || !feedback.trim()}
                                >
                                    {saving ? "Processing..." : "Reject"}
                                </button>
                                <button 
                                    type="button" 
                                    className="cancel-btn"
                                    style={{ margin: 0 }}
                                    onClick={() => navigate("/admin")}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bento-card">
                            <button 
                                type="button" 
                                className="cancel-btn" 
                                style={{ width: '100%', margin: 0 }}
                                onClick={() => navigate("/admin")}
                            >
                                Back to Dashboard
                            </button>
                        </div>
                    )}
                </div>

                {/* Right Column: Data Table */}
                <div className="bento-column">
                    <div className="bento-card bento-full-height">
                        <h3>Requested Courses</h3>
                        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '10px' }}>
                            <table className="users-table" style={{ width: '100%' }}>
                                <thead>
                                    <tr>
                                        <th style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)' }}>Level</th>
                                        <th style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)' }}>Course Name</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {courses.map(c => (
                                        <tr key={c.id}>
                                            <td style={{ padding: '1rem' }}>{c.level}</td>
                                            <td style={{ padding: '1rem' }}>{c.course_name}</td>
                                        </tr>
                                    ))}
                                    {courses.length === 0 && (
                                        <tr>
                                            <td colSpan="2" style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.5)' }}>
                                                No courses requested.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
