const express = require("express");
const serverless = require("serverless-http");

const app = express();

app.get("/health", (req, res) => {
  res.status(200).json({ ok: true });
});

module.exports = serverless(app);
