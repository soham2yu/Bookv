import express from "express";
import cors from "cors";
import routes from "./routes";
import path from "path";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  })
);

app.use(express.json());

// Serve generated output PDFs
app.use(
  "/static",
  express.static(path.join(__dirname, "controllers", "shared", "output"))
);

app.use(routes);

const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
