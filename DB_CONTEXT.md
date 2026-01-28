# Database Schema Documentation

This project uses Supabase (PostgreSQL).
Strictly adhere to the schema below when writing SQL queries or Supabase client code.

## Tables

### 1. profiles
- Contains user information synced with Supabase Auth.
- Columns:
  - `id` (uuid, PK): References `auth.users.id`
  - `email` (text): User's email
  - `username` (text): Display name
  - `avatar_url` (text): URL to profile image
  - `credits` (int): Number of keys available (Default: 3)
  - `created_at` (timestamp)

### 2. tracks
- Music links uploaded by artists.
- Columns:
  - `id` (uuid, PK): Unique track ID
  - `user_id` (uuid, FK): References `profiles.id`
  - `platform` (text): 'youtube' or 'soundcloud'
  - `url` (text): The full link URL
  - `title` (text): Track title (optional)
  - `created_at` (timestamp)

### 3. feedbacks
- Anonymous feedback from listeners.
- Columns:
  - `id` (uuid, PK): Unique feedback ID
  - `track_id` (uuid, FK): References `tracks.id`
  - `content` (text): The feedback text
  - `is_unlocked` (boolean): Whether the artist has spent a key to view this (Default: false)
  - `created_at` (timestamp)

## RLS Policies (Summary)
- Public Read: Profiles, Tracks are public.
- Private Write: Only owners can edit their Profile/Tracks.
- Feedback Logic: Anyone can insert (anon), but only the Track owner can view feedbacks linked to their track.