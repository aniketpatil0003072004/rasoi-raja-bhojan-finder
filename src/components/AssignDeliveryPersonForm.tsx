import React from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const assignFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type AssignFormValues = z.infer<typeof assignFormSchema>;

interface AssignDeliveryPersonFormProps {
  messId: string;
  messName: string;
  onSuccess?: () => void;
}

const AssignDeliveryPersonForm: React.FC<AssignDeliveryPersonFormProps> = ({ 
  messId, 
  messName, 
  onSuccess 
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AssignFormValues>({
    resolver: zodResolver(assignFormSchema),
    defaultValues: {
      email: "",
    },
  });

  const assignMutation = useMutation({
    mutationFn: async (data: AssignFormValues) => {
      const { data: result, error } = await supabase.rpc('assign_delivery_person_to_mess', {
        p_mess_id: messId,
        p_email: data.email
      });
      
      if (error) throw error;
      if (!result) {
        throw new Error('Delivery person not found with this email or already assigned');
      }
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Delivery person assigned successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['availableDeliveryPersonnel'] });
      form.reset();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to assign delivery person",
        description: error.message || "Please ensure the delivery person is registered with this email.",
        variant: "destructive",
      });
    }
  });

  function onSubmit(values: AssignFormValues) {
    assignMutation.mutate(values);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assign Delivery Person to {messName}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery Person Email</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="Enter delivery person's email" 
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={assignMutation.isPending}>
              {assignMutation.isPending ? 'Assigning...' : 'Assign Delivery Person'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default AssignDeliveryPersonForm;