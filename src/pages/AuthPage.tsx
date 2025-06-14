
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp"; // Import InputOTP

const phoneSchema = z.object({
  phone: z.string().min(10, { message: 'Phone number must be at least 10 digits.' }).regex(/^\+[1-9]\d{1,14}$/, { message: 'Phone number must be in E.164 format (e.g., +1234567890).' }), // E.164 format
});

const otpSchema = z.object({
  otp: z.string().length(6, { message: 'OTP must be 6 digits.' }),
});

type PhoneFormValues = z.infer<typeof phoneSchema>;
type OtpFormValues = z.infer<typeof otpSchema>;

const AuthPage = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');

  const {
    register: registerPhone,
    handleSubmit: handleSubmitPhone,
    formState: { errors: phoneErrors },
    watch: watchPhone,
  } = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
  });

  const {
    setValue: setOtpValue, // Using setValue to programmatically update OTP input
    handleSubmit: handleSubmitOtp,
    formState: { errors: otpErrors },
    watch: watchOtp,
  } = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
  });
  
  // Watch for OTP changes to pass to InputOTP
  const otpValue = watchOtp("otp");

  useEffect(() => {
    if (session) {
      navigate('/'); // Redirect if already logged in
    }
  }, [session, navigate]);

  const handleSendOtp = async (data: PhoneFormValues) => {
    setIsLoading(true);
    setPhoneNumber(data.phone);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: data.phone,
      });
      if (error) {
        sonnerToast.error(error.message);
      } else {
        sonnerToast.success('OTP sent to your phone!');
        setStep('otp');
      }
    } catch (error) {
      sonnerToast.error('An unexpected error occurred while sending OTP.');
      console.error('Send OTP error:', error);
    }
    setIsLoading(false);
  };

  const handleVerifyOtp = async (data: OtpFormValues) => {
    setIsLoading(true);
    try {
      const { data: verifyData, error } = await supabase.auth.verifyOtp({
        phone: phoneNumber,
        token: data.otp,
        type: 'sms', // Handles both signup and login for phone
      });
      if (error) {
        sonnerToast.error(error.message);
      } else if (verifyData.session) {
        sonnerToast.success('Login successful!');
        navigate('/');
      } else {
        sonnerToast.error('Could not verify OTP. Please try again.');
      }
    } catch (error) {
      sonnerToast.error('An unexpected error occurred during OTP verification.');
      console.error('Verify OTP error:', error);
    }
    setIsLoading(false);
  };
  
  if (session) return null;

  return (
    <div className="container flex min-h-[calc(100vh-10rem)] items-center justify-center py-12">
      <Card className="w-[400px]">
        {step === 'phone' && (
          <>
            <CardHeader>
              <CardTitle>Login / Sign Up with Phone</CardTitle>
              <CardDescription>Enter your phone number to receive an OTP.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmitPhone(handleSendOtp)}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" placeholder="+1234567890" {...registerPhone('phone')} />
                  {phoneErrors.phone && <p className="text-sm text-destructive">{phoneErrors.phone.message}</p>}
                   <p className="text-xs text-muted-foreground">Use E.164 format (e.g., +1234567890).</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Sending OTP...' : 'Send OTP'}
                </Button>
              </CardFooter>
            </form>
          </>
        )}
        {step === 'otp' && (
          <>
            <CardHeader>
              <CardTitle>Enter OTP</CardTitle>
              <CardDescription>We've sent an OTP to {phoneNumber}.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmitOtp(handleVerifyOtp)}>
              <CardContent className="space-y-4 flex flex-col items-center">
                <div className="space-y-2">
                  <Label htmlFor="otp">One-Time Password</Label>
                  <InputOTP 
                    maxLength={6} 
                    value={otpValue}
                    onChange={(value) => setOtpValue("otp", value)} // Update form value
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                  {otpErrors.otp && <p className="text-sm text-destructive">{otpErrors.otp.message}</p>}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Verifying...' : 'Verify OTP'}
                </Button>
                <Button variant="link" size="sm" onClick={() => { setStep('phone'); setIsLoading(false); }} disabled={isLoading}>
                  Change phone number
                </Button>
              </CardFooter>
            </form>
          </>
        )}
      </Card>
    </div>
  );
};

export default AuthPage;
