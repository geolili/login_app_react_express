// Import necessary packages
import express from 'express';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import cors from 'cors';

// Temporary in-memory user storage
const users = [];

// Secret key for signing JWTs
const SECRET_KEY = 'my_secrete_key';

// Initialize the Express app
const app = express();

// Middleware to handle CORS and parse incoming data
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Register Route
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if user already exists
    const user = users.find(user => user.username === username);
    if (user) return res.status(400).json({ success: false, message: 'User already exists' });

    // Hash the password before storing it
    const salt = await bcryptjs.genSalt(10);
    const hashedPass = await bcryptjs.hash(password, 10);

    // Store user in memory
    users.push({ username, password: hashedPass });

    res.status(201).json({ success: true, message: 'New user created!', users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});


// Login Route
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if the user exists
    const user = users.find(user => user.username === username);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Verify password
    const isPassValid = await bcryptjs.compare(password, user.password);
    if (!isPassValid) {
      return res.status(404).json({ success: false, message: 'Invalid password' });
    }

    // Create a JWT token
    const payload = { username };
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '24h' });

    res.status(200).json({ token, success: true, message: 'Logged in successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});


// Middleware to Protect Routes
const loginMiddleware = async (req, res, next) => {
  const authorization = req.headers['authorization'];
  const token = authorization && authorization.split(' ')[1];

  // Check if token exists
  if (!token) {
    return res.status(401).json({ success: false, message: 'Inexistent or invalid token' });
  }

  // Verify token
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ success: false, message: 'Invalid token' });

    req.user = user;
    next();
  });
};


// Protected Profile Route
app.get('/profile', loginMiddleware, (req, res) => {
  const username = req.user.username;
  res.json({ success: true, message: `Welcome, ${username}!` });
});


// Start the Server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});