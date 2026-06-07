import {
  Card,
  Container,
  Divider,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { createFileRoute, redirect } from '@tanstack/react-router';

import { useState } from 'react';
import { z } from 'zod';
import { SocialLogin } from '../components/SocialLogin.tsx';
import { UsernamePasswordForm } from '../components/UsernamePasswordForm.tsx';

export const Route = createFileRoute('/login')({
  validateSearch: z.object({
    redirect: z.string().optional().catch(''),
    error: z.string().optional().catch(''),
  }),
  beforeLoad: ({ context, search }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: search.redirect ?? '/home' });
    }
  },
  component: RouteComponent,
});

interface LoginTypeSwitcherProps {
  type: 'login' | 'register';
  onSwitchType: (type: 'login' | 'register') => void;
}
const LoginTypeSwitcher = (
  { type, onSwitchType }: LoginTypeSwitcherProps,
) => {
  if (type === 'login') {
    return (
      <Text>
        Don't have an account?{' '}
        <UnstyledButton
          variant='transparent'
          onClick={() => onSwitchType('register')}
        >
          Sign up
        </UnstyledButton>
      </Text>
    );
  }
  if (type === 'register') {
    return (
      <Text>
        Already have an account?{' '}
        <UnstyledButton
          variant='transparent'
          onClick={() => onSwitchType('login')}
        >
          Sign in
        </UnstyledButton>
      </Text>
    );
  }
};

function RouteComponent() {
  const { auth } = Route.useRouteContext();

  const [type, setType] = useState<'login' | 'register'>('register');

  function onSubmit({ email, password }: { email: string; password: string }) {
    switch (type) {
      case 'login':
        auth.login({ email, password });
        break;
      case 'register':
        auth.signup({ email, password });
        break;
    }
  }

  return (
    <Container size='xs'>
      <Card mt={100}>
        <Stack>
          <UsernamePasswordForm
            onSubmit={onSubmit}
            error={auth.error}
          />
          <LoginTypeSwitcher type={type} onSwitchType={setType} />
          <Divider />
          <SocialLogin onSubmit={auth.oauth} />
        </Stack>
      </Card>
    </Container>
  );
}
