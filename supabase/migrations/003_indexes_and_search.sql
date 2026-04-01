create index idx_doctor_profiles_status on public.doctor_profiles(profile_status, is_premium, is_verified);
create index idx_doctor_profiles_owner on public.doctor_profiles(owner_user_id);
create index idx_doctor_profiles_specialty on public.doctor_profiles(primary_specialty_id);
create index idx_doctor_profiles_fts on public.doctor_profiles using gin(fts);
create index idx_doctor_profiles_search_trgm on public.doctor_profiles using gin(search_text gin_trgm_ops);

create index idx_procedures_active on public.procedures(is_active);
create index idx_procedures_fts on public.procedures using gin(fts);
create index idx_procedures_search_trgm on public.procedures using gin(search_text gin_trgm_ops);

create index idx_locations_city on public.locations(city);
create index idx_locations_state on public.locations(state);
create index idx_locations_postal on public.locations(postal_code);
-- NOTE: functional index with user-defined function not allowed in Postgres.
-- Instead index city directly with trgm for fuzzy city matching in search_doctors.
create index idx_locations_city_trgm on public.locations using gin(city gin_trgm_ops);

create index idx_doctor_procedures_doctor on public.doctor_procedures(doctor_id);
create index idx_doctor_procedures_procedure on public.doctor_procedures(procedure_id);
create index idx_doctor_procedures_active on public.doctor_procedures(is_active);

create index idx_profile_claims_claimant on public.profile_claims(claimant_user_id, status);
create index idx_lead_requests_doctor on public.lead_requests(doctor_id, status, created_at desc);
create index idx_reviews_doctor on public.reviews(doctor_id, moderation_status, created_at desc);

create or replace function public.search_doctors(
  p_query text default null,
  p_city text default null,
  p_procedure_slug text default null,
  p_limit int default 20,
  p_offset int default 0
)
returns table (
  doctor_id uuid,
  slug text,
  public_display_name text,
  city text,
  specialty text,
  is_verified boolean,
  is_premium boolean,
  rank real
)
language sql
stable
as $$
  with procedure_filter as (
    select id
    from public.procedures
    where p_procedure_slug is null or slug = p_procedure_slug
  ),
  norm_query as (
    select
      case when p_query is not null and p_query <> ''
        then public.normalize_text(p_query)
        else null
      end as q,
      case when p_city is not null and p_city <> ''
        then public.normalize_text(p_city)
        else null
      end as c
  )
  select
    d.id           as doctor_id,
    d.slug,
    d.public_display_name,
    l.city,
    s.name_de      as specialty,
    d.is_verified,
    d.is_premium,
    greatest(
      coalesce(
        ts_rank(d.fts, websearch_to_tsquery('simple', coalesce(nq.q, ''))),
        0
      ),
      case
        when nq.q is not null and d.search_text % nq.q then 0.15
        else 0
      end
    )::real as rank
  from public.doctor_profiles d
  cross join norm_query nq
  left join public.specialties s on s.id = d.primary_specialty_id
  left join lateral (
    select city
    from public.locations loc
    where loc.doctor_id = d.id
    order by loc.is_primary desc, loc.created_at asc
    limit 1
  ) l on true
  where d.profile_status = 'published'
    and (
      nq.q is null
      or d.fts @@ websearch_to_tsquery('simple', nq.q)
      or d.search_text % nq.q
    )
    and (
      nq.c is null
      or lower(l.city) % nq.c
      or lower(l.city) = nq.c
    )
    and (
      p_procedure_slug is null
      or exists (
        select 1
        from public.doctor_procedures dp
        join procedure_filter pf on pf.id = dp.procedure_id
        where dp.doctor_id = d.id and dp.is_active = true
      )
    )
  order by d.is_premium desc, d.is_verified desc, rank desc, d.created_at desc
  limit p_limit offset p_offset;
$$;
