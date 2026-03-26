import { Router } from 'express';
import { celebrate } from 'celebrate';
import {
  loginUser,
  // registerUser,
  logoutUser,
  refreshUserSession,
  // requestResetEmail,
} from '../controllers/authController.js';
import {
  // registerUserSchema,
  loginUserSchema,
  // requestResetEmailSchema,
} from '../validations/authValidation.js';

const router = Router();

// router.post('/auth/register', celebrate(registerUserSchema), registerUser);

router.post('/login', celebrate(loginUserSchema), loginUser);

router.post('/logout', logoutUser);

router.post('/refresh', refreshUserSession);

export default router;
