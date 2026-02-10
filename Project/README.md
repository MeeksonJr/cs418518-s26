# CS418 Milestone 1 - User Authentication System

web app with user registration, login, and authentication using supabase.

## setup

you need node.js installed and a supabase project set up.

### install dependencies

```bash
# server
cd server
npm install

# client
cd ../client
npm install
```

### environment variables

create `.env` files in both `server` and `client` directories using the `.env.example` templates.

get your supabase credentials from your supabase dashboard.

### run the app

```bash
# server (port 3000)
cd server
npm start

# client (port 5173)
cd client
npm run dev
```

## creating users

### regular users
just use the signup page at `/register`

### admin users
use the script to create a user, then update them in the database:

```bash
cd server
node createTestUser.js admin@test.com
```

then go to supabase dashboard -> table editor -> profiles and set `is_admin` to `true` for that user.

## features

- user registration with email/password
- login system
- password reset
- change password from dashboard
- admin dashboard to view all users
- profile management (first/last name, UIN)

## stack

- frontend: react + vite
- backend: express (minimal)
- auth: supabase
- database: supabase postgres

## notes

if you hit rate limits during testing, disable email confirmation in supabase dashboard under authentication -> providers -> email.
