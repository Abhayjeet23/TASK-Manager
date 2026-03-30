# ⚡ MERN TaskFlow — Core Concepts Reference Project

A full-stack Task Manager built with **MongoDB · Express · React · Node.js**.
Every file is heavily annotated to explain the *why*, not just the *what*.

---

## 📁 Project Structure

```
mern-taskmanager/
├── backend/
│   ├── server.js                  ← Express app, middleware chain, DB connect
│   ├── .env.example               ← Environment variable template
│   ├── models/
│   │   ├── User.js                ← Schema, hooks, methods, statics
│   │   └── Task.js                ← References, indexes, virtuals
│   ├── controllers/
│   │   ├── authController.js      ← Register, login, JWT signing
│   │   └── taskController.js      ← Full CRUD + aggregation pipeline
│   ├── routes/
│   │   ├── auth.js                ← POST /register  POST /login  GET /me
│   │   └── tasks.js               ← RESTful task resource routes
│   └── middleware/
│       ├── auth.js                ← JWT protect + role-based restrictTo
│       └── validate.js            ← express-validator chains
│
└── frontend/
    └── src/
        ├── App.jsx                ← Router config, nested/protected routes
        ├── index.js               ← ReactDOM.createRoot entry point
        ├── styles.css             ← Full UI styles with CSS variables
        ├── context/
        │   └── AuthContext.jsx    ← createContext, useReducer, Provider
        ├── hooks/
        │   └── useTasks.js        ← Custom hook: fetch, CRUD, debounce
        ├── utils/
        │   └── api.js             ← Axios instance + interceptors
        ├── components/
        │   ├── ProtectedRoute.jsx ← Route guard with <Outlet />
        │   ├── TaskCard.jsx       ← Props, React.memo, conditional render
        │   └── TaskForm.jsx       ← Controlled form, onSubmit
        └── pages/
            ├── Dashboard.jsx      ← Main page: filters, list, stats
            ├── Login.jsx          ← Auth form + redirect
            └── Register.jsx       ← Registration form
```

---

## 🚀 Quick Start

```bash
# 1. Clone / download the project
cd mern-taskmanager

# 2. Install all dependencies
npm run install:all

# 3. Set up backend environment
cp backend/.env.example backend/.env
# Edit backend/.env with your MongoDB URI + JWT secret

# 4. Start both servers (requires MongoDB running locally)
npm install        # installs concurrently
npm run dev

# Backend → http://localhost:5000
# Frontend → http://localhost:3000
```

---

## 🧠 Core Concepts Covered

### NODE.js & EXPRESS

#### Middleware Chain
```
Request → logger → cors → json parser → route → [auth] → controller → Response
```
Middleware is just a function with `(req, res, next)`. Call `next()` to pass control forward,
or `res.json(...)` to end the chain. Order matters — define middleware before routes.

```js
// Custom middleware pattern
app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();   // ← must call this or request hangs
});
```

#### Express Router
Group related routes with `express.Router()`. Mount with `app.use("/api/tasks", taskRouter)`.
This prefixes all routes inside the router with `/api/tasks`.

#### Global Error Handler
```js
// 4-argument signature = error handler
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ message: err.message });
});
// Triggered by: next(new Error("oops"))
```

---

### MONGODB & MONGOOSE

#### Schema → Model → Document (hierarchy)
```
Schema (blueprint) → Model (class) → Document (instance / row)
```

```js
const schema = new mongoose.Schema({ name: String });  // blueprint
const User = mongoose.model("User", schema);           // model/class
const user = await User.create({ name: "Jane" });      // document
```

#### Field Validation
```js
name: {
  type: String,
  required: [true, "Custom error message"],
  minlength: 2,
  maxlength: 50,
  trim: true,          // auto-strip whitespace
}
```

#### References & Population
```js
// In Task schema:
owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" }

// In query — replaces ObjectId with full User document:
const task = await Task.findById(id).populate("owner", "name email");
```

