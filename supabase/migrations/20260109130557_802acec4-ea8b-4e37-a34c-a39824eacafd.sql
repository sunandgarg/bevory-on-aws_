-- Fix generate_slug function to have proper search_path
CREATE OR REPLACE FUNCTION public.generate_slug(input_text text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path = public
AS $function$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(
        trim(input_text),
        '[^a-zA-Z0-9\s-]', '', 'g'
      ),
      '\s+', '-', 'g'
    )
  );
END;
$function$;

-- Fix comparisons INSERT policy - require authenticated users
DROP POLICY IF EXISTS "Comparisons can be created by anyone" ON public.comparisons;
CREATE POLICY "Authenticated users can create comparisons" 
ON public.comparisons 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Fix profiles INSERT policy - only allow system trigger or user's own profile
DROP POLICY IF EXISTS "System can insert profiles" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);