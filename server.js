import EntryClient from './client/entry-client.jsx';
import express from "express";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
dotenv.config();  // Load environment variables

const app = express();
const port = process.env.PORT || 3000;

// OpenAI API Key (Pulled from Render environment variables)
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.warn("⚠️ WARNING: OpenAI API Key is missing! Set OPENAI_API_KEY in environment variables.");
} else {
  console.log("✅ OpenAI API Key loaded successfully.");
}

// Configure Vite middleware for React client
const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: "custom",
});
app.use(vite.middlewares);

// API route for token generation
app.get("/token", async (req, res) => {
  console.log("🔍 Received `/token` request...");

  if (!apiKey) {
    console.error("❌ ERROR: Missing OpenAI API Key!");
    return res.status(500).json({ error: "Missing OpenAI API Key. Please configure it in Render." });
  }

  try {
    console.log("🔑 Using API Key:", apiKey ? "Loaded Successfully" : "Missing");
    
    const requestBody = {
      model: "gpt-4o-realtime-preview-2024-12-17",
      voice: "verse",
    };

    console.log("📤 Sending request to OpenAI:", JSON.stringify(requestBody, null, 2));

    const response = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      },
    );

app.get("/token", async (req, res) => {
  console.log("🔍 Received `/token` request...");

  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  if (!apiKey) {
    console.error("❌ ERROR: Missing OpenAI API Key!");
    return res.status(500).json({ error: "Missing OpenAI API Key. Please configure it in Render." });
  }

  try {
    console.log("📤 Sending request to OpenAI API...");
    
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: "verse",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ OpenAI API Error:", data);
      return res.status(response.status).json(data);
    }

    console.log("✅ OpenAI Response:", JSON.stringify(data, null, 2));
    res.json(data);
  } catch (error) {
    console.error("❌ Server Error:", error);
    res.status(500).json({ error: "Failed to generate token" });
  }
});

    const data = await response.json();
    console.log("✅ OpenAI Response:", JSON.stringify(data, null, 2));

    res.json(data);
  } catch (error) {
    console.error("❌ OpenAI API Error:", error);
    res.status(500).json({ error: "Failed to generate token" });
  }
});

// Render the React client
app.use("*", async (req, res, next) => {
  const url = req.originalUrl;

  try {
    const template = await vite.transformIndexHtml(
      url,
      fs.readFileSync("./client/index.html", "utf-8"),
    );
    const { render } = await vite.ssrLoadModule("./client/entry-server.jsx");
    const appHtml = await render(url);
    const html = template.replace(`<!--ssr-outlet-->`, appHtml?.html);
    
    console.log(`📄 Serving React page for: ${url}`);
    
    res.status(200).set({ "Content-Type": "text/html" }).end(html);
  } catch (e) {
    console.error("❌ SSR Rendering Error:", e);
    vite.ssrFixStacktrace(e);
    next(e);
  }
});

app.listen(port, () => {
  console.log(`🚀 Express server running on *:${port}`);
});

