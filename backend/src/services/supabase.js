const { createClient } = require('@supabase/supabase-js')

// URL do seu Supabase configurada como garantia (fallback) caso o Railway não injete a tempo
const supabaseUrl = process.env.SUPABASE_URL || 'https://cjjwvmffbmyqttiaajbu.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseKey) {
  console.error("⚠️ Erro crítico: A variável SUPABASE_SERVICE_KEY não foi encontrada no ambiente!")
}

const supabase = createClient(supabaseUrl, supabaseKey)

module.exports = supabase