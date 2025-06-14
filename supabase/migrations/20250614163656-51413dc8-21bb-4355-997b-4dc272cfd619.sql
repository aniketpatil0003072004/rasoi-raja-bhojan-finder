
-- Create a storage bucket for mess profile images, publicly accessible for reads.
INSERT INTO storage.buckets (id, name, public)
VALUES ('mess_images', 'mess_images', true);

-- Create a storage bucket for payment proofs.
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment_proofs', 'payment_proofs', false);

-- Create a storage bucket for delivery proofs.
INSERT INTO storage.buckets (id, name, public)
VALUES ('delivery_proofs', 'delivery_proofs', false);

-- Add Row-Level Security policies for the 'mess_images' bucket.

-- This policy allows anyone to view images in the mess_images bucket.
CREATE POLICY "Mess images are publicly readable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'mess_images');

-- This policy allows any authenticated user who is a 'mess_owner' to insert files.
CREATE POLICY "Allow mess_owner to insert mess_images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'mess_images' AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'mess_owner');

-- This policy allows 'mess_owner' to update their own images.
CREATE POLICY "Allow mess_owner to update their own mess_images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'mess_images' AND auth.uid() = owner);

-- This policy allows 'mess_owner' to delete their own images.
CREATE POLICY "Allow mess_owner to delete their own mess_images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'mess_images' AND auth.uid() = owner);
