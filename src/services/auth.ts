import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import bcrypt from "bcryptjs";

export const signUpSchema = z.object({
  userName: z
    .string()
    .min(5, { message: "User name should be minimum of 5 characters." }),
  fullName: z
    .string()
    .min(2, { message: "Full name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters." }),
  role: z.enum(["student", "mess_owner", "delivery_personnel"], {
    required_error: "You must select a role.",
  }),
});

export const signInSchema = z.object({
  userName: z.string().min(1, { message: "User Name is required." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export type SignUpFormValues = z.infer<typeof signUpSchema>;
export type SignInFormValues = z.infer<typeof signInSchema>;

export const signupUserService = async (userData: SignUpFormValues) => {
  const { data: userExists } = await supabase
    .from("user")
    .select("user_name")
    .eq("token", userData.userName)
    .maybeSingle();

  if (userExists) {
    throw new Error(
      "This User Name is already taken. Please choose a different one."
    );
  }

  const hashedPassword = await bcrypt.hash(userData.password, 16);
  console.log(hashedPassword);

  const { error } = await supabase.from("user").insert({
    user_name: userData.userName,
    full_name: userData.fullName,
    email: userData.email,
    password: hashedPassword,
    role: userData.role,
  });

  if (error) {
    console.log(error);

    throw new Error("Signup Failed, Please try again.");
  }
};

export const signinUserService = async (userData: SignInFormValues) => {
  const { userName, password } = userData;
  console.log(userName, password);

  const { data, error } = await supabase
    .from("user")
    .select("*")
    .eq("user_name", userName)
    .single();

  console.log(data);

  if (error) {
    throw new Error("Error fetching user details.");
  }

  if (!data) {
    throw new Error("User not found.");
  }

  const isPasswordValid = await bcrypt.compare(password, data.password);

  if (!isPasswordValid) {
    throw new Error("Invalid password.");
  }

  const { password: _, ...userWithoutPassword } = data;
  console.log(userWithoutPassword);

  return userWithoutPassword;
};
