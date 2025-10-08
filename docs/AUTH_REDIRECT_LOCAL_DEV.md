# Local Login Redirect Fix (Supabase + Next)

If logging in on your local dev redirects you to the deployed Vercel app, it is almost always due to Supabase Auth URL settings not allowing your local origin. Fix it with the steps below.

## Why this happens
- The app calls `supabase.auth.signInWithOAuth({ redirectTo: <origin>/auth/callback })`.
- Supabase only redirects to URLs that are explicitly allowed in your project’s Auth settings.
- If your local origin is not on that list, Supabase falls back to the project’s Site URL (often your Vercel domain), so after Google login you land on prod.

## Fix in Supabase Dashboard
1) Go to Authentication → URL Configuration
2) Ensure the following are configured:
   - Site URL: your production app URL (unchanged)
   - Additional Redirect URLs: add all local origins you use, including the callback path. Examples:
     - `http://localhost:3000/auth/callback`
     - `http://127.0.0.1:3000/auth/callback`
     - `http://<your-local-host>:3000/auth/callback`
3) Save.

Notes:
- You do NOT need to add your app URLs to Google OAuth client redirect URIs (Supabase uses its own callback URI with Google).
- Multiple origins are fine; add every dev host/port you might use.

## Optional app override
If you are behind a proxy/custom host where `window.location.origin` is unreliable, set in `.env.local`:

```
NEXT_PUBLIC_AUTH_REDIRECT_BASE=http://localhost:3000
```

The login page will use this base for `redirectTo`:
- `NEXT_PUBLIC_AUTH_REDIRECT_BASE` (if set), else `window.location.origin` → `/auth/callback`

## Verification
- Restart local dev (`npm run dev`)
- Visit `/login`, click “Continue with Google”
- After authenticate, you should return to `http://localhost:3000/auth/callback` and then `/`
