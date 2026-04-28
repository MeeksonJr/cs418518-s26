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

    const { recordId, email, status, message } = req.body;

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

        // Send email using Resend
        // NOTE: For unverified Resend domains, we MUST send FROM onboarding@resend.dev
        // and TO the email address you signed up for Resend with!
        const { data, error } = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: email, 
            subject: `Advising Form ${status}`,
            text: `Your advising form has been ${status}.\n\nMessage from Admin: ${message || "No additional message."}`,
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
