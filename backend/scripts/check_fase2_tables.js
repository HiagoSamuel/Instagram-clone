const supabase = require('../src/services/supabase')

const requiredTables = ['friendships', 'messages']

async function checkTable(table) {
  const { error } = await supabase.from(table).select('*').limit(1)
  return {
    table,
    ok: !error,
    error,
  }
}

async function main() {
  const results = await Promise.all(requiredTables.map(checkTable))
  let hasMissingTable = false

  for (const result of results) {
    if (result.ok) {
      console.log(`OK ${result.table}`)
      continue
    }

    hasMissingTable = true
    console.log(`FALTANDO ${result.table}: ${result.error.code || ''} ${result.error.message}`)
  }

  if (hasMissingTable) {
    console.log('\nRode backend/supabase-fase2.sql no SQL Editor do Supabase.')
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
