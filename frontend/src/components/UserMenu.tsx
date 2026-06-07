import { Avatar, Group, Menu, UnstyledButton } from '@mantine/core';
import type { User } from '@supabase/supabase-js';
import { Link } from '@tanstack/react-router';
import { DoorOpen } from 'lucide-react';

import { getUserDisplayName } from '../utils.ts';

interface UserMenuProps {
  user: User | null;
}
export const UserMenu = ({ user }: UserMenuProps) => {
  const key = getUserDisplayName(user);
  return (
    <Menu>
      <Menu.Target>
        <Group>
          <UnstyledButton>
            <Avatar key={key} name={key} color='initials' />
          </UnstyledButton>
        </Group>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item leftSection={<DoorOpen />} component={Link} to='/logout'>
          Logout
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};
