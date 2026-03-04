
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import Field from "../components/Field";
import "../App.css";

export default function AdvisingForm() {
    const { id } = useParams();
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
                .eq('status', 'Approved');

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

            navigate("/advising");
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="dashboard-container"><p>Loading...</p></div>;

    return (
        <div className="dashboard-container">
            <h2>{id ? "Edit Course Advising" : "New Course Advising"}</h2>

            {frozen && (
                <div className="message warning">
                    This record is <strong>{formData.status}</strong> and cannot be edited.
                </div>
            )}

            {error && <div className="message error">{error}</div>}

            <form onSubmit={handleSubmit} className="profile-edit-section" style={{ maxWidth: '800px' }}>
                <div className="form-section">
                    <h3>History</h3>
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                        <Field label="Last Term">
                            <input
                                type="text"
                                name="last_term"
                                className="signup-input"
                                value={formData.last_term}
                                onChange={handleFormChange}
                                placeholder="e.g. Fall 2023"
                                required
                                disabled={frozen}
                            />
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
                        <Field label="Advising Term">
                            <input
                                type="text"
                                name="advising_term"
                                className="signup-input"
                                value={formData.advising_term}
                                onChange={handleFormChange}
                                placeholder="e.g. Spring 2024"
                                required
                                disabled={frozen}
                            />
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
                            {saving ? "Saving..." : "Submit Advising Record"}
                        </button>
                    )}
                    <button type="button" onClick={() => navigate("/advising")} className="cancel-btn">
                        {frozen ? "Back" : "Cancel"}
                    </button>
                </div>
            </form>
        </div>
    );
}
