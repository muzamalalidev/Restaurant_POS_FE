'use client';

import { z as zod } from 'zod';
import { useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { getApiErrorMessage } from 'src/utils/api-error-message';

import { CONFIG } from 'src/global-config';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';
import { AnimateLogoRotate } from 'src/components/animate';

import { useAuthContext } from 'src/auth/hooks';
import { FormHead } from 'src/auth/components/form-head';
import { signInWithPassword } from 'src/auth/context/jwt/action';
import { REMEMBERED_EMAIL_KEY } from 'src/auth/context/jwt/constant';

// ----------------------------------------------------------------------

export const SignInSchema = zod.object({
  email: zod
    .string()
    .trim()
    .min(1, { message: 'Email is required!' })
    .email({ message: 'Email must be a valid email address!' })
    .max(255, { message: 'Email must be at most 255 characters!' }),
  password: zod
    .string()
    .trim()
    .min(1, { message: 'Password is required!' })
    .min(6, { message: 'Password must be at least 6 characters!' }),
  rememberMe: zod.boolean().optional(),
});

// ----------------------------------------------------------------------

export function SignInView() {
  const showPassword = useBoolean();
  const isSubmittingRef = useRef(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { checkUserSession } = useAuthContext();

  const returnTo = searchParams.get('returnTo') || CONFIG.auth.redirectPath;

  const defaultValues = {
    email: '',
    password: '',
    rememberMe: false,
  };

  const methods = useForm({
    resolver: zodResolver(SignInSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(REMEMBERED_EMAIL_KEY);
    if (!stored || typeof stored !== 'string') return;
    const trimmed = stored.trim();
    if (!trimmed || trimmed.length > 255 || !trimmed.includes('@')) {
      localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      return;
    }
    setValue('email', trimmed);
    setValue('rememberMe', true);
  }, [setValue]);

  const onSubmit = handleSubmit(async (data) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    try {
      await signInWithPassword({ email: data.email, password: data.password });
      if (data.rememberMe) {
        localStorage.setItem(REMEMBERED_EMAIL_KEY, data.email.trim());
      } else {
        localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      }
      await checkUserSession?.();
      router.replace(returnTo);
    } catch (error) {
      const { message, isRetryable } = getApiErrorMessage(error, {
        defaultMessage: 'Unable to sign in.',
        validationMessage: 'Please check your email and password.',
      });
      toast.error(message, isRetryable ? { action: { label: 'Retry', onClick: () => methods.handleSubmit(onSubmit)() } } : undefined);
    } finally {
      isSubmittingRef.current = false;
    }
  });

  const renderForm = () => (
    <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
      <Field.Text name="email" label="Email address" slotProps={{ inputLabel: { shrink: true } }} />

      <Box sx={{ gap: 1.5, display: 'flex', flexDirection: 'column' }}>
        <Field.Text
          name="password"
          label="Password"
          placeholder="6+ characters"
          type={showPassword.value ? 'text' : 'password'}
          slotProps={{
            inputLabel: { shrink: true },
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={showPassword.onToggle} edge="end">
                    <Iconify
                      icon={showPassword.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
                    />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Field.Checkbox name="rememberMe" label="Remember me" />
        <Link
          component={RouterLink}
          href={paths.auth.resetPassword}
          variant="body2"
          color="inherit"
        >
          Forgot password?
        </Link>
      </Box>

      <Field.Button
        fullWidth
        color="inherit"
        size="large"
        type="submit"
        variant="contained"
        disabled={isSubmitting}
        loading={isSubmitting}
      >
        Sign in
      </Field.Button>
    </Box>
  );

  return (
    <>
      <AnimateLogoRotate sx={{ mb: 3, mx: 'auto' }} />

      <FormHead
        title="Sign in to your account"
      />

      <Form methods={methods} onSubmit={onSubmit}>
        {renderForm()}
      </Form>
    </>
  );
}
