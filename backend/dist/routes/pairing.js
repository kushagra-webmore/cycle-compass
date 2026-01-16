import { Router } from 'express';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createPairingSchema, acceptPairingSchema, revokePairingSchema, updateConsentSchema, } from '../validators/pairing.js';
import { asyncHandler } from '../utils/async-handler.js';
import { createPairingInvite, acceptPairingInvite, revokePairing, updateConsentSettings, getActivePairingsForUser, getInviteDetails, } from '../services/pairing.service.js';
export const pairingRouter = Router();
pairingRouter.get('/me', authenticate, asyncHandler(async (req, res) => {
    const pairings = await getActivePairingsForUser(req.authUser.id);
    const result = pairings.map(pairing => {
        const isPrimary = pairing.primary_user_id === req.authUser.id;
        return {
            ...pairing,
            consent: pairing.consent_settings,
            role: req.authUser.role,
            isPrimary,
            partnerUserId: isPrimary ? pairing.partner_user_id : pairing.primary_user_id,
            partnerName: isPrimary ? pairing.partnerUserName : pairing.primaryUserName,
        };
    });
    res.json(result);
}));
pairingRouter.post('/create', authenticate, requireRoles('PRIMARY'), validateBody(createPairingSchema), asyncHandler(async (req, res) => {
    const result = await createPairingInvite(req.authUser.id, req.body.method);
    res.status(201).json(result);
}));
pairingRouter.post('/accept', authenticate, requireRoles('PARTNER'), validateBody(acceptPairingSchema), asyncHandler(async (req, res) => {
    const { token, pairCode } = req.body;
    const result = await acceptPairingInvite(req.authUser.id, { token, pairCode });
    res.status(200).json(result);
}));
pairingRouter.post('/revoke', authenticate, validateBody(revokePairingSchema), asyncHandler(async (req, res) => {
    await revokePairing(req.authUser.id, req.body.pairingId);
    res.json({ success: true });
}));
pairingRouter.get('/invite', asyncHandler(async (req, res) => {
    const { token, code } = req.query;
    if (!token && !code) {
        return res.status(400).json({ message: 'Missing token or code' });
    }
    const result = await getInviteDetails({
        token: token,
        pairCode: code
    });
    res.json(result);
}));
pairingRouter.post('/consent/update', authenticate, requireRoles('PRIMARY'), validateBody(updateConsentSchema), asyncHandler(async (req, res) => {
    const { pairingId, ...updates } = req.body;
    const consent = await updateConsentSettings(req.authUser.id, pairingId, updates);
    res.json(consent);
}));
//# sourceMappingURL=pairing.js.map