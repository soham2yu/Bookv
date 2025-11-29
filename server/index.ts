import express, { type Request, Response, NextFunction } from "express";
import routes from "./routes";
import { createServer } from "http";
import path from "path";




const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const pathRoute = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (pathRoute.startsWith("/api")) {
      let logLine = `${req.method} ${pathRoute} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(logLine);
    }
  });

  next();
});

// ---- STATIC PDF FILES ----
const filesDir = path.join(__dirname, "server_output");
app.use("/files", express.static(filesDir));

(async () => {
app.use("/api", routes);


  app.use("/api", routes);   

  // ---- HEALTH CHECK + ROOT ROUTE ----
  app.get("/", (_req, res) => {
    res.status(200).json({
      message: "Backend running successfully",
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });


  // ---- ERROR HANDLER ----
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  console.log("⚠ Static serving disabled temporarily");

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(port, "localhost", () => {
    log(`🚀 Server running at http://localhost:${port}`);
  });
})();
