-- Allow users to link their own attachments to messages (e.g. on send)
create policy "Users can update own attachments"
  on public.attachments for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
