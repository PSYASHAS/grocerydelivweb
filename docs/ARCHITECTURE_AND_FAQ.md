# 🎯 FreshCart - Technical Architecture & System FAQ

This document outlines the architectural decisions, database models, state management, and scalability strategies implemented across the **FreshCart Grocery Delivery Platform**.

---

### Q1: What is the MERN Stack and how is data exchanged between layers in FreshCart?
**Answer**:
MERN stands for **MongoDB** (NoSQL Database), **Express.js** (Backend Web Framework), **React** (Frontend UI Library), and **Node.js** (JavaScript Runtime).
- The **React frontend** sends asynchronous HTTP requests (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) via the Fetch API client (`frontend/js/api.js`).
- The **Node.js / Express backend** receives requests, parses JSON payloads using middleware, applies business logic (e.g. stock checking in controllers), and interacts with **MongoDB** via Mongoose models.
- The backend responds with standard HTTP status codes (`200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found`) and structured JSON payloads.

---

### Q2: How did you handle inventory stock reduction when an order is placed?
**Answer**:
Inventory deduction is handled in `backend/controllers/orderController.js` inside `createOrder`:
1. Before committing an order, the system iterates through each requested item and verifies that `product.stockQuantity >= requestedQuantity`.
2. If any item has insufficient stock, the transaction is rejected immediately with HTTP 400 and an informative error message.
3. For validated items, the stock is decremented (`product.stockQuantity -= quantity`) atomically before creating the order record.
4. In production MongoDB, this uses an atomic `$inc: { stockQuantity: -quantity }` with a condition `{ stockQuantity: { $gte: quantity } }` to eliminate race conditions.

---

### Q3: Why choose MongoDB instead of a Relational Database (like MySQL) for grocery delivery?
**Answer**:
1. **Dynamic Schema**: Grocery items vary in attributes (e.g. perishables have shelf-life and units like `1 kg` or `bunch`, while packaged items have barcodes and nutritional facts). Document models handle polymorphic attributes naturally without messy join tables.
2. **Embedded Documents for Orders**: An order placed at a specific time must permanently preserve the product name, price, and unit *as it was at checkout*, even if the product catalog price changes later. MongoDB allows embedding order line items directly inside the order document.
3. **Horizontal Scalability**: E-commerce platforms experience high read volume during flash sales; MongoDB sharding allows horizontal scaling across clusters.

---

### Q4: How is state managed in the React Frontend?
**Answer**:
We utilize React Functional Components with built-in Hooks:
- `useState`: Manages dynamic local state such as `products`, `cart`, `selectedCategory`, `searchQuery`, `activeOrder`, and `currentUser`.
- `useEffect`: Triggers side-effects, such as fetching products when category or search filters change, and syncing the cart to `localStorage`.
- `useMemo`: Optimizes performance by computing derived values (e.g. `cartItemCount`, `subtotal`, `deliveryFee`) only when dependencies change, avoiding redundant recalculations.

---

### Q5: What is the difference between the React Web app and the React Native app?
**Answer**:
- **React (Web)**: Renders HTML elements to the browser's Document Object Model (DOM) using primitives like `<div>`, `<span>`, `<button>`, and `<input>`, styled with standard CSS.
- **React Native**: Renders to **native mobile UI platform components** on iOS and Android (e.g., `UIView` on iOS and `android.view.View` on Android) via a bridge/JSI. It uses primitives like `<View>`, `<Text>`, `<TouchableOpacity>`, and `<FlatList>`, styled with `StyleSheet.create()`.
- Both web and mobile clients share the exact same Node.js REST API endpoints.

---

### Q6: What are Middlewares in Express.js and which ones are used?
**Answer**:
A middleware is a function that has access to the request object (`req`), response object (`res`), and the `next` function in the application’s request-response cycle.
In FreshCart:
1. `cors()`: Enables Cross-Origin Resource Sharing so our React web and mobile apps can safely communicate with the backend.
2. `express.json()`: Built-in body-parser that parses incoming requests with JSON payloads and populates `req.body`.
3. Custom request logger middleware: Logs the HTTP method, URL, and timestamp for auditing and debugging.
4. `express.static()`: Serves static frontend client assets directly.

---

### Q7: How does search and category filtering work?
**Answer**:
We implemented dual-level filtering:
- **Server-Side REST Query**: The client passes query parameters (e.g. `/api/products?category=Dairy%20%26%20Breakfast&search=milk`).
- In MongoDB, regex text queries (`{ name: { $regex: search, $options: 'i' } }`) match case-insensitively, supported by MongoDB text indexes.
- In the frontend, the search bar has instant debounced response to keep UI latency under 16ms for 60fps rendering.

---

### Q8: How does the live order tracking feature work?
**Answer**:
1. When an order is placed, an initial record is created with `orderStatus: 'Placed'` and a unique tracking code (e.g., `FC-102938`) and a 4-digit verification OTP.
2. The order schema includes a `timeline` array capturing every state transition (`Placed` ➔ `Packing` ➔ `Out for Delivery` ➔ `Delivered`) along with timestamps and notes.
3. The Admin/Delivery dashboard triggers `PATCH /api/orders/:id/status` to progress orders, and the customer UI periodically polls or updates via WebSocket / REST to render the animated 4-node visual stepper.

---

### Q9: How are automated tests implemented?
**Answer**:
Automated tests are written in `backend/tests/api.test.js` using Node.js's built-in assertion and test runner capabilities.
- 17 automated tests verify:
  1. System Health check (`/api/health`)
  2. Catalog listing, category filtering, and keyword search
  3. CRUD operations: Create Product (`POST`), Update Product (`PUT`), Delete Product (`DELETE`)
  4. Warehouse inventory metrics calculation (total SKUs, low stock count, valuation)
  5. Warehouse restocking endpoint (`PATCH /api/inventory/:id/restock`)
  6. Order creation, atomic stock deduction, and status transitions
  7. Authentication and role access
- Run with `node backend/tests/api.test.js`.
