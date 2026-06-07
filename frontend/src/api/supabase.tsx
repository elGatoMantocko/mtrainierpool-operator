import {
  createClient,
  type Session,
  type SignInWithPasswordCredentials,
  type SignUpWithPasswordCredentials,
} from '@supabase/supabase-js';
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Database } from '../types/database.types.ts';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
});

interface NotReadyContext {
  ready: false;
}

interface ReadyContext {
  ready: true;
}

export type SocialProvider = 'discord';

interface SupabaseAuthFns {
  callback: (code: string) => Promise<void>;
  oauth: (type: SocialProvider) => Promise<void>;
  login: (options: SignInWithPasswordCredentials) => Promise<void>;
  signup: (options: SignUpWithPasswordCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

interface AuthenticatedSupabase {
  isAuthenticated: true;
  session: Session;
}

interface NotAuthenticatedSupabase {
  isAuthenticated: false;
  session: null;
}

interface LoadingState {
  loading: boolean;
}
interface ErrorState {
  error: Error | null;
}

type AuthenticatedContext =
  & AuthenticatedSupabase
  & SupabaseAuthFns
  & LoadingState
  & ErrorState;

type NotAuthenticatedContext =
  & NotAuthenticatedSupabase
  & SupabaseAuthFns
  & LoadingState
  & ErrorState;

export type SupabaseAuthContext =
  | AuthenticatedContext
  | NotAuthenticatedContext;

export type SupabaseCtx =
  | NotReadyContext
  | (ReadyContext & SupabaseAuthContext);

const SupabaseContext = createContext<SupabaseCtx | null>(null);

export const useSupabase = () => supabase;
export const useAuth = () => {
  const ctx = useContext(SupabaseContext);
  if (ctx == null) throw new Error('wrap useAuth in a SupabaseProvider');
  return ctx;
};

export const SupabaseProvider = (
  { children }: PropsWithChildren,
) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  function updateSession(session: Session | null) {
    setSession(session);
    setLoading(false);
  }
  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        setError(error);
        return;
      }
      updateSession(data.session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => {
        updateSession(session);
      },
    );
    return () => subscription.unsubscribe();
  }, []);

  const authFns = {
    callback: async (code) => {
      setLoading(true);
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        setError(error);
      }
      setLoading(false);
    },
    oauth: async (provider) => {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${location.origin}/auth/callback`,
        },
      });
      if (error) {
        setError(error);
      }
      setLoading(false);
    },
    login: async (options: SignInWithPasswordCredentials) => {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword(options);
      if (error) {
        setError(error);
      }
      setLoading(false);
    },
    signup: async (options: SignUpWithPasswordCredentials) => {
      setLoading(true);
      const { error } = await supabase.auth.signUp(options);
      if (error) {
        setError(error);
      }
      setLoading(false);
    },
    logout: async () => {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        setError(error);
      }
      setLoading(false);
    },
  } satisfies SupabaseAuthFns;

  const ctx = useMemo(
    (): SupabaseCtx => {
      if (!session) {
        return {
          ready: true,
          isAuthenticated: false,
          error,
          loading,
          session: null,
          ...authFns,
        };
      }
      return {
        ready: true,
        isAuthenticated: true,
        error,
        loading,
        session,
        ...authFns,
      };
    },
    [loading, error, session],
  );
  return (
    <SupabaseContext.Provider value={ctx}>
      {children}
    </SupabaseContext.Provider>
  );
};
