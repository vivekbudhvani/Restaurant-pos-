module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: './pos.db'
    },
    useNullAsDefault: true
  }
};
