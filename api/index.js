const express = require("express");
const serverless = require("serverless-http");

const app = express();

app.get("/health", (req, res) => {
  res.status(200).json({ ok: true });
});

// Export correctly for Vercel
module.exports = app;
module.exports.handler = serverless(app);
