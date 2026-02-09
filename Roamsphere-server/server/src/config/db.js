
import mysql2 from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql2.createPool({
    host: process.env.DB_HOST,                 // switchback.proxy.rlwy.net
    user: process.env.DB_USER,                 // root
    password: process.env.DB_PASSWORD,         // Railway password
    database: process.env.DB_NAME,             // roamsphere
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306, // 25508
    connectionLimit: 10,
});

const checkConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log(`Database connected successfully: ${process.env.DB_HOST}/${process.env.DB_NAME}`);
        connection.release();
    } catch (error) {
        console.error('Database connection failed:', error.message);
        process.exit(1);
    }
};

export { pool, checkConnection };
