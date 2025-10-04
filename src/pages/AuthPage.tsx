import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast as sonnerToast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Eye, EyeOff } from 'lucide-react';

const signUpSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  role: z.enum(['student', 'mess_owner', 'delivery_personnel'], { required_error: "You must select a role." }),
  token: z.string().optional(),
});

const signInSchema = z.object({
  token: z.string().min(1, { message: "Token is required." }),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;
type SignInFormValues = z.infer<typeof signInSchema>;

const AuthPage = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  const {
    register: registerSignUp,
    handleSubmit: handleSubmitSignUp,
    formState: { errors: signUpErrors },
    control: controlSignUp,
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      role: 'student',
    },
  });

  const {
    register: registerSignIn,
    handleSubmit: handleSubmitSignIn,
    formState: { errors: signInErrors },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
  });

  useEffect(() => {
    if (session) {
      navigate('/'); // Redirect if already logged in
    }
  }, [session, navigate]);

  const handleSignUp = async (data: SignUpFormValues) => {
    setIsLoading(true);
    try {
      // If token provided, validate it first
      if (data.token) {
        const { data: tokenData, error: tokenError } = await supabase
          .from('user_tokens' as any)
          .select('*')
          .eq('token', data.token)
          .eq('is_used', false)
          .maybeSingle();

        if (tokenError || !tokenData) {
          sonnerToast.error('Invalid or already used token.');
          setIsLoading(false);
          return;
        }

        // Check if token role matches selected role
        if ((tokenData as any).role !== data.role) {
          sonnerToast.error(`This token is for ${(tokenData as any).role} role, but you selected ${data.role}.`);
          setIsLoading(false);
          return;
        }
      }

      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            role: data.role,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        sonnerToast.error(error.message);
      } else {
        // If token was provided, mark it as used
        if (data.token && authData.user) {
          await supabase
            .from('user_tokens' as any)
            .update({ is_used: true, user_id: authData.user.id } as any)
            .eq('token', data.token);
        }
        sonnerToast.success('Success! Please check your email to confirm your account.');
      }
    } catch (error) {
      sonnerToast.error('An unexpected error occurred during sign-up.');
    }
    setIsLoading(false);
  };
  
  const handleSignIn = async (data: SignInFormValues) => {
    setIsLoading(true);
    try {
      // Validate token and get user info
      const { data: tokenData, error: tokenError } = await supabase
        .from('user_tokens' as any)
        .select('*')
        .eq('token', data.token)
        .eq('is_used', true)
        .maybeSingle();

      if (tokenError || !tokenData || !(tokenData as any).user_id) {
        sonnerToast.error('Invalid token or token not registered yet.');
        setIsLoading(false);
        return;
      }

      // Get user's email
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, role')
        .eq('id', (tokenData as any).user_id)
        .single();

      if (!profile?.email) {
        sonnerToast.error('User profile not found.');
        setIsLoading(false);
        return;
      }

      // Send magic link
      const { error: magicLinkError } = await supabase.auth.signInWithOtp({
        email: profile.email,
      });

      if (magicLinkError) {
        sonnerToast.error(magicLinkError.message);
      } else {
        sonnerToast.success('Check your email for the login link!');
      }
    } catch (error) {
      sonnerToast.error('An unexpected error occurred during sign-in.');
    }
    setIsLoading(false);
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
              <CardDescription>Enter your credentials to access your account.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmitSignIn(handleSignIn)}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signIn-token">Token ID</Label>
                  <Input 
                    id="signIn-token" 
                    type="text" 
                    placeholder="Enter your token ID" 
                    {...registerSignIn('token')} 
                  />
                  {signInErrors.token && <p className="text-sm text-destructive">{signInErrors.token.message}</p>}
                  <p className="text-xs text-muted-foreground">
                    We'll send a login link to your registered email address.
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Sending Login Link...' : 'Sign In with Token'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
        <TabsContent value="sign-up">
          <Card>
            <CardHeader>
              <CardTitle>Create an Account</CardTitle>
              <CardDescription>Enter your details to get started.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmitSignUp(handleSignUp)}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signUp-fullName">Full Name</Label>
                  <Input id="signUp-fullName" placeholder="John Doe" {...registerSignUp('fullName')} />
                  {signUpErrors.fullName && <p className="text-sm text-destructive">{signUpErrors.fullName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signUp-email">Email</Label>
                  <Input id="signUp-email" type="email" placeholder="m@example.com" {...registerSignUp('email')} />
                  {signUpErrors.email && <p className="text-sm text-destructive">{signUpErrors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signUp-password">Password</Label>
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
                <div className="space-y-2">
                  <Label htmlFor="signUp-token">Token ID (Optional)</Label>
                  <Input 
                    id="signUp-token" 
                    type="text" 
                    placeholder="Enter your token if you have one" 
                    {...registerSignUp('token')} 
                  />
                  {signUpErrors.token && <p className="text-sm text-destructive">{signUpErrors.token.message}</p>}
                  <p className="text-xs text-muted-foreground">
                    If you received a token ID, enter it here to link your account.
                  </p>
                </div>
                <div className="space-y-3">
                  <Label>I am a...</Label>
                  <Controller
                    control={controlSignUp}
                    name="role"
                    render={({ field }) => (
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="student" id="role-student" />
                          <Label htmlFor="role-student">Student</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="mess_owner" id="role-mess_owner" />
                          <Label htmlFor="role-mess_owner">Mess Owner</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="delivery_personnel" id="role-delivery_personnel" />
                          <Label htmlFor="role-delivery_personnel">Delivery</Label>
                        </div>
                      </RadioGroup>
                    )}
                  />
                  {signUpErrors.role && <p className="text-sm text-destructive">{signUpErrors.role.message}</p>}
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
