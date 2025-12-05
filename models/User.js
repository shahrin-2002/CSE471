/**
 * User Model - Handles all database operations for users
 */

class User {
  constructor(pool) {
    this.pool = pool;
  }

  /**
   * Find user by email
   * @param {string} email
   * @returns {Promise<Object|null>}
   */
  async findByEmail(email) {
    const connection = await this.pool.getConnection();
    try {
      const [users] = await connection.query(
        'SELECT id, name, email, password, role, phone, address, gender, date_of_birth, created_at FROM users WHERE email = ?',
        [email]
      );
      return users.length > 0 ? users[0] : null;
    } finally {
      connection.release();
    }
  }

  /**
   * Find user by ID
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    const connection = await this.pool.getConnection();
    try {
      const [users] = await connection.query(
        'SELECT id, name, email, role, phone, address, gender, date_of_birth, created_at FROM users WHERE id = ?',
        [id]
      );
      return users.length > 0 ? users[0] : null;
    } finally {
      connection.release();
    }
  }

  /**
   * Create new user
   * @param {Object} userData
   * @returns {Promise<Object>}
   */
  async create(userData) {
    const connection = await this.pool.getConnection();
    try {
      const { name, email, password, role, phone, address, gender, date_of_birth } = userData;

      const [result] = await connection.query(
        `INSERT INTO users (name, email, password, role, phone, address, gender, date_of_birth)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, email, password, role, phone || null, address || null, gender || null, date_of_birth || null]
      );

      return {
        id: result.insertId,
        name,
        email,
        role,
        phone: phone || null,
        address: address || null,
        gender: gender || null,
        date_of_birth: date_of_birth || null
      };
    } finally {
      connection.release();
    }
  }

  /**
   * Update user
   * @param {number} id
   * @param {Object} updates
   * @returns {Promise<boolean>}
   */
  async update(id, updates) {
    const connection = await this.pool.getConnection();
    try {
      const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
      const values = [...Object.values(updates), id];

      await connection.query(
        `UPDATE users SET ${setClause} WHERE id = ?`,
        values
      );

      return true;
    } finally {
      connection.release();
    }
  }

  /**
   * Check if email exists
   * @param {string} email
   * @returns {Promise<boolean>}
   */
  async emailExists(email) {
    const connection = await this.pool.getConnection();
    try {
      const [users] = await connection.query(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );
      return users.length > 0;
    } finally {
      connection.release();
    }
  }
}

module.exports = User;
