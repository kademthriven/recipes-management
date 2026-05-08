const { QueryTypes } = require('sequelize');
const sequelize = require('./sequelize');

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
    const [result, metadata] = await sequelize.query(query.text, {
      replacements: query.values,
      type: QueryTypes.RAW,
    });

    if (Array.isArray(result)) {
      return {
        rows: result,
        rowCount: result.length,
      };
    }

    return {
      rows: [],
      rowCount: metadata?.affectedRows || result?.affectedRows || 0,
      insertId: metadata?.insertId || result?.insertId,
      affectedRows: metadata?.affectedRows || result?.affectedRows || 0,
    };
  },

  async end() {
    await sequelize.close();
  },
};
