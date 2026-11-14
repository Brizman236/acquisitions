import { signIn, signOut, signup } from '#controllers/auth.controller.js';
import express from 'express';

const router = express.Router();

// Signup is implemented in the controller; sign-in/out are currently placeholders.
router.post('/sign-up', signup);

router.post('/sign-in', signIn);

router.post('/sign-out', signOut);

export default router;
