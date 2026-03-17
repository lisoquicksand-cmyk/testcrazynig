ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS instructor_name TEXT,
  ADD COLUMN IF NOT EXISTS instructor_image TEXT,
  ADD COLUMN IF NOT EXISTS full_description TEXT,
  ADD COLUMN IF NOT EXISTS syllabus JSONB DEFAULT '[]'::jsonb;