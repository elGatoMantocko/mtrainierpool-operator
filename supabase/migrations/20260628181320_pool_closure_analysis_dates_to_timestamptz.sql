-- Pool update banners can be time-sensitive, so closure/reopening are now
-- stored as full timestamps instead of calendar dates. Existing date values
-- are interpreted as midnight in America/Los_Angeles (the timezone the
-- pool-operator model resolves all times against) to preserve the wall-clock day.
alter table "public"."pool_closure_analysis"
  alter column "closure_date" type timestamptz
    using ("closure_date"::timestamp at time zone 'America/Los_Angeles'),
  alter column "reopening_date" type timestamptz
    using ("reopening_date"::timestamp at time zone 'America/Los_Angeles');
