# Live Database

Requires setup in Supabase "SQL Editor":

```sql
create table survey_responses (
  user_id uuid primary key,
  profession text not null,
  age_range text not null,
  ai_knowledge integer not null,
  previous_experiments integer[] not null,
  submitted_at timestamp with time zone not null
);

alter table survey_responses
  disable row level security;

alter publication supabase_realtime
  add table survey_responses;
```

Then `cp credentials.js.example credentials.js` and update accordingly.

Note that for development you'll want `nmp install --save-dev @supabase/supabase-js`

For release, you can build with `node build.js` – requires `nmp install --save-dev esbuild`