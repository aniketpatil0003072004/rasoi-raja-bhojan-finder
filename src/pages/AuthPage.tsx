
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast as sonnerToast } from "sonner";
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth

const signUpSchema = z.object({
  fullName: z.string().min(2, { message: 'Full name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password cannot be empty.' }),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;
type LoginFormValues = z.infer<typeof loginSchema>;

const AuthPage = () => {
  const navigate = useNavigate();
  const { session } = useAuth(); // Get session from context
  const [isLoading, setIsLoading] = useState(false);

  const {
    register: registerSignUp,
    handleSubmit: handleSubmitSignUp,
    formState: { errors: signUpErrors },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
  });

  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    formState: { errors: loginErrors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  React.useEffect(() => {
    if (session) {
      navigate('/'); // Redirect if already logged in
    }
  }, [session, navigate]);

  const handleSignUp = async (data: SignUpFormValues) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      if (error) {
        sonnerToast.error(error.message);
      } else {
        sonnerToast.success('Sign up successful! Please check your email to confirm your account.');
        // Potentially navigate to a "check your email page" or handle login directly if auto-confirm is on
      }
    } catch (error) {
      sonnerToast.error('An unexpected error occurred during sign up.');
      console.error('Sign up error:', error);
    }
    setIsLoading(false);
  };

  const handleLogin = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) {
        sonnerToast.error(error.message);
      } else {
        sonnerToast.success('Login successful!');
        navigate('/'); // Redirect to home page or dashboard
      }
    } catch (error) {
      sonnerToast.error('An unexpected error occurred during login.');
      console.error('Login error:', error);
    }
    setIsLoading(false);
  };
  
  if (session) return null; // Don't render if session exists (already handled by useEffect redirect)

  return (
    <div className="container flex min-h-[calc(100vh-10rem)] items-center justify-center py-12">
      <Tabs defaultValue="login" className="w-[400px]">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <Card>
            <CardHeader>
              <CardTitle>Login</CardTitle>
              <CardDescription>Access your Rasoi Raja account.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmitLogin(handleLogin)}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" type="email" placeholder="m@example.com" {...registerLogin('email')} />
                  {loginErrors.email && <p className="text-sm text-destructive">{loginErrors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input id="login-password" type="password" {...registerLogin('password')} />
                  {loginErrors.password && <p className="text-sm text-destructive">{loginErrors.password.message}</p>}
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Logging in...' : 'Login'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
        <TabsContent value="signup">
          <Card>
            <CardHeader>
              <CardTitle>Sign Up</CardTitle>
              <CardDescription>Create your Rasoi Raja account.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmitSignUp(handleSignUp)}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-fullName">Full Name</Label>
                  <Input id="signup-fullName" placeholder="John Doe" {...registerSignUp('fullName')} />
                  {signUpErrors.fullName && <p className="text-sm text-destructive">{signUpErrors.fullName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" type="email" placeholder="m@example.com" {...registerSignUp('email')} />
                  {signUpErrors.email && <p className="text-sm text-destructive">{signUpErrors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input id="signup-password" type="password" {...registerSignUp('password')} />
                  {signUpErrors.password && <p className="text-sm text-destructive">{signUpErrors.password.message}</p>}
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Signing up...' : 'Sign Up'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AuthPage;
