import express from "express";
import cors from "cors";
import routes from "./routes";
import path from "path";

const app = express();
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST"],
  credentials: true
}));

app.use(express.json());
app.use("/static", express.static(path.join(__dirname, "shared", "output")));

app.use(routes);

app.listen(5000, () => {
  console.log("🚀 Server running at http://localhost:5000");
});
