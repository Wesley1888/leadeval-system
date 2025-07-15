import { Router } from 'express';
import { getPersons, getPerson, addPerson, updatePerson, deletePerson } from '../controllers/adminPersonController';
import adminAuth from '../middleware/auth';

const router = Router();

router.get('/', adminAuth, getPersons);
router.get('/:id', adminAuth, getPerson);
router.post('/', adminAuth, addPerson);
router.put('/:id', adminAuth, updatePerson);
router.delete('/:id', adminAuth, deletePerson);

export default router; 