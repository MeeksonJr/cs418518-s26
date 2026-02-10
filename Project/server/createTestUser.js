require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
    console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY not found in .env');
    console.log('Please add your service role key to server/.env:');
    console.log('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here');
    process.exit(1);
}

// Create admin client with service role key (bypasses RLS and rate limits)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function createTestUser() {
    try {
        // Get email from command line args or generate unique
        const emailArg = process.argv[2];
        const email = emailArg || `testuser${Date.now()}@example.com`;

        console.log(`Creating test user: ${email}...`);

        // Use admin API to create user (bypasses rate limits)
        const { data, error } = await supabase.auth.admin.createUser({
            email: email,
            password: 'password123',
            email_confirm: true, // Auto-confirm email
            user_metadata: {
                first_name: 'Test',
                last_name: 'User',
                uin: '12345678'
            }
        });

        if (error) {
            console.error('Error creating user:', error);
            return;
        }

        console.log('✅ Test user created successfully!');
        console.log('Email:', email);
        console.log('Password: password123');
        console.log('User ID:', data.user.id);

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

createTestUser();
