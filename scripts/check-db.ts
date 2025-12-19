
import { createClient } from '@supabase/supabase-js'

async function checkConnection() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    return
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  const { data, error } = await supabase.from('siam_vectors').select('content, source_type, metadata').ilike('content', '%multi-tenant%').limit(5)
  
  if (error) {
    console.error('❌ Error searching for multi-tenant:', error.message)
  } else {
    console.log('✅ Found multi-tenant matches:', JSON.stringify(data, null, 2))
  }
}

checkConnection()

