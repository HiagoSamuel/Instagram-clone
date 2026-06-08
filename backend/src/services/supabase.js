const { createClient } = require('@supabase/supabase-js')

// Injetando os valores diretamente no código para não depender das variáveis do Railway
const supabaseUrl = 'https://cjjwvmffbmyqttiaajbu.supabase.co'

// ⚠️ VEJA O PASSO ABAIXO para preencher essa string antes de salvar!
const supabaseKey = 'sb_secret_GyRBiqEhm5T_Y8EWWEZvGg_1h6PN-Ts' 

const supabase = createClient(supabaseUrl, supabaseKey)

module.exports = supabase