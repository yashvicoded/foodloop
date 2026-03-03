import app from './app';
import dotenv from 'dotenv';

dotenv.config();

// Ensure PORT is treated as a number
const PORT = Number(process.env.PORT) || 5000;

// '0.0.0.0' tells the server to listen to the whole Wi-Fi network
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  // Use your real IP here for your own reference
  console.log(`🔗 Network URL: http://192.168.29.21:${PORT}`);
});