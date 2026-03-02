'use client';

import { useState, useCallback } from 'react';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { toast } from 'src/components/snackbar';
import { Field } from 'src/components/hook-form';

import { useAuthContext } from 'src/auth/hooks';
import { signOut as jwtSignOut } from 'src/auth/context/jwt/action';

// ----------------------------------------------------------------------

const signOut = jwtSignOut;

// ----------------------------------------------------------------------

export function SignOutButton({ onClose, sx, ...other }) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { checkUserSession } = useAuthContext();

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await signOut();
      await checkUserSession?.();
      onClose?.();
      router.push(paths.auth.signIn);
    } catch (error) {
      console.error(error);
      toast.error('Unable to logout!');
    } finally {
      setIsLoggingOut(false);
    }
  }, [checkUserSession, isLoggingOut, onClose, router]);

  return (
    <Field.Button
      fullWidth
      variant="soft"
      size="large"
      color="error"
      onClick={handleLogout}
      disabled={isLoggingOut}
      sx={sx}
      {...other}
    >
      Logout
    </Field.Button>
  );
}
