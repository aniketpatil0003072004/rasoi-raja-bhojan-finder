import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  SignInFormValues,
  signInSchema,
  signinUserService,
} from "@/services/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast as sonnerToast } from "sonner";

const SignInPage = () => {
  const navigate = useNavigate();
  //   const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  //   const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  const {
    register: registerSignIn,
    handleSubmit: handleSubmitSignIn,
    reset: signInReset,
    formState: { errors: signInErrors },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
  });

  const handleSignIn = async (data: SignInFormValues) => {
    setIsLoading(true);
    try {
      // Use RPC function to get user by token (bypasses RLS)
      const user = await signinUserService(data);

      sonnerToast.success(`Login successful! Welcome ${user?.full_name}!`);

      localStorage.setItem("username", user.user_name);
      localStorage.setItem("user", JSON.stringify(user));

      if (user.role === "mess_owner") {
        navigate("/dashboard");
      }
      if (user.role === "delivery_personnel") {
        navigate("/delivery-dashboard");
      }
      if (user.role === "student") {
        navigate("/my-subscriptions");
      }
    } catch (error) {
      console.log(error);

      sonnerToast.error("An unexpected error occurred during sign-in.");
    }
    setIsLoading(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Welcome Back</CardTitle>
          <CardDescription>
            Enter your credentials to access your account.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmitSignIn(handleSignIn)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signIn-userName">User Name</Label>
              <Input
                id="signIn-userName"
                type="text"
                placeholder="Enter your User Name"
                {...registerSignIn("userName")}
              />
              {signInErrors.userName && (
                <p className="text-sm text-destructive">
                  {signInErrors.userName.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Enter the User Name you created during signup
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="signIn-password">Password</Label>
              <div className="relative">
                <Input
                  id="signIn-password"
                  type={showSignInPassword ? "text" : "password"}
                  {...registerSignIn("password")}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowSignInPassword((prev) => !prev)}
                >
                  {showSignInPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  <span className="sr-only">
                    {showSignInPassword ? "Hide password" : "Show password"}
                  </span>
                </Button>
              </div>
              {signInErrors.password && (
                <p className="text-sm text-destructive">
                  {signInErrors.password.message}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </>
  );
};

export default SignInPage;
