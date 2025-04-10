require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./db/connection');
const orderRoutes = require('./routes/orderRoutes');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/orders', orderRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Sync database and start server
sequelize.sync().then(() => {
  console.log('Database synced');
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}).catch(error => {
  console.error('Unable to sync database:', error);
}); 