# RoadAlertProject

## Supabase setup (keys and security)

- Store the following environment variables for your app/deploys:
  - `SUPABASE_URL` — your project URL (https://<project>.supabase.co)
  - `SUPABASE_ANON_KEY` — public/anonymized key for client SDKs
  - `SUPABASE_SERVICE_ROLE_KEY` — **server-only** admin key (never expose this in front-end code)

### Client initialization (safe pattern)

Add a small script to inject the public values at deploy/build time (do NOT inject the service key):

```html
<!-- in index.html before loading your modules -->
<script>
  window.SUPABASE_URL = "https://<your-project>.supabase.co";
  window.SUPABASE_ANON_KEY = "<your-anon-key>"; // safe for browser use
</script>
<script type="module" src="./auth.js"></script>
```

Then in `auth.js` call:

```js
import { initSupabase } from './auth.js'
initSupabase()
```

The `auth.js` in this project supports reading the keys from `window.SUPABASE_URL` and `window.SUPABASE_ANON_KEY`, or from `process.env` for server-side builds.

### Windows (PowerShell) env examples

### Vercel environment variables

When you deploy to Vercel, set the following `Environment Variables` in the project settings (they will be injected at runtime to any serverless function):

- `SUPABASE_URL` — your project URL
- `SUPABASE_ANON_KEY` — your public anon key (required by client)
- `SUPABASE_SERVICE_ROLE_KEY` — **only** if you plan to run serverless functions that need admin privileges (not used by the client)

We added a tiny serverless endpoint (`/api/env`) that reads the first two values and returns them as JSON. The front‑end calls this endpoint at load time to get the keys without hard‑coding them into `index.html`. Running locally the endpoint will return nothing, so the script falls back to the placeholder strings; replace them manually or configure your own simple dev server.

Do **not** expose the service role key in any client bundles; keep it available to Edge/Serverless functions only.

Vercel will automatically provide these as `process.env.*` inside functions and during build.


Temporarily for the session:

```powershell
$env:SUPABASE_URL="https://<your-project>.supabase.co"
$env:SUPABASE_ANON_KEY="<your-anon-key>"
$env:SUPABASE_SERVICE_ROLE_KEY="<your-service-role-key>"
```

Persist for current user (re-open shell to apply):

```powershell
setx SUPABASE_URL "https://<your-project>.supabase.co"
setx SUPABASE_ANON_KEY "<your-anon-key>"
setx SUPABASE_SERVICE_ROLE_KEY "<your-service-role-key>"
```

### Database schema notes

For authentication we rely on Supabase Auth. In addition you can create a `profiles` table to store extra fields such as username:

```sql
create table profiles (
  id uuid references auth.users not null primary key,
  username text not null,
  email text,
  created_at timestamptz default now()
);
```

Enable row‑level security and add a policy allowing authenticated users to insert their own profile:

```sql
alter table profiles enable row level security;
create policy "Insert own profile" on profiles
  for insert with check (auth.uid() = id);
```

The frontend sign‑up flow inserts a record into this table after creating the user account.

#### pins table

A simple schema for storing reports looks like this (adjust fields as needed):

```sql
create table pins (
  id text primary key,
  type text not null,
  description text,
  lat double precision,
  lng double precision,
  created_by uuid references auth.users,
  created_by_name text,
  created_at timestamptz default now(),
  expires_at timestamptz,
  duration int,
  upvotes int default 0,
  downvotes int default 0,
  voters jsonb,
  status text
);
```

Enable row‑level security and add policies allowing authenticated users to insert and select:

```sql
alter table pins enable row level security;
create policy "Insert pins" on pins for insert with check (auth.uid() = created_by);
create policy "Select pins" on pins for select using (true);
```

The application’s client code now inserts and selects from this table directly via Supabase.

### Immediate security steps if a key was exposed
- Rotate/regenerate keys in the Supabase Dashboard: Settings → API → Regenerate keys.
- Remove leaked keys from any public repos and CI logs. If they were committed, rewrite history (BFG or git filter-branch).
- Replace the old keys in your deployments with the new ones.

If you want, I can patch `index.html` to include the injection snippet for local testing, and/or add a small server example that uses `SUPABASE_SERVICE_ROLE_KEY` safely.
