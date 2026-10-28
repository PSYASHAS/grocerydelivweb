# 🎓 RVCE CSE Department - Second Year Skill Lab Mapping
## Course: Full Stack Development (MERN Stack Capstone Project)

This document shows how **FreshCart Grocery Delivery** directly implements every single concept and practical activity from the 5-Day Skill Lab curriculum:

---

### 📅 Day 1 (22 OCT 2026): Web Fundamentals, HTML, CSS, Responsive Design
- **Morning Syllabus**: Web fundamentals, HTML5 semantic structure, CSS3 styling, responsive design (Flexbox & CSS Grid).
- **Afternoon Practical**: Portfolio + Git basics.
- **Implementation in FreshCart**:
  - `frontend/index.html`: Fully semantic HTML5 layout (`<nav>`, `<main>`, `<section>`, `<header>`).
  - `frontend/css/styles.css`:
    - Responsive CSS Grid for grocery cards: `grid-template-columns: repeat(auto-fill, minmax(240px, 1fr))`.
    - Modern Flexbox navigation, sticky header, pill-style category filters.
    - Media queries supporting mobile (< 768px) and desktop (> 1024px).
    - Modern CSS variables (`--primary`, `--radius`, `--shadow`).
    - Device simulator frame showing smartphone UI directly in browser.
  - **Git Basics**: Initialized repository with structured commits, `.gitignore`, and branching strategy (`main`, `develop`, `feature/inventory-and-orders`).

---

### 📅 Day 2 (23 OCT 2026): JavaScript, DOM, JSON, APIs
- **Morning Syllabus**: Modern ES6+ JavaScript, DOM manipulation, JSON data interchange, Fetch / REST APIs.
- **Afternoon Practical**: Interactive Task Manager.
- **Implementation in FreshCart**:
  - `frontend/js/api.js`: Asynchronous API client using `async/await`, `fetch()`, `URLSearchParams`, and proper JSON request/response handling.
  - `frontend/js/app.js`:
    - Dynamic state management (`useState`, `useEffect`, `useMemo`).
    - Real-time client-side search filtering and category filtering.
    - Interactive quantity steppers (`+` / `-`) manipulating cart state in real-time.
    - Persistent cart synchronization with browser `localStorage`.
    - Dynamic calculation of subtotal, delivery charges, and promo thresholds.

---

### 📅 Day 3 (24 OCT 2026): Node.js, Express, REST API
- **Morning Syllabus**: Node.js runtime, Express framework, RESTful API architecture, routing, middleware.
- **Afternoon Practical**: Student REST API + Postman.
- **Implementation in FreshCart**:
  - `backend/server.js`: Express server with CORS middleware, JSON body parser, and request logging.
  - MVC Architecture:
    - `controllers/productController.js`: CRUD endpoints (`GET /api/products`, `POST /api/products`, etc.).
    - `controllers/orderController.js`: Order placement with stock validation and tracking.
    - `controllers/inventoryController.js`: Stock alerts and restocking endpoints.
    - `controllers/authController.js`: User authentication & JWT tokens.
    - `routes/`: Modular Express Routers (`productRoutes.js`, `orderRoutes.js`, etc.).
  - **Postman Practical Requirement**:
    - `FreshCart_Postman_Collection.json`: Complete, ready-to-import Postman collection with organized folders for Products, Orders, Inventory, and Auth.

---

### 📅 Day 4 (27 OCT 2026): MongoDB + Database Integration
- **Morning Syllabus**: NoSQL database principles, MongoDB Atlas / Compass, Mongoose schemas, document relationships, data validation.
- **Afternoon Practical**: Full-stack Student Management App.
- **Implementation in FreshCart**:
  - `backend/models/Product.js`: Mongoose Schema with validation, default values, text indexes for search, and composite indexes for category sorting.
  - `backend/models/Order.js`: Embedded sub-document schema for order items, customer delivery details, and order status tracking timeline.
  - `backend/models/User.js`: User schema supporting roles (`customer`, `admin`, `delivery`).
  - `backend/data/seed.js`: Database seeder script with 24 realistic grocery items, initial stock, and demo user accounts.
  - `backend/config/db.js`: Dual-mode database connection. Connects to MongoDB (`mongodb://localhost:27017/freshcart_db`) with an automated persistent JSON datastore fallback for guaranteed demo uptime.

---

### 📅 Day 5 (28 OCT 2026): GitHub, Branching, Collaboration, Hackathon
- **Morning Syllabus**: GitHub branching strategies (`git branch`, `git checkout`, pull requests), team collaboration.
- **Afternoon Practical**: Capstone development, Testing and Demo.
- **Implementation in FreshCart**:
  - **Git Branching**: Structured branches (`main`, `develop`, `feature/inventory-and-orders`).
  - **Testing**: Automated integration test suite (`backend/tests/api.test.js`) verifying 14/14 test cases (health, catalog, search, stock deduction, order lifecycle).
  - **Capstone Demo Deliverables**:
    - Dual Storefront + Admin Dashboard single-page React app.
    - Companion React Native mobile application (`mobile/App.js`).
    - Live order status transition simulator.
    - Comprehensive documentation and Viva Q&A preparation cheat sheet.
