import "dotenv/config"; // must stay the first import so env vars exist for every other module
import express from "express";
import swaggerUi from "swagger-ui-express";
import { connectDB } from "./config/database";
import { errorHandler, notFound } from "./middleware/error.middleware";
import authRouter from "./router/auth.router";
import categoryRouter from "./router/category.router";
import orderRouter from "./router/order.router";
import productRouter from "./router/product.router";
import { swaggerSpec } from "./swagger";

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is missing in .env");
  process.exit(1);
}

const app = express();
const port = process.env.PORT || 1000;

app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/", (_req, res) => {
  res.send("E-commerce API is running. Docs at /api-docs");
});

app.use("/api/auth", authRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/products", productRouter);
app.use("/api/orders", orderRouter);

app.use(notFound);
app.use(errorHandler);

connectDB().then(() => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Swagger docs available at http://localhost:${port}/api-docs`);
  });
});
