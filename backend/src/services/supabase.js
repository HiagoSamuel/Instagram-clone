const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Configuracao do Supabase ausente. Defina SUPABASE_URL e SUPABASE_KEY (ou SUPABASE_SERVICE_KEY) no ambiente.'
  )
}

const supabase = createClient(supabaseUrl, supabaseKey)

module.exports = supabase
