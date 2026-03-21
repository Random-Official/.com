Random live backend package

1. Create a Supabase project.
2. Run schema.sql in the Supabase SQL editor.
3. Put your project URL and anon key into the two window.RANDOM_SUPABASE_* values near the top of index.html.
4. Deploy to Vercel.

When the keys are filled in, signup and login use Supabase Auth and the app syncs profiles and posts through the backend. Without keys it falls back to local browser mode.
