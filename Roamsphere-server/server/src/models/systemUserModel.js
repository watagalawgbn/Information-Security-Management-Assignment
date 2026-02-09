import { pool } from '../config/db.js';

const SystemUser = {
  findUserByEmail: async (email) => {
    const query = `SELECT * FROM SystemUser WHERE email = ?`;
    const [results] = await pool.query(query, [email]);
    return results;
  },
  findAllUsers: async () => {
    const query = `SELECT * FROM SystemUser`;
    const [results] = await pool.query(query);
    return results;
  }
};

export default SystemUser;