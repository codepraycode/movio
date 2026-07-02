import { Router } from 'express';
import { register, login } from './auth.controller';
import { validateDto } from '../../shared/middlewares/validate.middleware';
import { RegisterDto, LoginDto } from './auth.types';

const router = Router();

router.post('/register', validateDto(RegisterDto), register);
router.post('/login', validateDto(LoginDto), login);

export default router;
