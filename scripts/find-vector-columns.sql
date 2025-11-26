-- Run this in Supabase SQL Editor to find ALL vector columns in the schema

SELECT 
  c.table_name,
  c.column_name,
  c.udt_name,
  c.character_maximum_length,
  -- Try to get vector dimension from column definition
  CASE 
    WHEN c.udt_name = 'vector' THEN 
      (SELECT regexp_replace(format_type(a.atttypid, a.atttypmod), '[^0-9]', '', 'g')
       FROM pg_attribute a
       JOIN pg_class t ON a.attrelid = t.oid
       JOIN pg_namespace n ON t.relnamespace = n.oid
       WHERE n.nspname = 'public' 
         AND t.relname = c.table_name 
         AND a.attname = c.column_name
         AND a.attnum > 0)
    ELSE NULL
  END as vector_dimension
FROM information_schema.columns c
WHERE c.table_schema = 'public'
  AND (
    c.udt_name = 'vector' 
    OR c.column_name LIKE '%embedding%'
    OR c.column_name LIKE '%vector%'
  )
ORDER BY c.table_name, c.column_name;
