require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

async function run() {
  const { data, error } = await supabase.storage.createBucket('avatars', { public: true })
  if (error) {
    console.error('createBucket error', error)
    process.exit(1)
  }
  console.log('Bucket created:', data)
}
run()