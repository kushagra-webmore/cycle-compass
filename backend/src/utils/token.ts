import crypto from 'crypto';

export const generateInviteToken = () => crypto.randomBytes(32).toString('hex');

export const generatePairCode = () => {
  const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
  return code;
};

export const generateQrPlaceholder = (token: string) => `cyclecompanion://pair?token=${token}`;
