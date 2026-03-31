
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import Field from "../components/Field";
import "../App.css";

export default function AdvisingForm({ embeddedId, onSuccess }) {
    const { id: routeId } = useParams();
    const id = embeddedId || routeId;
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [frozen, setFrozen] = useState(false);

    const [formData, setFormData] = useState({
        last_term: "",
        last_gpa: "",
        advising_term: "",
    });

    const [courses, setCourses] = useState([
        { level: "", course_name: "" }
    ]);

    const [lastTermCourses, setLastTermCourses] = useState([]);

    // Hardcoded options for level and courses as per project typical requirements
    const levels = ["Undergraduate", "Graduate"];
    const termOptions = [
        "Spring 2023", "Summer 2023", "Fall 2023",
        "Spring 2024", "Summer 2024", "Fall 2024",
        "Spring 2025", "Summer 2025", "Fall 2025",
        "Spring 2026", "Summer 2026", "Fall 2026",
        "Spring 2027", "Summer 2027", "Fall 2027"
    ];
    const courseOptions = [
        "CS410 - Computer Graphics",
        "CS418 - Web Programming",
        "CS518 - Advanced Web Programming",
        "CS361 - Systems Programming",
        "CS480 - Artificial Intelligence",
        "CS471 - Operating Systems",
        "CS350 - Database Concepts"
    ];

    useEffect(() => {
        if (id) {
            fetchRecord();
        }
    }, [id]);

    useEffect(() => {
        if (formData.last_term) {
            fetchLastTermCourses();
        }
    }, [formData.last_term]);

    async function fetchRecord() {
        setLoading(true);
        try {
            // Fetch the record
            const { data: record, error: recordError } = await supabase
                .from('advising_records')
                .select('*')
                .eq('id', id)
                .single();

            if (recordError) throw recordError;

            setFormData({
                last_term: record.last_term,
                last_gpa: record.last_gpa,
                advising_term: record.advising_term,
            });

            if (record.status === 'Approved' || record.status === 'Rejected') {
                setFrozen(true);
            }

            // Fetch the courses
            const { data: coursesData, error: coursesError } = await supabase
                .from('advising_courses')
                .select('*')
                .eq('record_id', id);

            if (coursesError) throw coursesError;

            if (coursesData && coursesData.length > 0) {
                setCourses(coursesData.map(c => ({ level: c.level, course_name: c.course_name })));
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function fetchLastTermCourses() {
        try {
            // Rule: Prevent students from adding courses they have already taken in the last term.
            // We look for any approved record for that student in the specified last term.
            const { data, error } = await supabase
                .from('advising_records')
                .select(`
                    id,
                    advising_courses (course_name)
                `)
                .eq('student_id', user.id)
                .eq('advising_term', formData.last_term)
                .neq('status', 'Rejected');

            if (error) throw error;

            const taken = data.flatMap(r => r.advising_courses.map(c => c.course_name));
            setLastTermCourses(taken);
        } catch (err) {
            console.error("Error fetching last term courses:", err);
        }
    }

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCourseChange = (index, field, value) => {
        const newCourses = [...courses];
        newCourses[index][field] = value;
        setCourses(newCourses);
        setError(""); // Clear error on change
    };

    const addCourseRow = () => {
        if (frozen) return;
        setCourses([...courses, { level: "", course_name: "" }]);
    };

    const removeCourseRow = (index) => {
        if (frozen) return;
        const newCourses = courses.filter((_, i) => i !== index);
        setCourses(newCourses.length > 0 ? newCourses : [{ level: "", course_name: "" }]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (frozen) return;

        setSaving(true);
        setError("");

        // Validate course rules
        for (const course of courses) {
            if (lastTermCourses.includes(course.course_name)) {
                setError(`Error: You already took ${course.course_name} in your last term (${formData.last_term}).`);
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setSaving(false);
                return;
            }
        }

        try {
            let recordId = id;

            if (id) {
                // Update existing record
                const { error: updateError } = await supabase
                    .from('advising_records')
                    .update({
                        last_term: formData.last_term,
                        last_gpa: formData.last_gpa,
                        advising_term: formData.advising_term,
                        status: 'Pending' // Reset to pending if edited? or keep? 
                        // Instructions say: "If the status is 'pending,' the user can make changes and save the record."
                    })
                    .eq('id', id);

                if (updateError) throw updateError;

                // Delete old courses and re-insert (simpler than syncing)
                await supabase.from('advising_courses').delete().eq('record_id', id);
            } else {
                // Create new record
                const { data, error: insertError } = await supabase
                    .from('advising_records')
                    .insert({
                        student_id: user.id,
                        last_term: formData.last_term,
                        last_gpa: formData.last_gpa,
                        advising_term: formData.advising_term,
                        status: 'Pending'
                    })
                    .select()
                    .single();

                if (insertError) throw insertError;
                recordId = data.id;
            }

            // Insert courses
            const coursesToInsert = courses.map(c => ({
                record_id: recordId,
                level: c.level,
                course_name: c.course_name
            }));

            const { error: coursesError } = await supabase
                .from('advising_courses')
                .insert(coursesToInsert);

            if (coursesError) throw coursesError;

            if (onSuccess) {
                onSuccess();
            } else {
                navigate("/advising");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        if (onSuccess) {
            onSuccess(true); // Signal cancel
        } else {
            navigate("/advising");
        }
    };

    if (loading) return <div className="dashboard-container"><p>Loading...</p></div>;

    return (
        <div className={onSuccess ? "detail-form-container" : "dashboard-container"}>
            <h2 style={onSuccess ? { fontSize: '1.8rem', marginBottom: '1.5rem' } : {}}>{id ? "Edit Course Plan" : "New Course Plan"}</h2>

            {error && (
                <div className="error-alert" style={{
                    background: 'rgba(255, 68, 68, 0.1)',
                    border: '1px solid rgba(255, 68, 68, 0.3)',
                    color: '#ff4444',
                    padding: '12px 20px',
                    borderRadius: '12px',
                    marginBottom: '20px',
                    fontSize: '0.95rem',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    animation: 'fadeIn 0.3s ease'
                }}>
                    <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                    {error}
                </div>
            )}

            {frozen && (
                <div className="message warning">
                    This record is <strong>{formData.status}</strong> and cannot be edited.
                </div>
            )}


            <form onSubmit={handleSubmit} className="profile-edit-section" style={{ maxWidth: '800px' }}>
                <div className="form-section">
                    <h3>History</h3>
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                        <Field label="Last Term">
                            <select
                                name="last_term"
                                className="signup-input"
                                value={formData.last_term}
                                onChange={handleFormChange}
                                required
                                disabled={frozen}
                            >
                                <option value="">Select Last Term</option>
                                {termOptions.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </Field>
                        <Field label="Last GPA">
                            <input
                                type="number"
                                step="0.01"
                                name="last_gpa"
                                className="signup-input"
                                value={formData.last_gpa}
                                onChange={handleFormChange}
                                placeholder="e.g. 3.50"
                                required
                                disabled={frozen}
                            />
                        </Field>
                        <Field label="Current Term">
                            <select
                                name="advising_term"
                                className="signup-input"
                                value={formData.advising_term}
                                onChange={handleFormChange}
                                required
                                disabled={frozen}
                            >
                                <option value="">Select Current Term</option>
                                {termOptions.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </Field>
                    </div>
                </div>

                <div className="form-section" style={{ marginTop: '30px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>Course Plan</h3>
                        {!frozen && (
                            <button type="button" onClick={addCourseRow} className="add-row-btn" title="Add Course">
                                +
                            </button>
                        )}
                    </div>

                    {courses.map((course, index) => (
                        <div key={index} style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', marginBottom: '15px' }}>
                            <Field label="Level">
                                <select
                                    className="signup-input"
                                    value={course.level}
                                    onChange={(e) => handleCourseChange(index, 'level', e.target.value)}
                                    required
                                    disabled={frozen}
                                >
                                    <option value="">Select Level</option>
                                    {levels.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </Field>
                            <Field label="Course Name">
                                <select
                                    className="signup-input"
                                    value={course.course_name}
                                    onChange={(e) => handleCourseChange(index, 'course_name', e.target.value)}
                                    required
                                    disabled={frozen}
                                >
                                    <option value="">Select Course</option>
                                    {courseOptions.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </Field>
                            {!frozen && courses.length > 1 && (
                                <button type="button" onClick={() => removeCourseRow(index)} className="remove-row-btn">
                                    ✕
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: '30px', display: 'flex', gap: '10px' }}>
                    {!frozen && (
                        <button type="submit" className="signup-btn" disabled={saving}>
                            {saving ? (id ? "Updating..." : "Saving...") : (id ? "Update Record" : "Submit Plan")}
                        </button>
                    )}
                    <button type="button" onClick={handleCancel} className="cancel-btn">
                        {frozen ? "Back" : "Cancel"}
                    </button>
                </div>
            </form>
        </div>
    );
}
