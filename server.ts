import express from "express";
import { createServer as createViteServer } from "vite";
import { addLog, getLogs, deleteLog } from "./src/db";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/logs", (req, res) => {
    try {
      const logs = getLogs();
      res.json(logs);
    } catch (error) {
      console.error("Error fetching logs:", error);
      res.status(500).json({ error: "Failed to fetch logs" });
    }
  });

  app.post("/api/logs", (req, res) => {
    try {
      const result = addLog(req.body);
      res.json({ success: true, id: result.lastInsertRowid });
    } catch (error) {
      console.error("Error adding log:", error);
      res.status(500).json({ error: "Failed to add log" });
    }
  });

  app.delete("/api/logs/:id", (req, res) => {
    try {
      deleteLog(Number(req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting log:", error);
      res.status(500).json({ error: "Failed to delete log" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, we would serve static files from dist
    // But for this environment, we rely on the dev setup mostly or simple static serve
    // For now, the dev middleware handles it or we assume build output
    // Adding basic static serve for completeness if built
    const path = await import("path");
    app.use(express.static(path.resolve(__dirname, "dist")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
