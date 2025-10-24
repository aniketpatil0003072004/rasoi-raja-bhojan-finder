import React, { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { Menu } from "@/types";
import {
  Database,
  TablesInsert,
  Constants,
} from "@/integrations/supabase/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, X } from "lucide-react";

const menuFormSchema = z.object({
  breakfast: z.array(z.object({ item: z.string().min(1, "Item is required") })),
  lunch: z.array(z.object({ item: z.string().min(1, "Item is required") })),
  dinner: z.array(z.object({ item: z.string().min(1, "Item is required") })),
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
    queryKey: ["menu", messId],
    queryFn: async (): Promise<Menu | null> => {
      const { data, error } = await supabase
        .from("menus")
        .select("*")
        .eq("mess_id", messId)
        .single();
      if (error && error.code !== "PGRST116") throw new Error(error.message);
      return data || null;
    },
  });

  const form = useForm<MenuFormValues>({
    resolver: zodResolver(menuFormSchema),
    defaultValues: {
      breakfast: [{ item: "" }],
      lunch: [{ item: "" }],
      dinner: [{ item: "" }],
    },
    mode: "onChange",
  });

  React.useEffect(() => {
    if (existingMenu) {
      const parseItems = (items: string | null) => {
        if (!items) return [{ item: "" }];
        try {
          const parsed = JSON.parse(items);
          return Array.isArray(parsed) && parsed.length > 0
            ? parsed.map((item: string) => ({ item }))
            : [{ item: "" }];
        } catch {
          return [{ item: items }];
        }
      };

      form.reset({
        breakfast: parseItems(existingMenu.breakfast),
        lunch: parseItems(existingMenu.lunch),
        dinner: parseItems(existingMenu.dinner),
      });
    }
  }, [existingMenu, form]);

  const {
    fields: breakfastFields,
    append: appendBreakfast,
    remove: removeBreakfast,
  } = useFieldArray({
    control: form.control,
    name: "breakfast",
  });

  const {
    fields: lunchFields,
    append: appendLunch,
    remove: removeLunch,
  } = useFieldArray({
    control: form.control,
    name: "lunch",
  });

  const {
    fields: dinnerFields,
    append: appendDinner,
    remove: removeDinner,
  } = useFieldArray({
    control: form.control,
    name: "dinner",
  });

  const upsertMenuMutation = useMutation({
    mutationFn: async (menuData: Partial<TablesInsert<"menus">>) => {
      // First, try to update existing record
      const { data: existing } = await supabase
        .from("menus")
        .select("id")
        .eq("mess_id", messId)
        .single();

      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from("menus")
          .update(menuData)
          .eq("mess_id", messId);
        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase.from("menus").insert(menuData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Menu updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["menu", messId] });
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update menu: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: MenuFormValues) {
    const menuDataToSubmit = {
      mess_id: messId,
      breakfast: JSON.stringify(
        values.breakfast.map((b) => b.item).filter((item) => item.trim())
      ),
      lunch: JSON.stringify(
        values.lunch.map((l) => l.item).filter((item) => item.trim())
      ),
      dinner: JSON.stringify(
        values.dinner.map((d) => d.item).filter((item) => item.trim())
      ),
    };
    upsertMenuMutation.mutate(menuDataToSubmit);
  }

  if (isLoadingMenu) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <CardHeader>
          <CardTitle>General Menu</CardTitle>
        </CardHeader>

        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="breakfast" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="breakfast">Breakfast</TabsTrigger>
                <TabsTrigger value="lunch">Lunch</TabsTrigger>
                <TabsTrigger value="dinner">Dinner</TabsTrigger>
              </TabsList>

              <TabsContent value="breakfast" className="space-y-4">
                {breakfastFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-start">
                    <FormField
                      control={form.control}
                      name={`breakfast.${index}.item`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              placeholder="Enter breakfast item"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {breakfastFields.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeBreakfast(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => appendBreakfast({ item: "" })}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Breakfast Item
                </Button>
              </TabsContent>

              <TabsContent value="lunch" className="space-y-4">
                {lunchFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-start">
                    <FormField
                      control={form.control}
                      name={`lunch.${index}.item`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="Enter lunch item" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {lunchFields.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeLunch(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => appendLunch({ item: "" })}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Lunch Item
                </Button>
              </TabsContent>

              <TabsContent value="dinner" className="space-y-4">
                {dinnerFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-start">
                    <FormField
                      control={form.control}
                      name={`dinner.${index}.item`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="Enter dinner item" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {dinnerFields.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeDinner(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => appendDinner({ item: "" })}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Dinner Item
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Button
          type="submit"
          className="w-full"
          disabled={upsertMenuMutation.isPending}
        >
          {upsertMenuMutation.isPending ? "Saving..." : "Save Menu"}
        </Button>
      </form>
    </Form>
  );
};

export default AddMenuForm;
