const mongoose = require('mongoose');

class Database {
  constructor() {
    this.connection = null;
  }

  async connect() {
    console.log("Connecting database...");
    this.connection = await mongoose.connect("mongodb://localhost:27017/test-project");
    return this.connection;
  }
}

module.exports = Database;
