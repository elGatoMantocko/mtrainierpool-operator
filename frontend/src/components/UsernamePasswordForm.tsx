import { Alert, Button, Group, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';

interface UsernamePasswordFormProps {
  onSubmit: (values: { email: string; password: string }) => void;
  error: Error | null;
}
export const UsernamePasswordForm = (
  { onSubmit, error }: UsernamePasswordFormProps,
) => {
  const form = useForm({
    mode: 'controlled',
    initialValues: { email: '', password: '' },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
    },
  });
  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack>
        <TextInput
          {...form.getInputProps('email')}
          placeholder='Email'
          type='email'
          key={form.key('email')}
        />

        <TextInput
          {...form.getInputProps('password')}
          placeholder='Password'
          type='password'
          key={form.key('password')}
        />

        <Group justify='flex-end'>
          <Button type='submit'>Submit</Button>
        </Group>

        {error && <Alert title='Failed to login' />}
      </Stack>
    </form>
  );
};
