BEGIN;
CREATE TABLE IF NOT EXISTS waitlist_cities (
 id text PRIMARY KEY, name text NOT NULL, country text NOT NULL,
 longitude double precision, latitude double precision,
 CHECK ((longitude IS NULL AND latitude IS NULL) OR (longitude BETWEEN -180 AND 180 AND latitude BETWEEN -90 AND 90))
);
CREATE TABLE IF NOT EXISTS waitlist_people (
 id text PRIMARY KEY, city_id text NOT NULL REFERENCES waitlist_cities(id),
 name text NOT NULL, email text NOT NULL, instagram text NOT NULL,
 created_at timestamptz NOT NULL, source text NOT NULL,
 artist_email_sent boolean NOT NULL DEFAULT false,
 UNIQUE (email,city_id)
);
ALTER TABLE waitlist_people ADD COLUMN IF NOT EXISTS resolved_at timestamptz;
CREATE TABLE IF NOT EXISTS waitlist_sources (
 id text PRIMARY KEY, person_id text NOT NULL REFERENCES waitlist_people(id)
);
CREATE TABLE IF NOT EXISTS waitlist_sessions (
 token_hash text PRIMARY KEY, principal text NOT NULL, expires_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS waitlist_login_limits (
 key text PRIMARY KEY, attempts integer NOT NULL, expires_at timestamptz NOT NULL
);
COMMIT;
