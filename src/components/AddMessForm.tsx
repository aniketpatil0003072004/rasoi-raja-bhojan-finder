import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { TablesInsert } from "@/integrations/supabase/types";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const messFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters."),
  address: z.string().min(5, "Address is required."),
  breakfast: z.string().transform((v) =>
    v
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  ),
  lunch: z.string().transform((v) =>
    v
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  ),
  dinner: z.string().transform((v) =>
    v
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  ),
  weekly_plan_price: z.coerce.number(),
  pricing_plans: z.array(
    z.object({
      month: z.coerce
        .number()
        .positive("Month must be a positive number.")
        .max(12, "Month cannot be more than 12.")
        .min(1, "Month must be at least 1."),
      price: z.coerce.number().positive("Price must be a positive number."),
    })
  ),
  contact: z.string().min(10, "Contact number is required."),
  operating_hours: z.string().min(5, "Operating hours are required."),
  offers_delivery: z.boolean().default(false),
  cuisine: z.string().transform((val) =>
    val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  ),
  image: z
    .custom<FileList>()
    .optional()
    .refine(
      (files) => !files || files.length === 0 || files[0].size <= MAX_FILE_SIZE,
      {
        message: `Max file size is 5MB.`,
      }
    )
    .refine(
      (files) =>
        !files ||
        files.length === 0 ||
        ACCEPTED_IMAGE_TYPES.includes(files[0].type),
      {
        message: ".jpg, .jpeg, .png and .webp files are accepted.",
      }
    ),
  cancellation_deadline_time_breakfast: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Enter time in HH:MM format"),
  cancellation_deadline_time_dinner: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Enter time in HH:MM format"),
  cancellation_deadline_time_lunch: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Enter time in HH:MM format"),
});

type MessFormValues = z.infer<typeof messFormSchema>;

