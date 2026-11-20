BEGIN;
CREATE TABLE IF NOT EXISTS waitlist_locations (
 id text PRIMARY KEY, name text NOT NULL, country text NOT NULL, country_code text NOT NULL,
 region text NOT NULL, latitude double precision NOT NULL, longitude double precision NOT NULL,
 population bigint NOT NULL, search_text text NOT NULL,
 search_vector tsvector GENERATED ALWAYS AS (to_tsvector('simple',search_text)) STORED
);
CREATE INDEX IF NOT EXISTS waitlist_locations_search ON waitlist_locations USING gin(search_vector);
ALTER TABLE waitlist_cities ADD COLUMN IF NOT EXISTS location_id text REFERENCES waitlist_locations(id);
ALTER TABLE waitlist_cities ADD COLUMN IF NOT EXISTS region text;
CREATE TABLE IF NOT EXISTS waitlist_city_aliases (id text PRIMARY KEY, city_id text NOT NULL REFERENCES waitlist_cities(id));
CREATE TABLE IF NOT EXISTS waitlist_cleanup_backups (id bigserial PRIMARY KEY, created_at timestamptz DEFAULT now(), data jsonb NOT NULL);
COMMIT;
