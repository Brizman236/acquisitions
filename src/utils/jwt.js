// Here we create a new utility function that makes easier the usage of JWT across the
// entire authentication process

import logger from '#config/logger.js';
import jwt from 'jsonwebtoken';
import { token } from 'morgan';

const JWT_SECRET =
  process.env.JWT_SECRET || 'your-secret-jey-please-change-in-production';
const JWT_EXPIRES_IN = '1d';

// Centralize token signing and verification so both use the same policy.
export const jwttoken = {
  sign: payload => {
    try {
      return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    } catch (e) {
      logger.error('Failed to authenticate token', e);
      throw new Error('Failed to authenticate token');
    }
  },
  verify: token => {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (e) {
      logger.error('Failed to authenticate token', e);
      throw new Error('Failed to authenticate token');
    }
  },
};
