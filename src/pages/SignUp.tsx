import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast as sonnerToast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CloudCog, Eye, EyeOff } from "lucide-react";
import {
  SignInFormValues,
  signInSchema,
  SignUpFormValues,
  signUpSchema,
  signupUserService,
} from "@/services/auth";
import { userInfo } from "os";

const SignUpPage = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  const {
    register: registerSignUp,
    handleSubmit: handleSubmitSignUp,
    formState: { errors: signUpErrors },
    reset: signupReset,
    control: controlSignUp,
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      role: "student",
    },
  });

  useEffect(() => {
    if (session) {
      navigate("/dashboard"); // Redirect if already logged in
    }
  }, [session, navigate]);

  const handleSignUp = async (data: SignUpFormValues) => {
    setIsLoading(true);
    try {
      await signupUserService(data);
      sonnerToast.success(
        `${data.fullName} account has been created as ${data.role} successfully.`
      );
      signupReset();
      navigate("/auth/sign-in");
    } catch (error) {
      console.log(error);

      sonnerToast.error(error.message);
    }
    setIsLoading(false);
  };

  if (session) return null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Create an Account</CardTitle>
          <CardDescription>Enter your details to get started.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmitSignUp(handleSignUp)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signUp-userName">User Name</Label>
              <Input
                id="signUp-userName"
                placeholder="JohnDoe1234"
                {...registerSignUp("userName")}
              />
              {signUpErrors.userName && (
                <p className="text-sm text-destructive">
                  {signUpErrors.userName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="signUp-fullName">Full Name</Label>
              <Input
                id="signUp-fullName"
                placeholder="John Doe"
                {...registerSignUp("fullName")}
              />
              {signUpErrors.fullName && (
                <p className="text-sm text-destructive">
                  {signUpErrors.fullName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="signUp-email">Email</Label>
              <Input
                id="signUp-email"
                type="email"
                placeholder="m@example.com"
                {...registerSignUp("email")}
              />
              {signUpErrors.email && (
                <p className="text-sm text-destructive">
                  {signUpErrors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="signUp-password">Password</Label>
              <div className="relative">
                <Input
                  id="signUp-password"
                  type={showSignUpPassword ? "text" : "password"}
                  {...registerSignUp("password")}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowSignUpPassword((prev) => !prev)}
                >
                  {showSignUpPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  <span className="sr-only">
                    {showSignUpPassword ? "Hide password" : "Show password"}
                  </span>
                </Button>
              </div>
              {signUpErrors.password && (
                <p className="text-sm text-destructive">
                  {signUpErrors.password.message}
                </p>
              )}
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
                      <RadioGroupItem
                        value="delivery_personnel"
                        id="role-delivery_personnel"
                      />
                      <Label htmlFor="role-delivery_personnel">Delivery</Label>
                    </div>
                  </RadioGroup>
                )}
              />
              {signUpErrors.role && (
                <p className="text-sm text-destructive">
                  {signUpErrors.role.message}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </>
  );
};

export default SignUpPage;
