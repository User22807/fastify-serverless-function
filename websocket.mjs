import WebSocket from 'ws'; // Ensure you have the 'ws' package installed

/**
 * Connects to the WebSocket server and listens for messages.
 * @param {string} url - The WebSocket URL to connect to.
 */
function fetchOrderBookData(url) {
  const ws = new WebSocket(url);

  ws.on('open', () => {
    console.log('WebSocket connection established.');
  });

  ws.on('message', (data) => {
    try {
      const parsedData = JSON.parse(data);
      console.log('Received data:', parsedData);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed.');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
}

// Usage
const websocketUrl = 'wss://meta-test.rasa.capital/ws/orderbook/BTCUSDT';
fetchOrderBookData(websocketUrl);