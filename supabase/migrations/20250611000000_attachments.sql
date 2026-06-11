-- Chat file attachments (metadata; bytes stored in Vercel Blob)
create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  chat_id uuid not null references public.chats (id) on delete cascade,
  message_id uuid references public.messages (id) on delete set null,
  blob_pathname text not null unique,
  filename text not null,
  media_type text not null,
  size_bytes bigint not null,
  created_at timestamptz not null default now()
);

create index attachments_user_id_idx on public.attachments (user_id);
create index attachments_chat_id_idx on public.attachments (chat_id);
create index attachments_blob_pathname_idx on public.attachments (blob_pathname);

alter table public.attachments enable row level security;

create policy "Users can view own attachments"
  on public.attachments for select
  using (auth.uid() = user_id);

create policy "Users can insert attachments in own chats"
  on public.attachments for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.chats
      where chats.id = attachments.chat_id
        and chats.user_id = auth.uid()
    )
  );

create policy "Users can delete own attachments"
  on public.attachments for delete
  using (auth.uid() = user_id);
