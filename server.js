const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const http = require("http");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Add this at the top, after express.json()

const BASE_URL = "https://dev.superflow.exchange";

// REST API routes
app.get("/api/ohlcv", async (req, res) => {
  const { symbol = "BTCUSDT", timeframe = "1m", limit = 100 } = req.query; // <-- fix here
  try {
    const response = await fetch(
      `${BASE_URL}/ohlcv?symbol=${symbol}&timeframe=${timeframe}&limit=${limit}`
    );
    res.json(await response.json());
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch OHLCV data" });
  }
});

app.get("/api/orderbooks", async (req, res) => {
  const { symbol, limit } = req.query;
  try {
    const response = await fetch(
      `${BASE_URL}/orderbook?symbol=${symbol}&limit=${limit}`
    );
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
  const { username, password } = req.body;
  try {
    const response = await fetch(`${BASE_URL}/create-user`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });
    res.status(response.status).json(await response.json());
  } catch (err) {
    res.status(500).json({ error: "Failed to create user" });
  }
});

app.post("/api/token", async (req, res) => {
  const {
    username,
    password,
    scope = "",
    client_id = "string",
    client_secret = "********",
    grant_type = "password"
  } = req.body;

  const body = `grant_type=${encodeURIComponent(grant_type)}&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&scope=${encodeURIComponent(scope)}&client_id=${encodeURIComponent(client_id)}&client_secret=${encodeURIComponent(client_secret)}`;

  try {
    const response = await fetch(`${BASE_URL}/token`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body,
    });
    res.status(response.status).json(await response.json());
  } catch (err) {
    res.status(500).json({ error: "Failed to login" });
  }
});

app.post("/api/change_password", async (req, res) => {
  const token = req.headers["authorization"]?.replace("Bearer ", "");
  const apiKey = req.headers["api-key"];
  const { new_password, old_password } = req.body;

  if (!token || !new_password || !old_password || !apiKey) {
    return res
      .status(400)
      .json({ error: "Missing token, new password, old password, or API key" });
  }

  // Generate a unique nonce for this request
  const nonce = req.headers["api-nonce"];
  const endpoint = "/mock-api/change_password";
  const signaturePayload = nonce + "POST" + endpoint;
  const signature = crypto
    .createHmac("sha256", old_password)
    .update(signaturePayload)
    .digest("hex");

  // Build the URL with old_password as query param
  const url = `${BASE_URL}/change_password?password=${encodeURIComponent(
    old_password
  )}`;

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
    const authHeader = req.headers["authorization"]; // Extract the Authorization header

    if (!authHeader) {
      return res.status(400).json({ error: "Missing Authorization header" });
    }

    const response = await fetch(
      `${BASE_URL}/account-information`,
      {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: authHeader, // Forward the token
        },
      }
    );

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
      `${BASE_URL}/positions?limit=${limit}`,
      {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: authHeader,
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

    // Log the outgoing request for debugging
    console.log("Sending leverage request:", { symbol, leverage });

    const response = await fetch(`${BASE_URL}/leverage`, {
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
    const authHeader = req.headers["authorization"];
    const orderData = req.body;

    const response = await fetch(`${BASE_URL}/order`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(orderData),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error("Error placing order:", err);
    res.status(500).json({ error: "Failed to place order" });
  }
});

app.get("/api/trades", async (req, res) => {
  const { symbol = "BTCUSDT", limit = 100 } = req.query;
  try {
    const authHeader = req.headers["authorization"];
    const response = await fetch(
      `${BASE_URL}/trades?symbol=${symbol}&limit=${limit}`,
      {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: authHeader,
        },
      }
    );
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Error fetching trades:", err);
    res.status(500).json({ error: "Failed to fetch trades" });
  }
});

app.post("/api/margin-mode", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const { symbol, marginMode } = req.body;

    if (!authHeader || !symbol || !marginMode) {
      return res
        .status(400)
        .json({ error: "Missing auth, symbol, or marginMode" });
    }

    const response = await fetch(`${BASE_URL}/margin-mode`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({ symbol, marginMode }),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to set margin mode" });
  }
});

