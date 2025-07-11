import { Router } from 'express';
import { getPersons, addPerson, updatePerson, deletePerson } from '../controllers/adminPersonController';
import adminAuth from '../middleware/auth';

const router = Router();

router.get('/', adminAuth, getPersons);
router.post('/', adminAuth, addPerson);
router.put('/:id', adminAuth, updatePerson);
router.delete('/:id', adminAuth, deletePerson);

export default router; 