do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Users can read their own avatar objects'
  ) then
    create policy "Users can read their own avatar objects"
      on storage.objects
      for select
      to authenticated
      using (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = (select auth.uid())::text
      );
  end if;
end
$$;
