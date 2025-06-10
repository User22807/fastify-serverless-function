import Fastify from 'fastify'

const app = Fastify({
  logger: true,
})

// Fetch data from the external API
async function fetchData() {
  const response = await fetch('https://meta-test.rasa.capital/mock-api/markets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ key: 'value' }) // Replace with the actual payload if needed
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch data: ${response.statusText}`)
  }

  return response.json()
}

app.get('/', async (req, reply) => {
  try {
    const data = await fetchData()
    return reply.status(200).type('application/json').send(data)
  } catch (error) {
    app.log.error(error)
    return reply.status(500).send({ error: 'Failed to fetch data' })
  }
})

export default async function handler(req, reply) {
  await app.ready()
  app.server.emit('request', req, reply)
}
