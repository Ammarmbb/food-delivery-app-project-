require('dotenv').config();
const mysql = require('mysql2');

// create connection
const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'starve'
});

// connect
connection.connect((err) => {
    if (err) throw err;
    console.log("Connected to MySQL database!");
});

module.exports = connection;