app.get("/api/open-orders", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(400).json({ error: "Missing Authorization header" });
    }

    const response = await fetch(`${BASE_URL}/orders/open`, {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: authHeader,
      },
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch open orders" });
  }
});

app.post("/api/position-mode", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const { mode } = req.body;

    if (!authHeader || !mode) {
      return res.status(400).json({ error: "Missing Authorization header or mode" });
    }

    const response = await fetch(`${BASE_URL}/position-mode`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({ mode }),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to set position mode" });
  }
});

app.get("/api/current-position", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const { symbol = "BTCUSDT" } = req.query;

    if (!authHeader) {
      return res.status(400).json({ error: "Missing Authorization header" });
    }

    const response = await fetch(`${BASE_URL}/position?symbol=${encodeURIComponent(symbol)}`, {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: authHeader,
      },
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch current position" });
  }
});

app.delete("/api/cancel-order", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const { id, symbol } = req.query;

    if (!id || !symbol) {
      return res.status(400).json({ error: "Missing order id or symbol" });
    }

    const response = await fetch(
      `${BASE_URL}/order?id=${encodeURIComponent(id)}&symbol=${encodeURIComponent(symbol)}`,
      {
        method: "DELETE",
        headers: {
          accept: "application/json",
          Authorization: authHeader,
        },
      }
    );

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to cancel order" });
  }
});

app.post("/api/modify-isolated-balance", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const { action } = req.query;
    const { symbol, positionSide, amount } = req.body;

    if (!authHeader || !action || !symbol || !amount) {
      return res.status(400).json({ 
        error: "Missing required parameters: authHeader, action, symbol, or amount" 
      });
    }

    if (action !== 'deposit' && action !== 'withdraw') {
      return res.status(400).json({ 
        error: "Action must be either 'deposit' or 'withdraw'" 
      });
    }

    const response = await fetch(
      `${BASE_URL}/modify-isolated-balance?action=${action}`,
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({
          symbol,
          positionSide: positionSide || "BOTH",
          amount
        }),
      }
    );

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error("Error modifying isolated balance:", err);
    res.status(500).json({ error: "Failed to modify isolated balance" });
  }
});

app.get("/api/klines", async (req, res) => {
  const {
    symbol = "BTCUSDT",
    timeframe = "1m",
    limit = 500,
    start_time,
    end_time,
  } = req.query;

  try {
    const params = new URLSearchParams({
      symbol,
      timeframe,
      limit: String(limit),
    });
    if (start_time) params.set("start_time", String(start_time));
    if (end_time)   params.set("end_time",   String(end_time));

    const response = await fetch(`${BASE_URL}/klines?${params.toString()}`, {
      method: "GET",
      headers: { accept: "application/json" },
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch klines data" });
  }
});

app.get("/api/siwe/nonce/:accountAddress", async (req, res) => {
  const { accountAddress } = req.params;
  try {
    const response = await fetch(
      `https://superflow.exchange/dev-demo/siwe/nonce/${accountAddress}`,
      {
        method: "GET",
        headers: { accept: "application/json" },
      }
    );
    res.status(response.status).json(await response.json());
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch SIWE nonce" });
  }
});

app.post("/api/siwe/login", async (req, res) => {
  try {
    const response = await fetch("https://superflow.exchange/dev-demo/siwe/login", {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to login with SIWE" });
  }
});

app.post("/api/siwe/register", async (req, res) => {
  try {
    const response = await fetch("https://superflow.exchange/dev-demo/siwe/register", {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to register with SIWE" });
  }
});

// Create an HTTP server
const server = http.createServer(app);

// Start the HTTP server
server.listen(3001, () => {
  console.log("Proxy server running on http://localhost:3001");
});
