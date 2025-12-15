import { Router } from 'express';
import { authenticate, requireRoles } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import {
  createPairingSchema,
  acceptPairingSchema,
  revokePairingSchema,
  updateConsentSchema,
} from '../validators/pairing';
import { asyncHandler } from '../utils/async-handler';
import {
  createPairingInvite,
  acceptPairingInvite,
  revokePairing,
  updateConsentSettings,
  getActivePairingForUser,
} from '../services/pairing.service';

export const pairingRouter = Router();

pairingRouter.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const pairing = await getActivePairingForUser(req.authUser!.id);

    if (!pairing) {
      return res.json(null);
    }

    const isPrimary = pairing.primary_user_id === req.authUser!.id;

    res.json({
      id: pairing.id,
      role: req.authUser!.role,
      isPrimary,
      status: pairing.status,
      consent: pairing.consent_settings,
      partnerUserId: isPrimary ? pairing.partner_user_id : pairing.primary_user_id,
    });
  }),
);

pairingRouter.post(
  '/create',
  authenticate,
  requireRoles('PRIMARY'),
  validateBody(createPairingSchema),
  asyncHandler(async (req, res) => {
    const result = await createPairingInvite(req.authUser!.id, req.body.method);
    res.status(201).json(result);
  }),
);

pairingRouter.post(
  '/accept',
  authenticate,
  requireRoles('PARTNER'),
  validateBody(acceptPairingSchema),
  asyncHandler(async (req, res) => {
    const { token, pairCode } = req.body;
    const result = await acceptPairingInvite(req.authUser!.id, { token, pairCode });
    res.status(200).json(result);
  }),
);

pairingRouter.post(
  '/revoke',
  authenticate,
  requireRoles('PRIMARY'),
  validateBody(revokePairingSchema),
  asyncHandler(async (req, res) => {
    await revokePairing(req.authUser!.id, req.body.pairingId);
    res.json({ success: true });
  }),
);

pairingRouter.post(
  '/consent/update',
  authenticate,
  requireRoles('PRIMARY'),
  validateBody(updateConsentSchema),
  asyncHandler(async (req, res) => {
    const { pairingId, ...updates } = req.body;
    const consent = await updateConsentSettings(req.authUser!.id, pairingId, updates);
    res.json(consent);
  }),
);