const AddMessForm = () => {
  const userData = sessionStorage.getItem("user");
  const user = JSON.parse(userData);
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<MessFormValues>({
    resolver: zodResolver(messFormSchema),
    defaultValues: {
      name: "",
      description: "",
      weekly_plan_price: 0,
      address: "",
      pricing_plans: [
        {
          month: 1,
          price: 1234,
        },
      ],
      contact: "",
      operating_hours: "",
      offers_delivery: false,
      cuisine: "" as any,
      breakfast: "" as any,
      lunch: "" as any,
      dinner: "" as any,
      cancellation_deadline_time_breakfast: "",
      cancellation_deadline_time_dinner: "",
      cancellation_deadline_time_lunch: "",
    },
  });

  const addMessMutation = useMutation({
    mutationFn: async (values: MessFormValues) => {
      if (!user) throw new Error("You must be logged in to add a mess.");

      let imageUrl: string | null = null;
      const imageFile = values.image?.[0];

      if (imageFile) {
        const fileName = `${user.id}/${Date.now()}-${imageFile.name}`;
        console.log(fileName);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("mess_images")
          .upload(fileName, imageFile);

        if (uploadError) {
          throw new Error(`Image Upload Failed: ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from("mess_images")
          .getPublicUrl(uploadData.path);

        imageUrl = publicUrlData.publicUrl;
      }

      const messData: Omit<TablesInsert<"messes">, "owner_id"> & {
        owner_id: string;
      } = {
        name: values.name,
        description: values.description,
        address: values.address,
        weekly_plan_price: values.weekly_plan_price,
        pricing_plans: values.pricing_plans,
        contact: values.contact,
        operating_hours: values.operating_hours,
        offers_delivery: values.offers_delivery,
        cuisine: values.cuisine,
        image_url: imageUrl,
        owner_id: user.id,
        breakfast: values.breakfast,
        lunch: values.lunch,
        dinner: values.dinner,
        cancellation_deadline_time_breakfast:
          values.cancellation_deadline_time_breakfast,
        cancellation_deadline_time_dinner:
          values.cancellation_deadline_time_lunch,
        cancellation_deadline_time_lunch:
          values.cancellation_deadline_time_dinner,
      };

      const { data, error } = await supabase
        .from("messes")
        .insert(messData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Success!",
        description: "Your mess has been added.",
      });
      queryClient.invalidateQueries({ queryKey: ["messes"] });
      queryClient.invalidateQueries({ queryKey: ["featuredMesses"] });
      navigate(`/mess/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add mess: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: MessFormValues) {
    addMessMutation.mutate(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mess Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Aunty's Kitchen" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us about your delicious home-style food"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input placeholder="Full address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="space-y-2">
          <FormLabel className="text-lg font-medium">
            Weekly Plan Price
          </FormLabel>
          <div className="flex items-center gap-4">
            <FormField
              control={form.control}
              name="weekly_plan_price"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Price (INR)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      placeholder="Enter price"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-4">
          <FormLabel className="text-lg font-medium">Pricing Plans</FormLabel>

          {form.watch("pricing_plans").map((plan, index) => (
            <div key={index} className="flex items-center gap-4">
              <FormField
                control={form.control}
                name={`pricing_plans.${index}.month`}
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Month(s)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="1 - 12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`pricing_plans.${index}.price`}
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter price"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {index !== 0 && (
                <Button
                  className="flex self-end"
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    const updated = [...form.getValues("pricing_plans")];
                    updated.splice(index, 1);
                    form.setValue("pricing_plans", updated);
                  }}
                >
                  X
                </Button>
              )}
            </div>
          ))}

          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              form.setValue("pricing_plans", [
                ...form.getValues("pricing_plans"),
                { month: 1, price: 0 },
              ])
            }
          >
            Add Month Plan
          </Button>
        </div>

        <FormField
          control={form.control}
          name="contact"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Number</FormLabel>
              <FormControl>
                <Input placeholder="Your phone number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="operating_hours"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Operating Hours</FormLabel>
              <FormControl>
                <Input placeholder="e.g. 9:00 AM - 10:00 PM" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-6">
          <FormLabel className="text-lg font-medium">
            Cancellation Deadlines
          </FormLabel>

          {/* Breakfast */}
          <FormField
            control={form.control}
            name="cancellation_deadline_time_breakfast"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Breakfast Cancellation Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Lunch */}
          <FormField
            control={form.control}
            name="cancellation_deadline_time_lunch"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lunch Cancellation Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Dinner */}
          <FormField
            control={form.control}
            name="cancellation_deadline_time_dinner"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dinner Cancellation Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="cuisine"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cuisine Types</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. North Indian, South Indian"
                  {...field}
                  value={field.value as unknown as string}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              </FormControl>
              <FormDescription>
                Please provide a comma-separated list of cuisines.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <FormLabel className="text-lg font-medium">General Menu</FormLabel>

          {/* Breakfast */}
          <FormField
            control={form.control}
            name="breakfast"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Breakfast Items</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Idli, Dosa, Upma"
                    {...field}
                    value={field.value as unknown as string}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                </FormControl>
                <FormDescription>Enter comma-separated items.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Lunch */}
          <FormField
            control={form.control}
            name="lunch"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lunch Items</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Rice, Sambar, Rasam, Roti"
                    {...field}
                    value={field.value as unknown as string}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                </FormControl>
                <FormDescription>Enter comma-separated items.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Dinner */}
          <FormField
            control={form.control}
            name="dinner"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dinner Items</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Chapati, Curry, Rice"
                    {...field}
                    value={field.value as unknown as string}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                </FormControl>
                <FormDescription>Enter comma-separated items.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="image"
          render={({ field: { onChange, value, ...rest } }) => (
            <FormItem>
              <FormLabel>Mess Image</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={(e) => {
                    onChange(e.target.files);
                  }}
                  {...rest}
                />
              </FormControl>
              <FormDescription>
                Upload an image for your mess (optional, max 5MB).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="offers_delivery"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Offers Delivery</FormLabel>
                <FormDescription>
                  Check this box if you offer home delivery.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        <Button type="submit" disabled={addMessMutation.isPending}>
          {addMessMutation.isPending ? "Submitting..." : "Add My Mess"}
        </Button>
      </form>
    </Form>
  );
};

export default AddMessForm;
