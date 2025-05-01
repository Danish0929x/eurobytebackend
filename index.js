const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const connectDB = require("./db");

const port = process.env.PORT || 5000;
dotenv.config();
connectDB();

const app = express();

// Basic CORS setup for development
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:3000',
    'https://eurobyte.us'  // ← New domain added here
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/referral', require('./routes/referralRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/package', require('./routes/packageRoutes'));
app.use('/api/transaction', require('./routes/transactionRoute'));

// Simple health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'running',
    service: 'EURO BYTE Backend',
    timestamp: new Date().toISOString()
  });
});

// Basic error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(port, () => {
  console.log(`Euro Byte app listening at http://localhost:${port}`)
})  