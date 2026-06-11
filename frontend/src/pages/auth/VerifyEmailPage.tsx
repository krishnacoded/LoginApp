import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Loader2, MailWarning } from 'lucide-react';
import { authService } from '../../api/auth.service';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['verify-email', token],
    queryFn: () => authService.verifyEmail(token),
    enabled: Boolean(token),
    retry: false,
  });

  const message = (error as any)?.response?.data?.message;
  const hasMissingToken = !token;
  const hasError = hasMissingToken || isError;
  const title = hasError
    ? 'Verification failed'
    : isLoading
      ? 'Verifying your email'
      : data?.message || 'Email verified';

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
      <div className="glass-card rounded-2xl p-8 w-full max-w-md text-center">
        <div className="mx-auto mb-5 h-14 w-14 rounded-2xl flex items-center justify-center bg-white/5">
          {isLoading ? (
            <Loader2 size={28} className="text-lime-300 animate-spin" />
          ) : hasError ? (
            <MailWarning size={28} className="text-red-300" />
          ) : (
            <CheckCircle2 size={28} className="text-lime-300" />
          )}
        </div>

        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="mt-3 text-sm text-white/45">
          {hasMissingToken
            ? 'The verification link is missing its token.'
            : hasError
              ? message || 'This verification link is invalid or expired.'
              : 'Your account is active. You can now sign in to PeopleFlow.'}
        </p>

        <Link to="/login" className="btn-primary mt-6 w-full justify-center">
          Go to sign in
        </Link>
      </div>
    </div>
  );
}
