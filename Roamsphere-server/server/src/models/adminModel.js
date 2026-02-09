/*import { pool } from '../config/db.js';

const createAdmin = async (admin) => {
    const query = `INSERT INTO Admin (admin_id, user_id) VALUES (UUID(), ?)`;
    const values = [admin.user_id];
    return pool.query(query, values);
};

export { createAdmin };
*/