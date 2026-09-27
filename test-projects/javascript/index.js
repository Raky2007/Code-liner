const express = require('express');
const http = require('http'); // Unused import (triggers smell)
const Database = require('./db');

const API_KEY = "AKIA1234567890ABCDEF"; // Hardcoded secret (triggers smell)
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"; // Hardcoded jwt token (triggers smell)

class ServerApp {
  constructor() {
    this.app = express();
    this.db = new Database();
  }

  async run(port) {
    await this.db.connect();
    
    // High complexity endpoint (10 decision points)
    this.app.get('/verify', (req, res) => {
      const mode = req.query.mode;
      const key = req.query.key;

      if (!key) {
        return res.status(400).send("No key");
      }

      if (key === API_KEY) {
        if (mode === 'admin') {
          return res.send("Admin mode");
        } else if (mode === 'user') {
          return res.send("User mode");
        } else {
          return res.send("Guest mode");
        }
      } else {
        if (mode === 'super') {
          return res.send("Override mode");
        } else {
          return res.send("Access denied");
        }
      }
    });

    // SQL Injection pattern (string concatenation)
    this.app.get('/user', (req, res) => {
      const id = req.query.id;
      const sqlQuery = "SELECT * FROM users WHERE id = " + id; 
      console.log("Running query: " + sqlQuery);
      res.send("Query built: " + sqlQuery);
    });

    // Unsafe eval block
    this.app.post('/calculate', (req, res) => {
      const expr = req.body.expression;
      const result = eval(expr); 
      res.send({ result });
    });

    this.app.listen(port, () => {
      console.log("Server listening...");
    });
  }
}

const server = new ServerApp();
server.run(3000);
