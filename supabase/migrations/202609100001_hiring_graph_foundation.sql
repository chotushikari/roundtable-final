-- Hiring Graph foundation.
--
-- This migration is deliberately additive. Existing organizations,
-- interview_definitions, interview_versions, invitations, sessions, turns,
-- analyses, artifacts, and assessments remain the runtime source of truth while
-- the product moves to Company -> Job -> Blueprint -> Candidate semantics.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 160),
  employment_type text not null default 'full_time' check (employment_type in ('internship', 'contract', 'full_time', 'part_time', 'temporary')),
  location_label text,
  jd_text text not null default '',
  hiring_bar jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'open', 'paused', 'closed', 'archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.job_competencies (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  competency_key text not null check (competency_key ~ '^[a-z][a-z0-9_]{1,63}$'),
  name text not null check (char_length(name) between 2 and 120),
  description text not null default '',
  weight numeric(5,2) not null default 1 check (weight > 0 and weight <= 100),
  required boolean not null default true,
  created_at timestamptz not null default now(),
  unique (job_id, competency_key)
);

create table public.candidates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  full_name text,
  email text,
  resume_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (organization_id, email)
);

create table public.job_candidates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id) on delete restrict,
  stage text not null default 'invited' check (stage in ('draft', 'invited', 'in_progress', 'completed', 'review', 'withdrawn', 'archived')),
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, candidate_id)
);

-- Existing interview definitions and versions are the compatibility-preserving
-- Blueprint and Blueprint Version records. A nullable bridge keeps all already
-- published definitions valid while new recruiter flows attach them to a job.
alter table public.interview_definitions
  add column job_id uuid references public.jobs(id) on delete restrict;

alter table public.invitations
  add column job_candidate_id uuid references public.job_candidates(id) on delete restrict;

alter table public.interview_sessions
  add column job_id uuid references public.jobs(id) on delete restrict,
  add column job_candidate_id uuid references public.job_candidates(id) on delete restrict;

create table public.integrity_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  session_id uuid not null references public.interview_sessions(id) on delete cascade,
  signal_type text not null check (signal_type in ('consent', 'camera_interaction', 'connection', 'transport', 'policy', 'manual_review')),
  outcome text not null check (outcome in ('observed', 'inconclusive', 'review_requested', 'cleared')),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.human_decisions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  job_candidate_id uuid not null references public.job_candidates(id) on delete cascade,
  session_id uuid references public.interview_sessions(id) on delete set null,
  decision text not null check (decision in ('advance', 'hold', 'decline', 'needs_review')),
  rationale text not null default '',
  decided_by uuid references auth.users(id) on delete set null,
  decided_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null check (char_length(action) between 2 and 120),
  entity_type text not null check (char_length(entity_type) between 2 and 80),
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  recipient_id uuid references auth.users(id) on delete cascade,
  type text not null check (char_length(type) between 2 and 80),
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.enforce_job_competency_scope()
returns trigger language plpgsql security definer set search_path = public as $$
declare job_org uuid;
begin
  select organization_id into job_org from public.jobs where id = new.job_id;
  if job_org is null then raise exception 'Job does not exist'; end if;
  if new.organization_id <> job_org then raise exception 'Job competency must use the job organization'; end if;
  return new;
end;
$$;

create trigger job_competencies_scope
before insert or update of job_id, organization_id on public.job_competencies
for each row execute function public.enforce_job_competency_scope();

create or replace function public.enforce_job_candidate_scope()
returns trigger language plpgsql security definer set search_path = public as $$
declare job_org uuid;
declare candidate_org uuid;
begin
  select organization_id into job_org from public.jobs where id = new.job_id;
  select organization_id into candidate_org from public.candidates where id = new.candidate_id;
  if job_org is null or candidate_org is null then raise exception 'Job or candidate does not exist'; end if;
  if job_org <> candidate_org or new.organization_id <> job_org then
    raise exception 'Job candidate must stay inside one organization';
  end if;
  return new;
end;
$$;

create trigger job_candidates_scope
before insert or update of job_id, candidate_id, organization_id on public.job_candidates
for each row execute function public.enforce_job_candidate_scope();

create or replace function public.enforce_blueprint_job_scope()
returns trigger language plpgsql security definer set search_path = public as $$
declare job_org uuid;
begin
  if new.job_id is null then return new; end if;
  select organization_id into job_org from public.jobs where id = new.job_id;
  if job_org is null or job_org <> new.organization_id then
    raise exception 'Blueprint must belong to a job in the same organization';
  end if;
  return new;
end;
$$;

create trigger interview_definitions_job_scope
before insert or update of job_id, organization_id on public.interview_definitions
for each row execute function public.enforce_blueprint_job_scope();

