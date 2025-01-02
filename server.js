// Get all third party libraries and middleware
require('dotenv').config();
const express = require('express');
const cookie_parser = require('cookie-parser');
const i18n = require('i18n');

// Initialize the server
const app = express();

// Localization middleware configuration
i18n.configure({
  locales: ['lv', 'en'],
  directory: './locales',
  objectNotation: true,
  defaultLocale: 'lv',
  cookie: 'locale'
});

// Middleware setup
app.use(express.json());
app.use(cookie_parser());
app.use(i18n.init);

// View engine setup
app.set('view engine', 'ejs');

// Handling static files
app.use('/public', express.static('./public'));



// Index page route
app.get('/', (req, res) => {
  res.render('./index/index');
});



// Server event listener setup
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`TaskApp running on http://localhost:${PORT}`);
});