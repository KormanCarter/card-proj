require("dotenv").config();
const express = require("express");
const fs = require("fs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

const SECRET_KEY = process.env.SECRET_KEY;
const CARDS_FILE = "cards.json";

// Load users.json
const users = JSON.parse(fs.readFileSync("users.json", "utf8"));

// Load cards.json
let cards = JSON.parse(fs.readFileSync(CARDS_FILE, "utf8")).cards;

// Helper function to save cards to file
function saveCards() {
  fs.writeFileSync(CARDS_FILE, JSON.stringify({ cards }, null, 2), "utf8");
}

// JWT Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ errorMessage: "Access token required" });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(401).json({ errorMessage: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
}

// Authentication Endpoint
app.post("/getToken", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ errorMessage: "Username and password are required" });
  }

  const user = users.find(
    u => u.username === username && u.password === password
  );

  if (!user) {
    return res.status(401).json({
      errorMessage: "Invalid username or password"
    });
  }

  const token = jwt.sign(
    { username: user.username },
    SECRET_KEY,
    { expiresIn: "30m" }
  );

  res.json({ token });
});

// GET /cards - Retrieve all cards with optional filtering
app.get("/cards", (req, res) => {
  let results = [...cards];
  for (const key in req.query) {
    results = results.filter(card => String(card[key]) === req.query[key]);
  }
  res.json(results);
});

// POST /cards/create - Create a new card (protected)
app.post("/cards/create", authenticateToken, (req, res) => {
  const newCard = req.body;

  if (!newCard.id) {
    return res.status(400).json({ errorMessage: "Card id is required" });
  }

  const exists = cards.some(card => card.id === newCard.id);
  if (exists) {
    return res.status(400).json({ errorMessage: "Card id must be unique" });
  }

  cards.push(newCard);
  saveCards();
  res.status(201).json({ successMessage: "Card created successfully", card: newCard });
});

// PUT /cards/:id - Update an existing card (protected)
app.put("/cards/:id", authenticateToken, (req, res) => {
  const id = Number(req.params.id);
  const updatedData = req.body;

  const index = cards.findIndex(card => card.id === id);
  if (index === -1) {
    return res.status(404).json({ errorMessage: "Card not found" });
  }

  if (updatedData.id && updatedData.id !== id) {
    const idExists = cards.some(card => card.id === updatedData.id);
    if (idExists) {
      return res.status(400).json({ errorMessage: "Card id must be unique" });
    }
  }

  cards[index] = { ...cards[index], ...updatedData };
  saveCards();
  res.json({ successMessage: "Card updated successfully", card: cards[index] });
});

// DELETE /cards/:id - Delete an existing card (protected)
app.delete("/cards/:id", authenticateToken, (req, res) => {
  const id = Number(req.params.id);

  const index = cards.findIndex(card => card.id === id);
  if (index === -1) {
    return res.status(404).json({ errorMessage: "Card not found" });
  }

  const deleted = cards.splice(index, 1)[0];
  saveCards();
  res.json({ successMessage: "Card deleted successfully", card: deleted });
});

// Optional Endpoints
// GET /sets - Retrieve all card sets
app.get("/sets", (req, res) => {
  const sets = [...new Set(cards.map(card => card.set))];
  res.json(sets);
});

// GET /types - Retrieve all card types
app.get("/types", (req, res) => {
  const types = [...new Set(cards.map(card => card.type))];
  res.json(types);
});

// GET /rarities - Retrieve all card rarities
app.get("/rarities", (req, res) => {
  const rarities = [...new Set(cards.map(card => card.rarity))];
  res.json(rarities);
});

// GET /cards/count - Retrieve total number of cards
app.get("/cards/count", (req, res) => {
  res.json({ count: cards.length });
});

// GET /cards/random - Retrieve a random card
app.get("/cards/random", (req, res) => {
  const randomIndex = Math.floor(Math.random() * cards.length);
  res.json(cards[randomIndex]);
});

// Error handling middleware for 500 errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ errorMessage: "Internal server error" });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
