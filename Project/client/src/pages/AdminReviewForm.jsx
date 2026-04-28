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
                    email: student.email || student.username, // Fallback if email is username
                    status: status,
                    message: feedback
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

    if (loading) return <div className="dashboard-container"><p>Loading record...</p></div>;

    if (!record) return <div className="dashboard-container"><p>Record not found.</p></div>;

    return (
        <div className="dashboard-container">
            <h2>Review Advising Form</h2>
            
            {error && <div className="message error">{error}</div>}

            <div className="profile-edit-section" style={{ maxWidth: '800px', marginTop: '20px' }}>
                <div className="form-section">
                    <h3>Student Information</h3>
                    <p><strong>Name:</strong> {student?.first_name} {student?.last_name}</p>
                    <p><strong>UIN:</strong> {student?.uin}</p>
                    <p><strong>Email:</strong> {student?.username}</p>
                </div>

                <div className="form-section" style={{ marginTop: '20px' }}>
                    <h3>Academic History</h3>
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <p><strong>Last Term:</strong> {record.last_term}</p>
                        <p><strong>Last GPA:</strong> {record.last_gpa}</p>
                        <p><strong>Current Term:</strong> {record.advising_term}</p>
                        <p><strong>Status:</strong> <span className={`status-badge ${record.status.toLowerCase()}`}>{record.status}</span></p>
                    </div>
                </div>

                <div className="form-section" style={{ marginTop: '20px' }}>
                    <h3>Requested Courses</h3>
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>Level</th>
                                <th>Course Name</th>
                            </tr>
                        </thead>
                        <tbody>
                            {courses.map(c => (
                                <tr key={c.id}>
                                    <td>{c.level}</td>
                                    <td>{c.course_name}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {record.status === 'Pending' && (
                    <div className="form-section" style={{ marginTop: '30px' }}>
                        <h3>Admin Decision</h3>
                        <Field label="Feedback Message (sent to student)">
                            <textarea
                                className="signup-input"
                                rows="4"
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder="Provide reason for rejection or advice for approval..."
                                required
                            />
                        </Field>

                        <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                            <button 
                                type="button" 
                                className="signup-btn" 
                                style={{ background: '#28a745' }}
                                onClick={() => handleDecision('Approved')}
                                disabled={saving}
                            >
                                {saving ? "Processing..." : "Approve"}
                            </button>
                            <button 
                                type="button" 
                                className="signup-btn" 
                                style={{ background: '#dc3545' }}
                                onClick={() => handleDecision('Rejected')}
                                disabled={saving}
                            >
                                {saving ? "Processing..." : "Reject"}
                            </button>
                            <button 
                                type="button" 
                                className="cancel-btn"
                                onClick={() => navigate("/admin")}
                                disabled={saving}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {record.status !== 'Pending' && (
                    <div style={{ marginTop: '30px' }}>
                        <button type="button" className="cancel-btn" onClick={() => navigate("/admin")}>Back to Dashboard</button>
                    </div>
                )}
            </div>
        </div>
    );
}
