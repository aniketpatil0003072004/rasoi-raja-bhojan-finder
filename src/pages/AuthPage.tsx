import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast as sonnerToast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff } from 'lucide-react';
import { useTokenAuth } from '@/hooks/useTokenAuth';

const tokenSignUpSchema = z.object({
  token: z.string().min(6, { message: "Token must be at least 6 characters." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
});

const tokenSignInSchema = z.object({
  token: z.string().min(6, { message: "Token is required." }),
  password: z.string().min(1, { message: "Password is required." }),
});

type TokenSignUpFormValues = z.infer<typeof tokenSignUpSchema>;
type TokenSignInFormValues = z.infer<typeof tokenSignInSchema>;

const AuthPage = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const { signUpWithToken, signInWithToken, isLoading } = useTokenAuth();

  const {
    register: registerSignUp,
    handleSubmit: handleSubmitSignUp,
    formState: { errors: signUpErrors },
  } = useForm<TokenSignUpFormValues>({
    resolver: zodResolver(tokenSignUpSchema),
  });

  const {
    register: registerSignIn,
    handleSubmit: handleSubmitSignIn,
    formState: { errors: signInErrors },
  } = useForm<TokenSignInFormValues>({
    resolver: zodResolver(tokenSignInSchema),
  });

  useEffect(() => {
    if (session) {
      navigate('/'); // Redirect if already logged in
    }
  }, [session, navigate]);

  const handleSignUp = async (data: TokenSignUpFormValues) => {
    const result = await signUpWithToken(data.token, data.password);
    if (!result.error) {
      navigate('/');
    }
  };
  
  const handleSignIn = async (data: TokenSignInFormValues) => {
    const result = await signInWithToken(data.token, data.password);
    if (!result.error) {
      navigate('/');
    }
  };
  
  if (session) return null;

  return (
    <div className="container flex min-h-[calc(100vh-10rem)] items-center justify-center py-12">
      <Tabs defaultValue="sign-in" className="w-[400px]">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sign-in">Sign In</TabsTrigger>
          <TabsTrigger value="sign-up">Sign Up</TabsTrigger>
        </TabsList>
        <TabsContent value="sign-in">
          <Card>
            <CardHeader>
              <CardTitle>Welcome Back</CardTitle>
              <CardDescription>Enter your token and password to access your account.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmitSignIn(handleSignIn)}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signIn-token">Access Token</Label>
                  <Input id="signIn-token" placeholder="Enter your token" {...registerSignIn('token')} />
                  {signInErrors.token && <p className="text-sm text-destructive">{signInErrors.token.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signIn-password">Password</Label>
                  <div className="relative">
                    <Input id="signIn-password" type={showSignInPassword ? 'text' : 'password'} {...registerSignIn('password')} className="pr-10" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowSignInPassword((prev) => !prev)}
                    >
                      {showSignInPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      <span className="sr-only">{showSignInPassword ? 'Hide password' : 'Show password'}</span>
                    </Button>
                  </div>
                  {signInErrors.password && <p className="text-sm text-destructive">{signInErrors.password.message}</p>}
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
        <TabsContent value="sign-up">
          <Card>
            <CardHeader>
              <CardTitle>Create an Account</CardTitle>
              <CardDescription>Enter your token and create a password to get started.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmitSignUp(handleSignUp)}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signUp-token">Access Token</Label>
                  <Input id="signUp-token" placeholder="Enter your token" {...registerSignUp('token')} />
                  {signUpErrors.token && <p className="text-sm text-destructive">{signUpErrors.token.message}</p>}
                  <p className="text-xs text-muted-foreground">
                    Your token was provided by your mess owner or admin
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signUp-password">Create Password</Label>
                  <div className="relative">
                    <Input id="signUp-password" type={showSignUpPassword ? 'text' : 'password'} {...registerSignUp('password')} className="pr-10" />
                     <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowSignUpPassword((prev) => !prev)}
                    >
                      {showSignUpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      <span className="sr-only">{showSignUpPassword ? 'Hide password' : 'Show password'}</span>
                    </Button>
                  </div>
                  {signUpErrors.password && <p className="text-sm text-destructive">{signUpErrors.password.message}</p>}
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Creating Account...' : 'Create Account'}
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
