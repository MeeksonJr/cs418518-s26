import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { recordId, email, status, message, studentName, term, courses } = req.body;

    if (!email || !status || !recordId) {
        return res.status(400).json({ error: "recordId, email, and status are required" });
    }

    try {
        // Update database using service role key to bypass RLS
        const { error: updateError } = await supabase
            .from('advising_records')
            .update({ status, message })
            .eq('id', recordId);

        if (updateError) {
            console.error("Supabase update error:", updateError);
            return res.status(500).json({ error: "Failed to update record in database" });
        }

        const currentDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });

        // Determine color based on status
        const statusColor = status === 'Approved' ? '#28a745' : status === 'Rejected' ? '#dc3545' : '#007aff';
        
        // Format courses as an HTML list
        const coursesList = courses && courses.length > 0 
            ? `<ul>${courses.map(c => `<li>${c}</li>`).join('')}</ul>` 
            : '<p>No courses specified.</p>';

        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #007aff; color: white; padding: 20px; text-align: center;">
                    <h2 style="margin: 0;">Course Advising Update</h2>
                </div>
                <div style="padding: 20px; color: #333;">
                    <p>Dear <strong>${studentName || 'Student'}</strong>,</p>
                    <p>Your course advising form for the <strong>${term || 'upcoming'}</strong> semester has been reviewed.</p>
                    
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="margin-top: 0; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Review Summary</h3>
                        <p><strong>Date Reviewed:</strong> ${currentDate}</p>
                        <p><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${status}</span></p>
                        <p><strong>Admin Feedback:</strong></p>
                        <blockquote style="border-left: 4px solid #007aff; margin: 0; padding-left: 15px; color: #555; font-style: italic;">
                            ${message || "No additional feedback provided."}
                        </blockquote>
                    </div>

                    <h3 style="border-bottom: 1px solid #ddd; padding-bottom: 10px;">Requested Courses</h3>
                    ${coursesList}
                    
                    <p style="margin-top: 30px; font-size: 14px; color: #777;">
                        If you have any questions, please log into the Course Advising System to view your full history or contact your advisor.
                    </p>
                </div>
            </div>
        `;

        // Send email using Resend
        // NOTE: For unverified Resend domains, we MUST send FROM onboarding@resend.dev
        // and TO the email address you signed up for Resend with!
        const { data, error } = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: email, 
            subject: `Advising Form ${status} - ${term || ''}`,
            html: emailHtml,
            text: `Your advising form has been ${status}.\n\nMessage from Admin: ${message || "No additional message."}\n\nTerm: ${term}\nCourses: ${courses?.join(', ')}`,
        });

        if (error) {
            console.error("Resend API error:", error);
            return res.status(500).json({ error: "Failed to send email via Resend" });
        }

        return res.status(200).json({ success: true, messageId: data.id });
    } catch (error) {
        console.error("Error sending email:", error);
        return res.status(500).json({ error: "Failed to process request" });
    }
}
