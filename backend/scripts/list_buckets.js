require('dotenv').config()

const SUPABASE_URL = process.env.SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_URL || !KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env')
  process.exit(1)
}

async function listBuckets() {
  try {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
      method: 'GET',
      headers: {
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
      },
    })

    const text = await res.text()
    let data
    try { data = JSON.parse(text) } catch (e) { data = text }

    console.log('HTTP', res.status, res.statusText)
    console.log('Buckets/list response:')
    console.log(typeof data === 'string' ? data : JSON.stringify(data, null, 2))

    if (!res.ok) process.exit(1)
  } catch (err) {
    console.error('Error fetching buckets:', err)
    process.exit(1)
  }
}

listBuckets()
