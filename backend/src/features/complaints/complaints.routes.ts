import { Router } from 'express';
import { createComplaint, listComplaints, updateComplaintStatus } from './complaints.controller';
import { requireAuth, requireRole } from '../../shared/middlewares/auth.middleware';
import { validateDto } from '../../shared/middlewares/validate.middleware';
import { CreateComplaintDto, UpdateComplaintStatusDto } from './complaints.types';

// Student-facing router, mounted at /api/v1/complaints in app.ts
const router = Router();
router.post('/', requireAuth, requireRole('student'), validateDto(CreateComplaintDto), createComplaint);
export default router;

// Admin-facing router, mounted at /api/v1/admin/complaints in app.ts.
// Kept in this feature module rather than a separate `admin` feature folder,
// since complaints are the only admin-managed resource so far.
export const adminComplaintsRouter = Router();
adminComplaintsRouter.get('/', requireAuth, requireRole('admin'), listComplaints);
adminComplaintsRouter.patch(
    '/:id',
    requireAuth,
    requireRole('admin'),
    validateDto(UpdateComplaintStatusDto),
    updateComplaintStatus
);
