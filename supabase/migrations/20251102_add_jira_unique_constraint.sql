-- Add UNIQUE constraint to jira_tickets.external_id
-- Required for UPSERT operations to work correctly

-- First check if constraint already exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'jira_tickets_external_id_unique'
  ) THEN
    ALTER TABLE public.jira_tickets 
    ADD CONSTRAINT jira_tickets_external_id_unique UNIQUE (external_id);
    
    RAISE NOTICE 'Added UNIQUE constraint on jira_tickets.external_id';
  ELSE
    RAISE NOTICE 'UNIQUE constraint already exists on jira_tickets.external_id';
  END IF;
END $$;

