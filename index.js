import express from 'express';

// Minimal standalone entry point; the development script starts src/index.js.
const app = express();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Listening on ${PORT}...`);
});
