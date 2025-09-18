const express = require("express");
const { MongoClient } = require("mongodb");

const app = express();
app.use(express.json());

// --- Mongo connection (reused across invocations) ---
let clientPromise;  // a single promise reused by all requests
let db;

function getClientPromise() {
  if (!clientPromise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("Missing MONGODB_URI environment variable");
    }
    const client = new MongoClient(uri);
    clientPromise = client.connect();
  }
  return clientPromise;
}

async function getDb() {
  if (!db) {
    const client = await getClientPromise();
    db = client.db(process.env.MONGODB_DB || "scoresdb");
  }
  return db;
}

// --- Routes ---
app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.post("/scores", async (req, res) => {
  try {
    const { name, score } = req.body;
    if (!name || typeof score !== "number") {
      return res.status(400).json({ error: "Name and score are required" });
    }
    const db = await getDb();
    await db.collection("scores").insertOne({
      name: name.trim(),
      score,
      created_at: new Date(),
    });
    res.status(201).json({ message: "Score added successfully" });
  } catch (err) {
    console.error("Add score error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/scores", async (_req, res) => {
  try {
    const db = await getDb();
    const scores = await db
      .collection("scores")
      .find({})
      .sort({ score: -1, created_at: 1 })
      .limit(10)
      .toArray();
    res.json(scores);
  } catch (err) {
    console.error("Fetch scores error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// --- Export a Vercel-style handler (no serverless-http) ---
module.exports = (req, res) => app(req, res);
