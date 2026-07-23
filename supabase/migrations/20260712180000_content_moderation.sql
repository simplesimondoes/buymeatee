-- BuyMeATee content moderation (Product Wave 1, issue #28)
--
-- Goal-level takedown: taken_down_at is set only by admins (service role —
-- the column is absent from every client write grant). A taken-down goal
-- disappears from public reads and cannot be re-published by its creator
-- until an admin restores it. Page-level takedown reuses
-- profiles.deactivated_at from the admin-user-management migration.

alter table public.creator_goals
  add column taken_down_at timestamptz;

comment on column public.creator_goals.taken_down_at is
  'Admin takedown. Blocks public visibility and re-publishing; reasons live in admin_actions.';

-- Public visibility now also requires the goal not to be taken down.
drop policy "Published goals of active creators are viewable by everyone"
  on public.creator_goals;
create policy "Published goals of active creators are viewable by everyone"
  on public.creator_goals for select
  using (
    status in ('active', 'completed')
    and taken_down_at is null
    and exists (
      select 1 from public.profiles p
      where p.id = creator_id and p.deactivated_at is null
    )
  );

-- A taken-down goal cannot come back to the public page until an admin
-- clears taken_down_at — whatever role attempts the transition.
create or replace function public.prevent_taken_down_publish()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status in ('active', 'completed')
     and new.taken_down_at is not null then
    raise exception 'This goal was removed by BuyMeATee and cannot be published.';
  end if;
  return new;
end;
$$;

create trigger creator_goals_prevent_taken_down_publish
  before insert or update on public.creator_goals
  for each row execute function public.prevent_taken_down_publish();
