const { builder } = require('@netlify/functions');
const express = require('express');
const serverless = require('serverless-http');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

// Import route handlers
const routesRouter = require('../../RunHerDatabase/routes/routes');
const runsRouter = require('../../RunHerDatabase/routes/runs');

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Use route handlers
app.use('/.netlify/functions/api/routes', routesRouter);
app.use('/.netlify/functions/api/runs', runsRouter);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const handler = builder(serverless(app));
module.exports = { handler };
