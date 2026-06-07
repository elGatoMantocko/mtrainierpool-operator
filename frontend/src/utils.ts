import type { User } from '@supabase/supabase-js';

export function getUserDisplayName(user: User | undefined | null) {
  if (!user) return '{user.name}';
  if ('full_name' in user.user_metadata) {
    return user.user_metadata.full_name as string;
  }
  return user.email ?? '{user.email}';
}
