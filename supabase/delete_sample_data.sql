-- ============================================================================
-- Remove all seeded SAMPLE data.
-- Run this in the Supabase SQL editor when you want the dashboards to show
-- only real data. It only touches rows that were clearly marked as samples:
--   • leads   where source = 'sample'
--   • projects where notes  = '[SAMPLE DATA]'  (refs start with 'SMP-')
--   • the project_docs belonging to those sample projects
-- Real leads (source = 'website') and real projects are never touched.
-- ============================================================================

delete from public.project_docs
where project_id in (select id from public.projects where notes = '[SAMPLE DATA]');

delete from public.projects where notes = '[SAMPLE DATA]';

delete from public.leads where source = 'sample';

-- Sanity check (should all be 0):
select
  (select count(*) from public.leads   where source = 'sample')            as sample_leads,
  (select count(*) from public.projects where notes = '[SAMPLE DATA]')      as sample_projects;
