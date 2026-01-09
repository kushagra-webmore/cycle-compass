import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import { HttpError } from '../utils/http-error.js';
const supabaseService = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});
/**
 * Request a password reset email
 * @param email - User's email address
 */
export const requestPasswordReset = async (email) => {
    const { error } = await supabaseService.auth.resetPasswordForEmail(email, {
        redirectTo: `${env.CLIENT_APP_URL}/reset-password`,
    });
    if (error) {
        // Don't reveal if email exists or not for security
        console.error('Password reset request error:', error);
    }
    // Always return success to prevent email enumeration
    return {
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link.',
    };
};
/**
 * Reset password with token
 * @param accessToken - Reset token from email link
 * @param newPassword - New password
 */
export const resetPassword = async (accessToken, newPassword) => {
    // 1. Verify the access token by fetching the user
    // We use the service client but pass the user's token to verify it
    const { data: { user }, error: userError } = await supabaseService.auth.getUser(accessToken);
    if (userError || !user) {
        console.error('Password Reset - Token Verification Failed:', userError);
        throw new HttpError(401, 'Invalid or expired password reset link.', userError);
    }
    // 2. Update the user's password using Admin privileges
    const { error: updateError } = await supabaseService.auth.admin.updateUserById(user.id, { password: newPassword });
    if (updateError) {
        console.error('Password Reset - Update Failed:', updateError);
        throw new HttpError(400, 'Failed to set new password. Please try a different password.', updateError);
    }
    return {
        success: true,
        message: 'Password has been reset successfully. You can now log in with your new password.',
    };
};
//# sourceMappingURL=password-reset.service.js.map