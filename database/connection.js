// databse/connection.js
const mysql = require('mysql2');

function connectToDatabase() {
  const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'db_analytical',
    connectTimeout: 10000,
    acquireTimeout: 10000,
    timeout: 10000,
    reconnect: true
  });

  db.connect((err) => {
    if (err) {
      console.error('❌ Gagal konek ke database:', err.message);
      console.error('💡 Pastikan MySQL server berjalan dan kredensial benar');
    } else {
      console.log('✅ Berhasil terhubung ke MySQL!');
    }
  });

  // Handle connection errors
  db.on('error', (err) => {
    console.error('❌ Database connection error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.log('🔁 Reconnecting to database...');
      connectToDatabase();
    }
  });

  return db;
}

module.exports = { connectToDatabase };