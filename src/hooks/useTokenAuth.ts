import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast as sonnerToast } from 'sonner';
import type { UserToken } from '@/types/token-auth';

export const useTokenAuth = () => {
  const [isLoading, setIsLoading] = useState(false);

  const validateAndSignInWithToken = async (token: string) => {
    setIsLoading(true);
    try {
      // First, validate the token and get user info
      const { data: tokenData, error: tokenError } = await supabase
        .from('user_tokens' as any)
        .select('*')
        .eq('token', token)
        .maybeSingle();

      if (tokenError) {
        throw tokenError;
      }

      if (!tokenData) {
        sonnerToast.error('Invalid token. Please check and try again.');
        setIsLoading(false);
        return null;
      }

      const typedToken = tokenData as unknown as UserToken;

      if (typedToken.is_used && typedToken.user_id) {
        // Token is already used, sign in the existing user
        sonnerToast.error('Please use your email and password to sign in.');
        setIsLoading(false);
        return null;
      }

      setIsLoading(false);
      return typedToken;
    } catch (error: any) {
      sonnerToast.error('Error validating token: ' + error.message);
      setIsLoading(false);
      return null;
    }
  };

  const signInWithToken = async (token: string) => {
    setIsLoading(true);
    try {
      // Get token data
      const { data: tokenData, error: tokenError } = await supabase
        .from('user_tokens' as any)
        .select('*')
        .eq('token', token)
        .eq('is_used', true)
        .maybeSingle();

      if (tokenError) throw tokenError;

      if (!tokenData) {
        sonnerToast.error('Invalid token or token not yet registered.');
        setIsLoading(false);
        return { success: false };
      }

      const typedToken = tokenData as unknown as UserToken;

      if (!typedToken.user_id) {
        sonnerToast.error('Token not yet registered.');
        setIsLoading(false);
        return { success: false };
      }

      // For token-based signin, we need to use magic link
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', typedToken.user_id)
        .single();

      if (!profile?.email) {
        sonnerToast.error('User email not found.');
        setIsLoading(false);
        return { success: false };
      }

      // Send OTP to email
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: profile.email,
      });

      if (otpError) throw otpError;

      sonnerToast.success('Check your email for the login link!');
      setIsLoading(false);
      return { success: true };
    } catch (error: any) {
      sonnerToast.error('Error signing in: ' + error.message);
      setIsLoading(false);
      return { success: false };
    }
  };

  return {
    isLoading,
    validateAndSignInWithToken,
    signInWithToken,
  };
};
