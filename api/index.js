const express = require("express");
const serverless = require("serverless-http");
const { MongoClient } = require("mongodb");

const app = express();
app.use(express.json());

// Reuse the client across invocations (good for Vercel)
let client;
let db;

async function connectDB() {
  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    db = client.db(process.env.MONGODB_DB || "scoresdb");
  }
  return db;
}

// Add new score
app.post("/scores", async (req, res) => {
  try {
    const { name, score } = req.body;
    if (!name || typeof score !== "number") {
      return res.status(400).json({ error: "Name and score are required" });
    }
    const db = await connectDB();
    await db.collection("scores").insertOne({
      name: name.trim(),
      score,
      created_at: new Date(),
    });
    res.status(201).json({ message: "Score added successfully" });
  } catch (err) {
    console.error("Error inserting score:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get top 10 scores
app.get("/scores", async (_req, res) => {
  try {
    const db = await connectDB();
    const scores = await db
      .collection("scores")
      .find({})
      .sort({ score: -1, created_at: 1 })
      .limit(10)
      .toArray();
    res.json(scores);
  } catch (err) {
    console.error("Error fetching scores:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Health check
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

module.exports = app;
module.exports.handler = serverless(app);
