import Fastify from 'fastify';
import cors from '@fastify/cors';

const app = Fastify({
  logger: true,
});

// Register the CORS plugin
app.register(cors, {
  origin: '*', // Allow all origins (you can restrict this to specific origins if needed)
});

// Fetch data from the external API
async function fetchData() {
  const response = await fetch('https://meta-test.rasa.capital/mock-api/markets', {
    method: 'GET',
    headers: {
      'accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

app.get('/', async (req, reply) => {
  try {
    const data = await fetchData();
    return reply.status(200).type('application/json').send(data);
  } catch (error) {
    app.log.error(error);
    return reply.status(500).send({ error: 'Failed to fetch data', details: error.message });
  }
});

export default async function handler(req, reply) {
  await app.ready();
  app.server.emit('request', req, reply);
}
