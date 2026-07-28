-- Chat rate-limiting store for the site assistant.
-- Counts messages per visitor (IP) and globally, per day, so the serverless
-- endpoint can enforce daily caps that survive a browser-storage wipe.
--
-- Run this once on the MTV Supabase project (SQL editor).

create table if not exists chat_usage (
  bucket text not null,               -- an IP address, or the literal 'GLOBAL'
  day    date not null default current_date,
  count  integer not null default 0,
  primary key (bucket, day)
);

-- RLS on with NO policies => anon and authenticated clients cannot read or
-- write this table at all. Only the service role (used server-side by the
-- chat endpoint) bypasses RLS. Keep it that way.
alter table chat_usage enable row level security;

-- Atomically increment today's per-IP and global counters, returning both new
-- values. SECURITY DEFINER so it runs with the function owner's rights; it is
-- only ever called with the service-role key from the serverless function.
create or replace function bump_chat_usage(p_ip text)
returns table (ip_count integer, global_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ip integer;
  v_global integer;
begin
  insert into chat_usage (bucket, day, count)
  values (p_ip, current_date, 1)
  on conflict (bucket, day) do update set count = chat_usage.count + 1
  returning count into v_ip;

  insert into chat_usage (bucket, day, count)
  values ('GLOBAL', current_date, 1)
  on conflict (bucket, day) do update set count = chat_usage.count + 1
  returning count into v_global;

  ip_count := v_ip;
  global_count := v_global;
  return next;
end;
$$;

-- Lock the function down: only the service role may call it.
revoke all on function bump_chat_usage(text) from public, anon, authenticated;
