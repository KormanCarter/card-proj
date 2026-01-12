require("dotenv").config();
const express = require("express");
const fs = require("fs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

const SECRET_KEY = process.env.SECRET_KEY;

// Load users.json
const users = JSON.parse(fs.readFileSync("users.json", "utf8"));

app.post("/getToken", (req, res) => {
  const { username, password } = req.body;

  const user = users.find(
    u => u.username === username && u.password === password
  );

  if (!user) {
    return res.status(401).json({
      error: "Invalid username or password"
    });
  }

  const token = jwt.sign(
    { username: user.username },
    SECRET_KEY,
    { expiresIn: "30m" }
  );

  res.json({ token });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});

app.post("/cards", (req, res) => {
    if (!user){
       throw new error("access denied")
    }
})