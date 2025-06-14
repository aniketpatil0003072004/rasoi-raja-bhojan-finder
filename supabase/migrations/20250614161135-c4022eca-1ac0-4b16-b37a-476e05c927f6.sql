
-- Enable Row Level Security on the menus table
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;

-- 1. Create a policy that allows anyone to view the menus.
CREATE POLICY "Menus are viewable by everyone"
ON public.menus FOR SELECT
USING (true);

-- 2. Create a policy that allows mess owners to add menu items for their messes.
CREATE POLICY "Owners can insert menus for their mess"
ON public.menus FOR INSERT
WITH CHECK (auth.uid() = (SELECT owner_id FROM public.messes WHERE id = mess_id));

-- 3. Create a policy that allows mess owners to update menu items for their messes.
CREATE POLICY "Owners can update menus for their mess"
ON public.menus FOR UPDATE
USING (auth.uid() = (SELECT owner_id FROM public.messes WHERE id = mess_id));

-- 4. Create a policy that allows mess owners to delete menu items for their messes.
CREATE POLICY "Owners can delete menus for their mess"
ON public.menus FOR DELETE
USING (auth.uid() = (SELECT owner_id FROM public.messes WHERE id = mess_id));
