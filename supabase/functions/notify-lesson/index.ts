import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const N8N_WEBHOOK_URL = 'https://n8n.fonfoto.space/webhook/hw-send-email'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    console.log('[notify-lesson] Forwarding to n8n:', JSON.stringify(payload))

    const n8nRes = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const responseText = await n8nRes.text()
    console.log(`[notify-lesson] n8n responded: ${n8nRes.status} — ${responseText}`)

    return new Response(
      JSON.stringify({ ok: n8nRes.ok, status: n8nRes.status, body: responseText }),
      {
        status: n8nRes.ok ? 200 : 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (err) {
    console.error('[notify-lesson] Error:', err)
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
