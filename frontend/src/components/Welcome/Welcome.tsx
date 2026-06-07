import { Text } from '@mantine/core';
import type { User } from '@supabase/supabase-js';
import classes from './Welcome.module.css';

import { getUserDisplayName } from '../../utils.ts';

interface WelcomeProps {
  user: User | null | undefined;
}

export const Welcome = ({ user }: WelcomeProps) => (
  <Text className={classes.title} size='xl' fs='italic'>
    Welcome {getUserDisplayName(user)}
  </Text>
);
