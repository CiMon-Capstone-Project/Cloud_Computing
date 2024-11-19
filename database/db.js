const mysql = require('mysql');

const connection = {
    host: "localhost",
    user: "root",
    password: "",
    database: "reglog"
};

const db = mysql.createPool(connection);

const createTable = `
CREATE TABLE IF NOT EXISTS images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    image_url TEXT NOT NULL,
    title VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
`;

// Koneksi ke database
db.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log("Database Connected");

    connection.query(createTable, (err, result) => {
        if (err) {
            console.error('Error creating table:', err);
        } else {
            console.log('Table created successfully');
        }
        connection.release();
    });
});

module.exports = { db, createTable };