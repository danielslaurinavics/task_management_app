require('dotenv').config();
const express = require('express');
const cookie_parser = require('cookie-parser');
const i18n = require('i18n');

const app = express();

i18n.configure({
  locales: ['lv', 'en'],
  directory: './locales',
  objectNotation: true,
  defaultLocale: 'lv',
  cookie: 'locale'
});

app.use(express.json());
app.use(cookie_parser());
app.use(i18n.init());

app.get('/', (req, res) => {
  res.type('text/plain');
  res.send("Hello World!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`TaskApp running on http://localhost:${PORT}`);
});