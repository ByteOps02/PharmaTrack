-- Merged PharmaTrack Schema

-- Create profiles table for additional user information
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles (drop if exists first)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for automatic timestamp updates on profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile when user signs up (drop if exists first)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  reorder_level INTEGER NOT NULL DEFAULT 10,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL
);

-- Create batches table
CREATE TABLE IF NOT EXISTS public.batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  batch_number TEXT NOT NULL UNIQUE,
  manufacture_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  quantity INTEGER NOT NULL,
  location TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL
);

-- Create suppliers table
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL
);

-- Create purchase_orders table
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number TEXT NOT NULL UNIQUE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE NOT NULL,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL
);

-- Create purchase_order_items table
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sales_orders table
CREATE TABLE IF NOT EXISTS public.sales_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  so_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL
);

-- Create sales_order_items table
CREATE TABLE IF NOT EXISTS public.sales_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_id UUID REFERENCES public.sales_orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quality_control_records table
CREATE TABLE IF NOT EXISTS public.quality_control_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  test_type TEXT NOT NULL,
  result TEXT NOT NULL,
  inspector_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  inspection_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create roles table
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);

-- Create reports table
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  generated_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create settings table
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_control_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for products
CREATE POLICY "Users can view all products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert their own products" ON public.products FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own products" ON public.products FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own products" ON public.products FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for batches
CREATE POLICY "Users can view all batches" ON public.batches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert their own batches" ON public.batches FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own batches" ON public.batches FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own batches" ON public.batches FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for suppliers
CREATE POLICY "Users can view all suppliers" ON public.suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert their own suppliers" ON public.suppliers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own suppliers" ON public.suppliers FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own suppliers" ON public.suppliers FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for purchase_orders
CREATE POLICY "Users can view all purchase orders" ON public.purchase_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert their own purchase orders" ON public.purchase_orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own purchase orders" ON public.purchase_orders FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own purchase orders" ON public.purchase_orders FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for purchase_order_items
CREATE POLICY "Users can view all purchase order items" ON public.purchase_order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert purchase order items" ON public.purchase_order_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update purchase order items" ON public.purchase_order_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete purchase order items" ON public.purchase_order_items FOR DELETE TO authenticated USING (true);

-- RLS Policies for sales_orders
CREATE POLICY "Users can view all sales orders" ON public.sales_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert their own sales orders" ON public.sales_orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sales orders" ON public.sales_orders FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own sales orders" ON public.sales_orders FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for sales_order_items
CREATE POLICY "Users can view all sales order items" ON public.sales_order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert sales order items" ON public.sales_order_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update sales order items" ON public.sales_order_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete sales order items" ON public.sales_order_items FOR DELETE TO authenticated USING (true);

-- RLS Policies for quality_control_records
CREATE POLICY "Users can view all QC records" ON public.quality_control_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert QC records" ON public.quality_control_records FOR INSERT TO authenticated WITH CHECK (auth.uid() = inspector_id);
CREATE POLICY "Users can update their own QC records" ON public.quality_control_records FOR UPDATE TO authenticated USING (auth.uid() = inspector_id);
CREATE POLICY "Users can delete their own QC records" ON public.quality_control_records FOR DELETE TO authenticated USING (auth.uid() = inspector_id);

-- RLS Policies for roles
CREATE POLICY "Everyone can view roles" ON public.roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert roles" ON public.roles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update roles" ON public.roles FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete roles" ON public.roles FOR DELETE TO authenticated USING (true);

-- RLS Policies for user_roles
CREATE POLICY "Users can view all user roles" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert user roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update user roles" ON public.user_roles FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete user roles" ON public.user_roles FOR DELETE TO authenticated USING (true);

-- RLS Policies for reports
CREATE POLICY "Users can view all reports" ON public.reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert their own reports" ON public.reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = generated_by);
CREATE POLICY "Users can update their own reports" ON public.reports FOR UPDATE TO authenticated USING (auth.uid() = generated_by);
CREATE POLICY "Users can delete their own reports" ON public.reports FOR DELETE TO authenticated USING (auth.uid() = generated_by);

-- RLS Policies for settings
CREATE POLICY "Everyone can view settings" ON public.settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage settings" ON public.settings FOR ALL TO authenticated USING (true);

-- Create triggers for updated_at columns
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_batches_updated_at BEFORE UPDATE ON public.batches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sales_orders_updated_at BEFORE UPDATE ON public.sales_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();