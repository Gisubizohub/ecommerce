# E-commerce Backend (Express + TypeScript + MongoDB + Cloudinary + Swagger)

## Setup
1. Install Node 18+ and have MongoDB running (local or Atlas).
2. `npm install`
3. Copy `.env.example` to `.env` and fill in your values.
4. `npm run dev` then open http://localhost:1000/api-docs

## Structure
```
src/
  config/       database.ts, cloudinary.ts
  controller/   auth, category, product, order
  middleware/   auth (authenticate + authorize), upload (multer), validateObjectId, error
  model/        user, category, product, order
  router/       auth, category, product, order  (Swagger docs live here)
  utils/        asyncHandler, httpError, cloudinaryUpload
  swagger.ts
  server.ts
```

## Endpoints (all under /api)
| Area | Endpoint | Who |
|---|---|---|
| Auth | POST /auth/register, POST /auth/login | public |
| Categories | GET /categories, GET /categories/:id | logged in |
| | POST, PUT /:id, DELETE /:id on /categories | admin |
| Products | GET /products (?page&limit&categoryId), GET /products/:id | logged in |
| | POST /products, PUT /products/:id, DELETE /products/:id | admin |
| Orders | POST /orders, GET /orders, GET /orders/:id, PATCH /orders/:id/cancel | logged in (own orders) |
| | PATCH /orders/:id/status | admin |

## Making your first admin
Everyone who registers is a `user`. Register once, then in MongoDB (mongosh or Compass) run:
```
db.users.updateOne({ email: "you@example.com" }, { $set: { role: "admin" } })
```
Log in again afterwards so the new token carries the admin role.

## Postman test flow
1. POST /api/auth/register, then POST /api/auth/login, copy `token`. In Postman use Authorization > Bearer Token.
2. (admin) POST /api/categories `{ "name": "Electronics", "description": "..." }`
3. (admin) POST /api/products as **form-data**: name, price, stock, categoryId, and `image` (type File).
4. POST /api/orders `{ "items": [ { "productId": "<id>", "quantity": 2 } ] }`
5. GET /api/orders, then PATCH /api/orders/:id/status (admin) `{ "status": "paid" }`
In Swagger UI click **Authorize** and paste the token (without the word Bearer).

## Design notes
- Order total is calculated on the server from current product prices; each order item stores the price at purchase time.
- Stock is decremented atomically when an order is placed and returned if the order is cancelled or creation fails midway.
- Orders have no DELETE on purpose; use cancel so the history is kept.
- Order also stores `userId`, and Product also stores `imagePublicId` (needed to delete images from Cloudinary). These are additions to your diagram.
