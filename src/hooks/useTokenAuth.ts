import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast as sonnerToast } from 'sonner';

export const useTokenAuth = () => {
  const [isLoading, setIsLoading] = useState(false);

  const validateAndSignInWithToken = async (token: string) => {
    setIsLoading(true);
    try {
      // First, validate the token and get user info
      const { data: tokenData, error: tokenError } = await supabase
        .from('user_tokens')
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

      if (tokenData.is_used && tokenData.user_id) {
        // Token is already used, sign in the existing user
        // We'll need to use their email and a temporary password approach
        // Since we can't sign in with just user_id, we'll return the user data
        // and let the auth page handle the actual sign in
        sonnerToast.error('Please use your email and password to sign in.');
        setIsLoading(false);
        return null;
      }

      setIsLoading(false);
      return tokenData;
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
        .from('user_tokens')
        .select('*')
        .eq('token', token)
        .eq('is_used', true)
        .maybeSingle();

      if (tokenError) throw tokenError;

      if (!tokenData || !tokenData.user_id) {
        sonnerToast.error('Invalid token or token not yet registered.');
        setIsLoading(false);
        return { success: false };
      }

      // For token-based signin, we need to use magic link or another method
      // Since we can't directly sign in with user_id, we'll send a magic link
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', tokenData.user_id)
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