#### Pre-save Hook (Lifecycle)
```js
schema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
```

#### Instance vs Static Methods
```js
// Instance method — called on a single document
schema.methods.comparePassword = async function(plain) {
  return bcrypt.compare(plain, this.password);
};
user.comparePassword("abc123");   // called on instance

// Static method — called on the Model
schema.statics.findByEmail = function(email) {
  return this.findOne({ email });
};
User.findByEmail("a@b.com");      // called on Model
```

#### Aggregation Pipeline
```js
// Stages transform the collection step by step
await Task.aggregate([
  { $match: { owner: userId } },           // filter
  { $group: { _id: "$status", count: { $sum: 1 } } },  // group
  { $project: { status: "$_id", count: 1, _id: 0 } },  // reshape
]);
```

#### Useful Query Methods
| Method | Returns | Use case |
|---|---|---|
| `.find(filter)` | Array | Multiple documents |
| `.findById(id)` | Document or null | Single by _id |
| `.findOne(filter)` | Document or null | Single by any field |
| `.findByIdAndUpdate(id, update, opts)` | Document | Atomic update |
| `.countDocuments(filter)` | Number | Count without fetching |
| `.deleteOne()` | Result | Delete single doc |

---

### AUTHENTICATION (JWT)

#### Flow
```
Register → hash password → save user → sign JWT → return token
Login    → find user    → compare hash → sign JWT → return token
Request  → read Bearer token → verify → attach user to req → handler
```

#### JWT Structure
```
header.payload.signature
```
- **Header**: algorithm (HS256)
- **Payload**: `{ id, iat, exp }` — *not encrypted*, don't store secrets here
- **Signature**: HMAC of header+payload signed with `JWT_SECRET`

```js
// Sign
const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

// Verify
const decoded = jwt.verify(token, process.env.JWT_SECRET);
// decoded.id === user._id
```

#### Protect Middleware Pattern
```js
// Attach to any route that needs auth:
router.get("/profile", protect, getProfile);

// Inside protect:
const token = req.headers.authorization?.split(" ")[1];
const decoded = jwt.verify(token, secret);
req.user = await User.findById(decoded.id);
next();
```

---

### REACT CONCEPTS

#### useState
```js
const [count, setCount] = useState(0);
// Never mutate state directly: count++ ✗
// Always use setter:           setCount(c => c + 1) ✓
```

#### useEffect
```js
useEffect(() => {
  fetchData();           // runs after render

  return () => {
    cleanup();           // runs on unmount (cancel timers, subscriptions)
  };
}, [dependency]);        // re-runs when dependency changes
                         // [] = run once on mount
                         // no array = run on every render (usually a bug)
```

#### useReducer (for complex state)
```js
// Prefer useReducer when:
// - Multiple related state values
// - Next state depends on previous
// - State transitions have names (LOGIN_SUCCESS, LOGOUT...)

const [state, dispatch] = useReducer(reducer, initialState);
dispatch({ type: "LOGIN_SUCCESS", payload: { user } });
```

#### useContext + Custom Hook
```js
// 1. Create context
const AuthContext = createContext(null);

// 2. Provide it high in the tree
<AuthContext.Provider value={{ user, login, logout }}>
  {children}
</AuthContext.Provider>

// 3. Consume with custom hook (avoids repeating useContext everywhere)
export const useAuth = () => useContext(AuthContext);

// 4. Use anywhere in the tree
const { user, login } = useAuth();
```

#### useCallback & useMemo (Performance)
```js
// useCallback: memoize a function (stable reference across renders)
const fetchData = useCallback(async () => { ... }, [dependency]);

// useMemo: memoize a computed value
const expensiveResult = useMemo(() => compute(data), [data]);

// Both prevent unnecessary re-renders when passed as props or deps.
```

