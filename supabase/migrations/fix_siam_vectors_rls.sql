
-- Enable RLS on siam_vectors
ALTER TABLE siam_vectors ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for anon key)
CREATE POLICY "Allow public read access"
ON siam_vectors
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow service role full access
CREATE POLICY "Allow service role full access"
ON siam_vectors
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