create or replace function public.enforce_invitation_job_candidate_scope()
returns trigger language plpgsql security definer set search_path = public as $$
declare candidate_org uuid;
declare candidate_job uuid;
declare blueprint_job uuid;
begin
  if new.job_candidate_id is null then return new; end if;
  select organization_id, job_id into candidate_org, candidate_job from public.job_candidates where id = new.job_candidate_id;
  select job_id into blueprint_job from public.interview_definitions where id = new.interview_id;
  if candidate_org is null or candidate_org <> new.organization_id then
    raise exception 'Invitation candidate must belong to the invitation organization';
  end if;
  if blueprint_job is not null and blueprint_job <> candidate_job then
    raise exception 'Invitation candidate and blueprint must belong to the same job';
  end if;
  return new;
end;
$$;

create trigger invitations_job_candidate_scope
before insert or update of job_candidate_id, interview_id, organization_id on public.invitations
for each row execute function public.enforce_invitation_job_candidate_scope();

create or replace function public.enforce_session_hiring_graph_scope()
returns trigger language plpgsql security definer set search_path = public as $$
declare candidate_org uuid;
declare candidate_job uuid;
declare job_org uuid;
begin
  if new.job_candidate_id is not null then
    select organization_id, job_id into candidate_org, candidate_job from public.job_candidates where id = new.job_candidate_id;
    if candidate_org is null or candidate_org <> new.organization_id then
      raise exception 'Session candidate must belong to the session organization';
    end if;
    if new.job_id is null then new.job_id := candidate_job; end if;
    if new.job_id <> candidate_job then raise exception 'Session candidate and job must match'; end if;
  end if;
  if new.job_id is not null then
    select organization_id into job_org from public.jobs where id = new.job_id;
    if job_org is null or job_org <> new.organization_id then
      raise exception 'Session job must belong to the session organization';
    end if;
  end if;
  return new;
end;
$$;

create trigger interview_sessions_hiring_graph_scope
before insert or update of job_id, job_candidate_id, organization_id on public.interview_sessions
for each row execute function public.enforce_session_hiring_graph_scope();

create index jobs_organization_status_idx on public.jobs (organization_id, status, created_at desc);
create index job_competencies_job_idx on public.job_competencies (job_id, required desc);
create index candidates_organization_idx on public.candidates (organization_id, created_at desc);
create index job_candidates_job_stage_idx on public.job_candidates (job_id, stage, created_at desc);
create index interview_definitions_job_idx on public.interview_definitions (job_id) where job_id is not null;
create index invitations_job_candidate_idx on public.invitations (job_candidate_id) where job_candidate_id is not null;
create index interview_sessions_job_idx on public.interview_sessions (job_id, started_at desc) where job_id is not null;
create index interview_sessions_job_candidate_idx on public.interview_sessions (job_candidate_id, started_at desc) where job_candidate_id is not null;
create index integrity_events_session_idx on public.integrity_events (session_id, created_at desc);
create index human_decisions_job_candidate_idx on public.human_decisions (job_candidate_id, decided_at desc);
create index audit_logs_organization_idx on public.audit_logs (organization_id, created_at desc);
create index notifications_recipient_idx on public.notifications (recipient_id, read_at, created_at desc);

alter table public.profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.job_competencies enable row level security;
alter table public.candidates enable row level security;
alter table public.job_candidates enable row level security;
alter table public.integrity_events enable row level security;
alter table public.human_decisions enable row level security;
alter table public.audit_logs enable row level security;
alter table public.notifications enable row level security;

create policy profiles_read_self on public.profiles for select using (id = auth.uid());
create policy profiles_update_self on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy jobs_members_read on public.jobs for select using (public.is_org_member(organization_id));
create policy jobs_members_write on public.jobs for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy job_competencies_members_read on public.job_competencies for select using (public.is_org_member(organization_id));
create policy job_competencies_members_write on public.job_competencies for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy candidates_members_read on public.candidates for select using (public.is_org_member(organization_id));
create policy candidates_members_write on public.candidates for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy job_candidates_members_read on public.job_candidates for select using (public.is_org_member(organization_id));
create policy job_candidates_members_write on public.job_candidates for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy integrity_events_members_read on public.integrity_events for select using (public.is_org_member(organization_id));
create policy human_decisions_members_read on public.human_decisions for select using (public.is_org_member(organization_id));
create policy human_decisions_members_write on public.human_decisions for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy audit_logs_members_read on public.audit_logs for select using (public.is_org_member(organization_id));
create policy notifications_members_read on public.notifications for select using (public.is_org_member(organization_id));
create policy notifications_members_update on public.notifications for update using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));

comment on table public.jobs is 'Hiring context and human-defined hiring bar. Company tenant is organizations during the compatibility transition.';
comment on table public.job_candidates is 'Company-scoped candidate pipeline record. One candidate may be considered for multiple jobs.';
comment on table public.integrity_events is 'Bounded interaction and transport observations only; never raw camera media, identity, voice-authenticity, or automated hiring inference.';
comment on table public.human_decisions is 'Recruiter-owned decision record. AI assessments remain advisory and never write this table automatically.';
