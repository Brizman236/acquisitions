import 'dotenv/config';

// Drizzle Kit reads the model definitions here and writes PostgreSQL migrations
// into the repository's drizzle/ directory.
export default {
  schema: './src/models/*.js',
  out: './drizzle/',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
};
