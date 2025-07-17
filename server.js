const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const http = require("http");

const app = express();
app.use(cors());
app.use(express.json());

const BASE_URL = "https://meta-test.rasa.capital/mock-api";

// REST API routes
app.get("/api/ohlcv", async (req, res) => {
  const { symbol = "BTCUSDT", timeframe = 100, limit = 100 } = req.query;
  try {
    const response = await fetch(`${BASE_URL}/ohlcv?symbol=${symbol}&timeframe=${timeframe}&limit=${limit}`);
    res.json(await response.json());
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch OHLCV data" });
  }
});

app.get("/api/orderbooks", async (req, res) => {
  const { symbol, limit } = req.query;
  try {
    const response = await fetch(`${BASE_URL}/orderbook?symbol=${symbol}&limit=${limit}`);
    res.json(await response.json());
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orderbook data" });
  }
});

app.get("/api/ticker", async (req, res) => {
  const { symbol } = req.query;
  try {
    const response = await fetch(`${BASE_URL}/ticker?symbol=${symbol}`);
    res.json(await response.json());
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch ticker data" });
  }
});

app.get("/api/markets", async (req, res) => {
  try {
    const response = await fetch(`${BASE_URL}/markets`);
    res.json(await response.json());
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch markets data" });
  }
});

app.get("/api/balance", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const response = await fetch(`${BASE_URL}/balance`, {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: authHeader, // forward the token
      },
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch balance" });
  }
});

app.post("/api/create_user", async (req, res) => {
  const { username, password } = req.query;
  const url = `${BASE_URL}/create_user?username=${username}&password=${password}`;
  const response = await fetch(url, { method: "POST" });
  res.json(await response.json());
});

app.post("/api/token", async (req, res) => {
  const { username, password } = req.query;
  const body = `username=${username}&password=${password}`;
  const response = await fetch(`${BASE_URL}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  res.json(await response.json());
});

app.post("/api/change_password", async (req, res) => {
  const token = req.headers["authorization"]?.replace("Bearer ", "");
  const apiKey = req.headers["api-key"];
  const { new_password, old_password } = req.body;

  if (!token || !new_password || !old_password || !apiKey) {
    return res.status(400).json({ error: "Missing token, new password, old password, or API key" });
  }

  // Generate a unique nonce for this request
  const nonce = req.headers["api-nonce"];
  const endpoint = "/mock-api/change_password";
  const signaturePayload = nonce + "POST" + endpoint;
  const signature = crypto.createHmac("sha256", old_password).update(signaturePayload).digest("hex");

  // Build the URL with old_password as query param
  const url = `${BASE_URL}/change_password?password=${encodeURIComponent(old_password)}`;

  console.log("nonce:", nonce);
  console.log("payload:", signaturePayload);
  console.log("signature:", signature);
  console.log("old_password (frontend):", old_password);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        accept: "application/json",
        "API-NONCE": nonce,
        "API-SIGNATURE": signature,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ new_password }),
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to change password" });
  }
});

app.get("/api/account-information", async (req, res) => {
  try {
    // Debug: print incoming headers
    console.log("Proxy /api/account-information DEBUG:");
    console.log("Received headers:", req.headers);

    const nonce = req.headers["api-nonce"];
    const signature = req.headers["api-signature"];
    const apiKey = req.headers["api-key"]; // <-- get API-KEY

    if (!nonce || !signature || !apiKey) {
      return res.status(400).json({ error: "Missing API key, nonce or signature in request" });
    }

    const endpoint = "/mock-api/account-information";
    const response = await fetch(`https://meta-test.rasa.capital${endpoint}`, {
      method: "GET",
      headers: {
        "API-KEY": apiKey, // <-- forward API-KEY
        "API-NONCE": nonce,
        "API-SIGNATURE": signature,
        accept: "application/json",
      },
    });

    const text = await response.text();
    console.log("API response status:", response.status);
    console.log("API response body:", text);

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    res.json(data);
  } catch (err) {
    console.error("Proxy error fetching account information:", err);
    res.status(500).json({ error: "Failed to fetch account information" });
  }
});

app.get("/api/account-information-direct", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"]; // Extract the Authorization header

    if (!authHeader) {
      return res.status(400).json({ error: "Missing Authorization header" });
    }

    const response = await fetch("https://meta-test.rasa.capital/account-information", {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: authHeader, // Forward the token
      },
    });

    const data = await response.json();
    res.status(response.status).json(data); // Return the response to the client
  } catch (err) {
    console.error("Error fetching account information:", err);
    res.status(500).json({ error: "Failed to fetch account information" });
  }
});

app.get("/api/positions", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const { limit = 20 } = req.query;
    const response = await fetch(
      `https://meta-test.rasa.capital/mock-api/positions?limit=${limit}`,
      {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: authHeader, // forward the JWT
        },
      }
    );
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch positions" });
  }
});

app.post("/api/leverage", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const { symbol, leverage } = req.body;

    const response = await fetch("https://meta-test.rasa.capital/mock-api/leverage", {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({ symbol, leverage }),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to set leverage" });
  }
});

app.post("/api/order", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"]; // JWT token
    const orderData = req.body; // Order payload

    // Forward the order to the real API
    const response = await fetch("https://meta-test.rasa.capital/order", {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        Authorization: authHeader, // Forward the token
      },
      body: JSON.stringify(orderData), // Forward the order payload
    });

    const data = await response.json();
    res.status(response.status).json(data); // Return the response to the client
  } catch (err) {
    console.error("Error placing order:", err);
    res.status(500).json({ error: "Failed to place order" });
  }
});

app.get("/api/trades", async (req, res) => {
  const { symbol = "BTCUSDT", limit = 100 } = req.query; // Default values for symbol and limit
  try {
    const response = await fetch(`${BASE_URL}/trades?symbol=${symbol}&limit=${limit}`, {
      method: "GET",
      headers: {
        accept: "application/json", // Set the required header
      },
    });
    const data = await response.json();
    res.json(data); // Send the fetched data back to the client
  } catch (err) {
    console.error("Error fetching trades:", err);
    res.status(500).json({ error: "Failed to fetch trades" });
  }
});

// Create an HTTP server
const server = http.createServer(app);


// Start the HTTP server
server.listen(3001, () => {
  console.log("Proxy server running on http://localhost:3001");
});