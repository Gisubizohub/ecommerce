import path from "path";
import swaggerJSDoc from "swagger-jsdoc";

// forward slashes so the glob also works on Windows
const routerGlob = path.join(__dirname, "router", "*.{ts,js}").replace(/\\/g, "/");

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "E-commerce API",
      version: "1.0.0",
      description: "Categories, products (Cloudinary images) and orders, secured with JWT",
    },
    servers: [{ url: "/api", description: "Current server" }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
      schemas: {
        Category: {
          type: "object",
          properties: {
            _id: { type: "string", example: "60c72b2f9b1d8b2884bf9600" },
            name: { type: "string", example: "Electronics" },
            description: { type: "string", example: "Phones, laptops and accessories" },
          },
        },
        CategoryInput: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string", example: "Electronics" },
            description: { type: "string", example: "Phones, laptops and accessories" },
          },
        },
        Product: {
          type: "object",
          properties: {
            _id: { type: "string", example: "60c72b2f9b1d8b2884bf9660" },
            name: { type: "string", example: "Wireless Mouse" },
            price: { type: "number", example: 25.5 },
            stock: { type: "integer", example: 100 },
            categoryId: { type: "string", example: "60c72b2f9b1d8b2884bf9600" },
            imageUrl: { type: "string", example: "https://res.cloudinary.com/demo/image/upload/products/mouse.jpg" },
          },
        },
        OrderItemInput: {
          type: "object",
          required: ["productId", "quantity"],
          properties: {
            productId: { type: "string", example: "60c72b2f9b1d8b2884bf9660" },
            quantity: { type: "integer", minimum: 1, example: 2 },
          },
        },
        Order: {
          type: "object",
          properties: {
            _id: { type: "string" },
            userId: { type: "string" },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  productId: { type: "string" },
                  quantity: { type: "integer" },
                  price: { type: "number", description: "Unit price when the order was placed" },
                },
              },
            },
            totalPrice: { type: "number", example: 51 },
            status: { type: "string", enum: ["pending", "paid", "shipped", "delivered", "cancelled"] },
          },
        },
      },
    },
  },
  apis: [routerGlob],
};

export const swaggerSpec = swaggerJSDoc(options);
