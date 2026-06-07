import { createTheme, MantineProvider } from '@mantine/core';
import '@mantine/core/styles.layer.css';
import '@mantine/dates/styles.layer.css';

import { Router } from './Router';

const theme = createTheme({});

export const App = () => (
  <MantineProvider theme={theme} defaultColorScheme='dark'>
    <Router />
  </MantineProvider>
);
