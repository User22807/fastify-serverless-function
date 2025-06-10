import Fastify from 'fastify'

const app = Fastify({
  logger: true,
})

// Fetch data from the external API
async function fetchData() {
  const response = await fetch('https://meta-test.rasa.capital/mock-api/markets', {
    method: 'GET', // Use GET as per the curl template
    headers: {
      'accept': 'application/json', // Set the 'accept' header as specified in the curl template
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

app.get('/', async (req, reply) => {
  try {
    const data = await fetchData()
    return reply.status(200).type('application/json').send(data)
  } catch (error) {
    app.log.error(error)
    return reply.status(500).send({ error: 'Failed to fetch data', details: error.message })
  }
})

export default async function handler(req, reply) {
  await app.ready()
  app.server.emit('request', req, reply)
}
