Random live deploy package

Fastest way to put this live:
1. Create a free Vercel account.
2. Drag this whole folder into a new GitHub repo, or use Vercel's import flow.
3. Deploy the project. Vercel will give you a *.vercel.app URL immediately.
4. Buy a domain like randomapp.com or rndm.app.
5. In Vercel: Project -> Settings -> Domains -> Add Domain.
6. Copy the DNS records Vercel shows and add them at your registrar.

Important:
- This current version is frontend-only and uses browser localStorage.
- That means it can go live publicly, but accounts/posts will not sync across different devices/users until you connect a real backend.
- For true multi-user live behavior, the next step is moving auth/posts/follows/notifications/polls to Supabase or Firebase.
