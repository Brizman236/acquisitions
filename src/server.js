import app from './app.js';

// The server entry point owns the listening port; app.js only configures Express.
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
