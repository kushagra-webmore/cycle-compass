import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import { HttpError } from '../utils/http-error.js';
import { createUserRecord, getUserWithProfile } from './user.service.js';
const clientOptions = {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
};
const supabaseService = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, clientOptions);
const supabaseAnon = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, clientOptions);
export const signupWithEmail = async ({ email, password, role, name, dateOfBirth, phone, city, timezone, }) => {
    const { data, error } = await supabaseService.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
    });
    if (error || !data.user) {
        throw new HttpError(400, error?.message ?? 'Failed to create auth user', error);
    }
    await createUserRecord({
        id: data.user.id,
        role,
        name,
        dateOfBirth,
        phone,
        city,
        timezone,
    });
    const signInResult = await supabaseAnon.auth.signInWithPassword({ email, password });
    if (signInResult.error || !signInResult.data.session || !signInResult.data.user) {
        throw new HttpError(400, 'Failed to create session for new user', signInResult.error);
    }
    const appUser = await getUserWithProfile(data.user.id, email);
    return {
        session: signInResult.data.session,
        user: appUser,
    };
};
export const signInWithEmail = async (email, password) => {
    const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });
    if (error || !data.session || !data.user) {
        throw new HttpError(401, 'Invalid email or password', error);
    }
    // Update last login and last activity timestamps
    const now = new Date().toISOString();
    const { error: updateError } = await supabaseService
        .from('users')
        .update({
        last_login: now,
        last_activity: now
    })
        .eq('id', data.user.id);
    if (updateError) {
        console.error('Failed to update last login:', updateError);
        // Don't throw error, just log it - login should still succeed
    }
    const appUser = await getUserWithProfile(data.user.id, email);
    return {
        session: data.session,
        user: appUser,
    };
};
export const refreshSession = async (refreshToken) => {
    const { data, error } = await supabaseAnon.auth.refreshSession({ refresh_token: refreshToken });
    if (error || !data.session || !data.user) {
        throw new HttpError(401, 'Invalid refresh token', error);
    }
    const appUser = await getUserWithProfile(data.user.id, data.user.email ?? '');
    return {
        session: data.session,
        user: appUser,
    };
};
export const requestPasswordReset = async (email) => {
    const redirectUrl = `${env.CLIENT_APP_URL}/reset-password`;
    const { error } = await supabaseAnon.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
    });
    if (error) {
        throw new HttpError(400, 'Failed to send password reset email', error);
    }
    return { success: true };
};
export const resetPassword = async (accessToken, newPassword) => {
    const { error } = await supabaseAnon.auth.updateUser({
        password: newPassword,
    });
    if (error) {
        throw new HttpError(400, 'Failed to reset password', error);
    }
    return { success: true };
};
export const getUserByAccessToken = async (token) => {
    const { data, error } = await supabaseAnon.auth.getUser(token);
    if (error || !data.user) {
        console.error('getUserByAccessToken Failed:', error);
        throw new HttpError(401, 'Invalid access token', error);
    }
    return getUserWithProfile(data.user.id, data.user.email ?? '');
};
export const signOutUser = async (token) => {
    const { error } = await supabaseService.auth.admin.signOut(token);
    if (error) {
        throw new HttpError(500, 'Failed to sign out', error);
    }
    return { success: true };
};
export const updateUserPassword = async (userId, email, currentPassword, newPassword) => {
    // 1. Verify current password by attempting to sign in
    const { error: signInError, data } = await supabaseAnon.auth.signInWithPassword({
        email,
        password: currentPassword,
    });
    if (signInError || !data.user) {
        throw new HttpError(400, 'Incorrect current password', signInError);
    }
    // 2. Update password using admin client
    const { error: updateError } = await supabaseService.auth.admin.updateUserById(userId, { password: newPassword.toString() });
    if (updateError) {
        throw new HttpError(400, 'Failed to update password', updateError);
    }
    return { success: true };
};
//# sourceMappingURL=auth.service.js.map