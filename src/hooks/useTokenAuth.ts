import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useTokenAuth = () => {
  const [isLoading, setIsLoading] = useState(false);

  const signUpWithToken = async (token: string, password: string) => {
    setIsLoading(true);
    try {
      // Verify token exists and is unused
      const { data: tokenData, error: tokenError } = await supabase
        .from('user_tokens')
        .select('*')
        .eq('token', token)
        .eq('is_used', false)
        .single();

      if (tokenError || !tokenData) {
        toast({ title: 'Invalid or used token', variant: 'destructive' });
        setIsLoading(false);
        return { error: new Error('Invalid token') };
      }

      // Create auth user with token details
      const email = `${token}@messtoken.local`;
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: tokenData.full_name,
            role: tokenData.role,
            token: token,
          },
        },
      });

      if (authError) {
        toast({ title: 'Signup failed', description: authError.message, variant: 'destructive' });
        setIsLoading(false);
        return { error: authError };
      }

      // Mark token as used and link to user
      if (authData.user) {
        await supabase
          .from('user_tokens')
          .update({ is_used: true, user_id: authData.user.id })
          .eq('token', token);
      }

      toast({ title: 'Account created successfully!' });
      setIsLoading(false);
      return { data: authData };
    } catch (error: any) {
      toast({ title: 'Error during signup', description: error.message, variant: 'destructive' });
      setIsLoading(false);
      return { error };
    }
  };

  const signInWithToken = async (token: string, password: string) => {
    setIsLoading(true);
    try {
      const email = `${token}@messtoken.local`;
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({ title: 'Login failed', description: error.message, variant: 'destructive' });
        setIsLoading(false);
        return { error };
      }

      toast({ title: 'Login successful!' });
      setIsLoading(false);
      return { data };
    } catch (error: any) {
      toast({ title: 'Error during login', description: error.message, variant: 'destructive' });
      setIsLoading(false);
      return { error };
    }
  };

  return {
    signUpWithToken,
    signInWithToken,
    isLoading,
  };
};
