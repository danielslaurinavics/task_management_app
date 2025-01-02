require('dotenv').config();
const express = require('express');

const app = express();

app.get('/', (req, res) => {
  res.type('text/plain');
  res.send("Hello World!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`TaskApp running on http://localhost:${PORT}`);
});