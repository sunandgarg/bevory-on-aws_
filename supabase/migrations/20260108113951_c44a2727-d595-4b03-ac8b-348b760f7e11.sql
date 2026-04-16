-- Create user_permissions table for granular section access
CREATE TABLE IF NOT EXISTS public.user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    section TEXT NOT NULL,
    can_view BOOLEAN DEFAULT true,
    can_create BOOLEAN DEFAULT true,
    can_edit BOOLEAN DEFAULT true,
    can_delete BOOLEAN DEFAULT false,
    can_publish BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, section)
);

-- Create content_drafts table for approval workflow
CREATE TABLE IF NOT EXISTS public.content_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type TEXT NOT NULL,
    content_id UUID,
    content_data JSONB NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_manager UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    review_notes TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_drafts ENABLE ROW LEVEL SECURITY;

-- Admin can manage all permissions
CREATE POLICY "Admins can manage user permissions"
ON public.user_permissions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Users can view their own permissions
CREATE POLICY "Users can view own permissions"
ON public.user_permissions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admin and managers can view all drafts
CREATE POLICY "Admins and managers can view all drafts"
ON public.content_drafts
FOR SELECT
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'content_manager') OR
    created_by = auth.uid()
);

-- Writers can create drafts
CREATE POLICY "Writers can create drafts"
ON public.content_drafts
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

-- Admin and managers can update drafts
CREATE POLICY "Admins and managers can update drafts"
ON public.content_drafts
FOR UPDATE
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'content_manager') OR
    created_by = auth.uid()
);

-- Admin can delete drafts
CREATE POLICY "Admins can delete drafts"
ON public.content_drafts
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create function to check section permission
CREATE OR REPLACE FUNCTION public.has_section_permission(
    _user_id UUID,
    _section TEXT,
    _permission TEXT DEFAULT 'view'
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        -- Admins have all permissions
        CASE WHEN public.has_role(_user_id, 'admin') THEN TRUE
        -- Content managers have most permissions except delete/publish by default
        WHEN public.has_role(_user_id, 'content_manager') THEN
            CASE 
                WHEN _permission = 'view' THEN TRUE
                WHEN _permission = 'create' THEN TRUE
                WHEN _permission = 'edit' THEN TRUE
                WHEN _permission = 'publish' THEN TRUE
                WHEN _permission = 'delete' THEN FALSE
                ELSE FALSE
            END
        -- Check specific permission in user_permissions table
        ELSE
            COALESCE(
                (SELECT 
                    CASE _permission
                        WHEN 'view' THEN can_view
                        WHEN 'create' THEN can_create
                        WHEN 'edit' THEN can_edit
                        WHEN 'delete' THEN can_delete
                        WHEN 'publish' THEN can_publish
                        ELSE FALSE
                    END
                FROM public.user_permissions
                WHERE user_id = _user_id AND section = _section),
                FALSE
            )
        END
$$;

-- Create trigger for updated_at
CREATE TRIGGER update_user_permissions_updated_at
    BEFORE UPDATE ON public.user_permissions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_drafts_updated_at
    BEFORE UPDATE ON public.content_drafts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();