-- Add meta_title and meta_description to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS meta_title text,
ADD COLUMN IF NOT EXISTS meta_description text;

-- Add meta_title and meta_description to categories table
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS meta_title text,
ADD COLUMN IF NOT EXISTS meta_description text;

-- Clear existing location data and recreate with proper structure
DELETE FROM public.product_prices;
DELETE FROM public.cities;
DELETE FROM public.states;
DELETE FROM public.countries WHERE code = 'IN';

-- Insert India
INSERT INTO public.countries (id, name, code, flag) 
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'India', 'IN', '🇮🇳');

-- Insert states sorted alphabetically
INSERT INTO public.states (id, name, code, country_id, is_visible, is_popular) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Delhi', 'DL', '550e8400-e29b-41d4-a716-446655440000', true, true),
('550e8400-e29b-41d4-a716-446655440002', 'Goa', 'GA', '550e8400-e29b-41d4-a716-446655440000', true, true),
('550e8400-e29b-41d4-a716-446655440003', 'Haryana', 'HR', '550e8400-e29b-41d4-a716-446655440000', true, false),
('550e8400-e29b-41d4-a716-446655440004', 'Karnataka', 'KA', '550e8400-e29b-41d4-a716-446655440000', true, true),
('550e8400-e29b-41d4-a716-446655440005', 'Madhya Pradesh', 'MP', '550e8400-e29b-41d4-a716-446655440000', true, false),
('550e8400-e29b-41d4-a716-446655440006', 'Rajasthan', 'RJ', '550e8400-e29b-41d4-a716-446655440000', true, true),
('550e8400-e29b-41d4-a716-446655440007', 'Telangana', 'TG', '550e8400-e29b-41d4-a716-446655440000', true, true),
('550e8400-e29b-41d4-a716-446655440008', 'Uttar Pradesh', 'UP', '550e8400-e29b-41d4-a716-446655440000', true, true),
('550e8400-e29b-41d4-a716-446655440009', 'West Bengal', 'WB', '550e8400-e29b-41d4-a716-446655440000', true, true);

-- Insert cities with proper popular flags
-- Delhi
INSERT INTO public.cities (name, state_id, is_visible, is_popular) VALUES
('Delhi', '550e8400-e29b-41d4-a716-446655440001', true, true);

-- Goa
INSERT INTO public.cities (name, state_id, is_visible, is_popular) VALUES
('Goa', '550e8400-e29b-41d4-a716-446655440002', true, true);

-- Haryana
INSERT INTO public.cities (name, state_id, is_visible, is_popular) VALUES
('Gurgaon', '550e8400-e29b-41d4-a716-446655440003', true, true),
('Faridabad', '550e8400-e29b-41d4-a716-446655440003', true, false);

-- Karnataka
INSERT INTO public.cities (name, state_id, is_visible, is_popular) VALUES
('Bangalore', '550e8400-e29b-41d4-a716-446655440004', true, true),
('Hubli Dharwad', '550e8400-e29b-41d4-a716-446655440004', true, false),
('Mangalore', '550e8400-e29b-41d4-a716-446655440004', true, false),
('Mysore', '550e8400-e29b-41d4-a716-446655440004', true, false);

-- Madhya Pradesh
INSERT INTO public.cities (name, state_id, is_visible, is_popular) VALUES
('Bhopal', '550e8400-e29b-41d4-a716-446655440005', true, false),
('Gwalior', '550e8400-e29b-41d4-a716-446655440005', true, false),
('Indore', '550e8400-e29b-41d4-a716-446655440005', true, false),
('Jabalpur', '550e8400-e29b-41d4-a716-446655440005', true, false);

-- Rajasthan
INSERT INTO public.cities (name, state_id, is_visible, is_popular) VALUES
('Jaipur', '550e8400-e29b-41d4-a716-446655440006', true, true),
('Jodhpur', '550e8400-e29b-41d4-a716-446655440006', true, false),
('Kota', '550e8400-e29b-41d4-a716-446655440006', true, false),
('Udaipur', '550e8400-e29b-41d4-a716-446655440006', true, false);

-- Telangana
INSERT INTO public.cities (name, state_id, is_visible, is_popular) VALUES
('Hyderabad', '550e8400-e29b-41d4-a716-446655440007', true, true),
('Warangal', '550e8400-e29b-41d4-a716-446655440007', true, false);

-- Uttar Pradesh
INSERT INTO public.cities (name, state_id, is_visible, is_popular) VALUES
('Lucknow', '550e8400-e29b-41d4-a716-446655440008', true, true),
('Agra', '550e8400-e29b-41d4-a716-446655440008', true, false),
('Ghaziabad', '550e8400-e29b-41d4-a716-446655440008', true, false),
('Kanpur', '550e8400-e29b-41d4-a716-446655440008', true, false),
('Noida', '550e8400-e29b-41d4-a716-446655440008', true, false);

-- West Bengal
INSERT INTO public.cities (name, state_id, is_visible, is_popular) VALUES
('Kolkata', '550e8400-e29b-41d4-a716-446655440009', true, true),
('Asansol', '550e8400-e29b-41d4-a716-446655440009', true, false);

-- Also add Mumbai (need Maharashtra state)
INSERT INTO public.states (id, name, code, country_id, is_visible, is_popular) VALUES
('550e8400-e29b-41d4-a716-446655440010', 'Maharashtra', 'MH', '550e8400-e29b-41d4-a716-446655440000', true, true);

INSERT INTO public.cities (name, state_id, is_visible, is_popular) VALUES
('Mumbai', '550e8400-e29b-41d4-a716-446655440010', true, true);