#### useRef
```js
// useRef: persist a value across renders WITHOUT triggering re-render
const timerRef = useRef(null);
timerRef.current = setTimeout(...);  // won't cause re-render

// Also used for DOM access:
const inputRef = useRef(null);
inputRef.current.focus();
```

#### Controlled Components
```js
// React owns the form state — input value always matches state
const [name, setName] = useState("");
<input value={name} onChange={e => setName(e.target.value)} />
// vs uncontrolled: ref-based, DOM owns the value
```

#### React.memo
```js
// Prevents re-render if props haven't changed (shallow comparison)
export default React.memo(TaskCard);
// Use when: component is expensive + receives same props often
```

---

### REACT ROUTER v6

```jsx
// Layout route pattern — ProtectedRoute renders <Outlet />
<Routes>
  <Route path="/login" element={<Login />} />
  <Route element={<ProtectedRoute />}>        {/* layout route */}
    <Route path="/" element={<Dashboard />} />
  </Route>
</Routes>

// Navigate programmatically
const navigate = useNavigate();
navigate("/dashboard", { replace: true });

// Read URL params / query string
const { id } = useParams();
const [params] = useSearchParams();
```

---

### AXIOS INTERCEPTORS

```js
// Add JWT to every request automatically
api.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) logout();
    return Promise.reject(err);
  }
);
```

---

### REST API CONVENTIONS

| Method | URL | Action |
|--------|-----|--------|
| GET | `/api/tasks` | List all tasks (filterable) |
| POST | `/api/tasks` | Create a task |
| GET | `/api/tasks/:id` | Get one task |
| PUT | `/api/tasks/:id` | Replace/update task |
| DELETE | `/api/tasks/:id` | Delete task |
| GET | `/api/tasks/stats` | Aggregated stats |

**HTTP Status Codes used:**
- `200` OK — successful GET/PUT
- `201` Created — successful POST
- `401` Unauthorized — missing/invalid token
- `403` Forbidden — authenticated but no permission
- `404` Not Found
- `409` Conflict — e.g. email already exists
- `422` Unprocessable Entity — validation failed
- `500` Internal Server Error

---

### ENVIRONMENT VARIABLES

```bash
# Never commit .env to git!
# Use .env.example as a template

PORT=5000
MONGO_URI=mongodb://localhost:27017/dbname
JWT_SECRET=long_random_string          # openssl rand -base64 32
JWT_EXPIRES_IN=7d
```

Access in Node: `process.env.MONGO_URI`

---

## 🔑 Key Patterns to Remember

| Pattern | Where | Why |
|---|---|---|
| Middleware chain | `server.js` | Separation of concerns |
| Pre-save hook | `User.js` | Auto-hash passwords |
| `select: false` | `User.js` | Never expose password in queries |
| `{ new: true }` | `taskController.js` | Return updated doc from `findByIdAndUpdate` |
| `Promise.all([])` | `taskController.js` | Run independent queries in parallel |
| `next(err)` | Controllers | Delegate to global error handler |
| `req.user` | Auth middleware | Pass data between middleware |
| Cleanup in useEffect | `useTasks.js` | Cancel timers on unmount |
| Optimistic update | `useTasks.js` | Update UI before server confirms |
| `JSON.stringify` in dep array | `useTasks.js` | Compare objects by value not reference |

---

## 📚 What to Build Next

- [ ] **Refresh Tokens** — short-lived access token + long-lived refresh token
- [ ] **File Upload** — Multer + Cloudinary for task attachments
- [ ] **Real-time updates** — Socket.io for live task updates
- [ ] **Email notifications** — Nodemailer for due date reminders
- [ ] **Testing** — Jest + Supertest (backend), React Testing Library (frontend)
- [ ] **Docker** — Containerise MongoDB + backend + frontend
- [ ] **CI/CD** — GitHub Actions pipeline
- [ ] **Deploy** — Backend on Railway/Render, Frontend on Vercel, DB on MongoDB Atlas
