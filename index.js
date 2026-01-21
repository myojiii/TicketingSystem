import express from "express";
import dotenv from "dotenv";
import path from "path";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import categoryRoutes from "./routes/categories.js";
import ticketRoutes from "./routes/tickets.js";
import messageRoutes from "./routes/messages.js";
import { ensureAssignedTicketsOpen } from "./lib/ticketHelpers.js";
import notificationRoutes from "./routes/notifications.js";
import reportRoutes from "./routes/reports.js";
import connectMongo from "./lib/db.js";

const app = express();
dotenv.config();

const PORT = process.env.PORT || 7000;
const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017/Ticketing";
const rootDir = process.cwd();
app.use(express.json());
app.use(express.static(path.join(rootDir, "public")));
app.use("/staff", express.static(path.join(rootDir, "public", "staff")));
app.use("/admin", express.static(path.join(rootDir, "public", "admin")));
app.use("/client", express.static(path.join(rootDir, "public", "client")));

app.get("/", (req, res) => {
  res.sendFile(path.join(rootDir, "public", "auth", "login.html"));
});

connectMongo(MONGO_URL)
  .then(async () => {
    console.log("MongoDB connected");
    await ensureAssignedTicketsOpen();
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

app.use(authRoutes);
app.use(userRoutes);
app.use(categoryRoutes);
app.use(ticketRoutes);
app.use(messageRoutes);
app.use(notificationRoutes);
app.use(reportRoutes);

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
} else {
  console.log("Vercel serverless mode - not calling listen()");
}

export default app;
