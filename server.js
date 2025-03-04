import express from "express";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import "dotenv/config";

const app = express();
const port = process.env.PORT || 3000;
const apiKey = process.env.OPENAI_API_KEY;

// Configure Vite middleware for React client
const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: "custom",
});
app.use(vite.middlewares);

// API route for WebRTC token generation
app.get("/token", async (req, res) => {
  try {
    console.log("🔄 Requesting WebRTC token from OpenAI...");

    // Ensure the API key is available
    if (!apiKey) {
      throw new Error("Missing OpenAI API Key. Check your .env file.");
    }

    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: "sage",
      }),
    });

    console.log("🔍 OpenAI API Response Status:", response.status);
    const data = await response.json();
    console.log("🔍 OpenAI API Response Data:", data);

    if (!response.ok) {
      throw new Error(`OpenAI API Error: ${data.error?.message || "Unknown error"}`);
    }

    // ✅ Fix: Extract `client_secret.value` instead of `token`
    const token = data.client_secret?.value;
    if (!token) {
      throw new Error("No client secret received from OpenAI");
    }

    console.log("✅ WebRTC client secret received:", token);
    res.json({ token });
  } catch (error) {
    console.error("❌ Token generation error:", error.message);
    res.status(500).json({ error: error.message });
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
    res.status(200).set({ "Content-Type": "text/html" }).end(html);
  } catch (e) {
    vite.ssrFixStacktrace(e);
    next(e);
  }
});

app.listen(port, () => {
  console.log(`Express server running on *:${port}`);
});
