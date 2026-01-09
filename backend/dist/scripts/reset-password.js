import { getSupabaseClient } from '../lib/supabase.js';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
async function resetPassword() {
    const email = 'kushagraa.n@gmail.com';
    const newPassword = 'Test@123';
    console.log(`Searching for user: ${email}...`);
    const supabase = getSupabaseClient();
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
        console.error('Error listing users:', listError);
        process.exit(1);
    }
    const user = users.find(u => u.email === email);
    if (!user) {
        console.error(`User with email ${email} not found.`);
        process.exit(1);
    }
    console.log(`Found user ID: ${user.id}. Updating password...`);
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, { password: newPassword });
    if (updateError) {
        console.error('Error updating password:', updateError);
        process.exit(1);
    }
    console.log('Successfully updated password!');
}
resetPassword();
// npx tsx src/scripts/reset-password.ts
//# sourceMappingURL=reset-password.js.map