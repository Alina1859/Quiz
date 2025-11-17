import http from 'node:http'

const PORT = Number.parseInt(process.env.CRM_PROXY_PORT ?? '4001', 10)
const CRM_TOKEN = process.env.TOKEN_CRM ?? process.env.CRM_TOKEN ?? process.env.CRM_TOKEN_ID
const CRM_BASE_URL =
  process.env.CRM_BASE_URL ?? 'https://wdg.biz-crm.ru/inserv/in.php'
const REQUEST_TIMEOUT_MS = Number.parseInt(process.env.CRM_PROXY_TIMEOUT_MS ?? '15000', 10)

function buildCrmUrl() {
  if (!CRM_TOKEN) {
    throw new Error('CRM token is not configured')
  }
  const url = new URL(CRM_BASE_URL)
  if (!url.searchParams.has('token')) {
    url.searchParams.set('token', CRM_TOKEN)
  }
  return url.toString()
}

async function forwardToCrm(payload) {
  const crmUrl = buildCrmUrl()
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const crmResponse = await fetch(crmUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    const textBody = await crmResponse.text()

    return {
      status: crmResponse.status,
      body: textBody,
    }
  } finally {
    clearTimeout(timeoutId)
  }
}

function sendJson(res, status, data) {
  const body = JSON.stringify(data)
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  })
  res.end(body)
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []

    req.on('data', (chunk) => {
      chunks.push(chunk)
    })

    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8')
        const data = raw.length > 0 ? JSON.parse(raw) : {}
        resolve(data)
      } catch (error) {
        reject(error)
      }
    })

    req.on('error', (error) => {
      reject(error)
    })
  })
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/healthz') {
    sendJson(res, 200, { status: 'ok' })
    return
  }

  if (req.method === 'POST' && req.url === '/send-crm') {
    try {
      const payload = await parseJsonBody(req)
      const crmResponse = await forwardToCrm(payload)
      res.writeHead(crmResponse.status, { 'Content-Type': 'text/plain' })
      res.end(crmResponse.body)
    } catch (error) {
      console.error('CRM proxy error:', error)
      if (!res.headersSent) {
        sendJson(res, 502, { error: 'CRM proxy request failed' })
      } else {
        res.end()
      }
    }
    return
  }

  sendJson(res, 404, { error: 'Not Found' })
})

server.listen(PORT, () => {
  console.log(`CRM proxy listening on port ${PORT}`)
})

