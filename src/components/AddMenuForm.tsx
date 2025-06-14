
import React from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
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
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { Menu } from "@/types";
import { Database, TablesInsert, Constants } from "@/integrations/supabase/types";
import { Skeleton } from "@/components/ui/skeleton";

type DayOfWeek = Database["public"]["Enums"]["day_of_week"];
const daysOfWeek = Constants.public.Enums.day_of_week;

const menuDaySchema = z.object({
  day: z.enum(daysOfWeek),
  breakfast: z.string().optional(),
  lunch: z.string().optional(),
  dinner: z.string().optional(),
});

const menuFormSchema = z.object({
  weeklyMenu: z.array(menuDaySchema),
});

type MenuFormValues = z.infer<typeof menuFormSchema>;

interface AddMenuFormProps {
  messId: string;
  onSuccess?: () => void;
}

const AddMenuForm: React.FC<AddMenuFormProps> = ({ messId, onSuccess }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: existingMenu, isLoading: isLoadingMenu } = useQuery({
    queryKey: ['menu', messId],
    queryFn: async (): Promise<Menu[]> => {
        const { data, error } = await supabase
            .from('menus')
            .select('*')
            .eq('mess_id', messId);
        if (error) throw new Error(error.message);
        return data || [];
    },
  });

  const form = useForm<MenuFormValues>({
    resolver: zodResolver(menuFormSchema),
    defaultValues: {
      weeklyMenu: daysOfWeek.map(day => ({
        day: day,
        breakfast: "",
        lunch: "",
        dinner: "",
      }))
    },
    mode: "onChange",
  });
  
  React.useEffect(() => {
    if (existingMenu) {
      const values = daysOfWeek.map(day => {
        const existingDayMenu = existingMenu.find(m => m.day === day);
        return {
            day: day,
            breakfast: existingDayMenu?.breakfast || "",
            lunch: existingDayMenu?.lunch || "",
            dinner: existingDayMenu?.dinner || "",
        }
      });
      form.reset({ weeklyMenu: values });
    }
  }, [existingMenu, form]);
  
  const { fields } = useFieldArray({
    control: form.control,
    name: "weeklyMenu",
  });

  const upsertMenuMutation = useMutation({
    mutationFn: async (menuData: TablesInsert<'menus'>[]) => {
      const { error } = await supabase.from('menus').upsert(menuData, {
        onConflict: 'mess_id, day',
      });
      if (error) throw error;
    },
    onSuccess: () => {
        toast({
            title: "Success!",
            description: "Menu updated successfully.",
        });
        queryClient.invalidateQueries({ queryKey: ['menu', messId] });
        onSuccess?.();
    },
    onError: (error) => {
        toast({
            title: "Error",
            description: `Failed to update menu: ${error.message}`,
            variant: "destructive",
        });
    }
  });

  function onSubmit(values: MenuFormValues) {
    const menuDataToSubmit: TablesInsert<'menus'>[] = values.weeklyMenu.map(dayMenu => ({
        mess_id: messId,
        day: dayMenu.day,
        breakfast: dayMenu.breakfast || null,
        lunch: dayMenu.lunch || null,
        dinner: dayMenu.dinner || null,
    }));
    upsertMenuMutation.mutate(menuDataToSubmit);
  }

  if (isLoadingMenu) {
    return (
      <div className="space-y-4">
        {daysOfWeek.map(day => <Skeleton key={day} className="h-48 w-full" />)}
      </div>
    )
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {fields.map((field, index) => (
          <Card key={field.id}>
            <CardHeader><CardTitle>{field.day}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name={`weeklyMenu.${index}.breakfast`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Breakfast</FormLabel>
                    <FormControl><Input placeholder="e.g. Poha, Jalebi" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`weeklyMenu.${index}.lunch`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lunch</FormLabel>
                    <FormControl><Input placeholder="e.g. Roti, Sabzi, Dal, Rice" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`weeklyMenu.${index}.dinner`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dinner</FormLabel>
                    <FormControl><Input placeholder="e.g. Special Thali" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        ))}
        <Button type="submit" className="w-full" disabled={upsertMenuMutation.isPending}>
          {upsertMenuMutation.isPending ? 'Saving...' : 'Save Menu'}
        </Button>
      </form>
    </Form>
  )
};

export default AddMenuForm;
