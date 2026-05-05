const mysql = require('mysql2/promise');
const config = require('./env');

const pool = mysql.createPool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
  waitForConnections: true,
  connectionLimit: config.database.connectionLimit,
  queueLimit: 0,
});

const toMysqlPlaceholders = (sql, values = []) => {
  const orderedValues = [];
  const normalizedValues = values.map(value => (value === undefined ? null : value));
  const text = sql.replace(/\$(\d+)/g, (_, position) => {
    orderedValues.push(normalizedValues[Number(position) - 1]);
    return '?';
  });

  return { text, values: orderedValues.length > 0 ? orderedValues : normalizedValues };
};

module.exports = {
  async query(sql, values = []) {
    const query = toMysqlPlaceholders(sql, values);
    const [result] = await pool.query(query.text, query.values);

    if (Array.isArray(result)) {
      return {
        rows: result,
        rowCount: result.length,
      };
    }

    return {
      rows: [],
      rowCount: result.affectedRows || 0,
      insertId: result.insertId,
      affectedRows: result.affectedRows || 0,
    };
  },

  async end() {
    await pool.end();
  },
};
