import express from "express"
import dotenv from "dotenv"
import cookieParser from "cookie-parser"
import path from "path"
import { fileURLToPath } from "url"

// Routes
import userRoutes from "./routes/userRoutes.js"
import categoryRoutes from "./routes/categoryRoutes.js"
import productRoutes from "./routes/productRoutes.js"
import uploadRoutes from "./routes/uploadRoutes.js"
import orderRoutes from "./routes/orderRoutes.js"

import connectDB from "./config/db.js"

dotenv.config()
const port = process.env.PORT || 5000

connectDB()

const app = express()

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// CORS configuration
app.use((req, res, next) => {
  const allowedOrigins = [
    "http://localhost:3000",
    "https://ecommerce-project-ten-orpin.vercel.app"
  ];
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }

  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});


// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// Routes
app.use("/api/users", userRoutes)
app.use("/api/category", categoryRoutes)
app.use("/api/products", productRoutes)
app.use("/api/upload", uploadRoutes)
app.use("/api/orders", orderRoutes)

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ message: "Server is running!", timestamp: new Date().toISOString() })
})

app.listen(port, () => console.log(`Server running on port: ${port}`))
