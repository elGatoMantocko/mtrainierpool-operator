import { Button, Group } from '@mantine/core';

export type SocialProviderType = 'discord';

interface SocialLoginProps {
  onSubmit: (type: SocialProviderType) => void;
}
export const SocialLogin = ({ onSubmit }: SocialLoginProps) => {
  return (
    <>
      <Group justify='space-evenly'>
        <Button onClick={() => onSubmit('discord')}>
          Sign in with Discord
        </Button>
      </Group>
    </>
  );
};
