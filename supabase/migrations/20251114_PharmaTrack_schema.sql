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


-- Helper function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  role_name TEXT;
BEGIN
  SELECT r.name INTO role_name
  FROM public.user_roles ur
  JOIN public.roles r ON ur.role_id = r.id
  WHERE ur.user_id = get_user_role.user_id
  LIMIT 1;
  RETURN role_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for products
DROP POLICY IF EXISTS "Users can view all products" ON public.products;
CREATE POLICY "Users can view all products" ON public.products FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products" ON public.products FOR ALL TO authenticated
USING (public.get_user_role(auth.uid()) IN ('admin', 'manager'))
WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'manager'));

-- RLS Policies for batches
DROP POLICY IF EXISTS "Users can view all batches" ON public.batches;
CREATE POLICY "Users can view all batches" ON public.batches FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins and managers can manage batches" ON public.batches;
CREATE POLICY "Admins and managers can manage batches" ON public.batches FOR ALL TO authenticated
USING (public.get_user_role(auth.uid()) IN ('admin', 'manager'))
WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'manager'));

-- RLS Policies for suppliers
DROP POLICY IF EXISTS "Users can view all suppliers" ON public.suppliers;
CREATE POLICY "Users can view all suppliers" ON public.suppliers FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins and managers can manage suppliers" ON public.suppliers;
CREATE POLICY "Admins and managers can manage suppliers" ON public.suppliers FOR ALL TO authenticated
USING (public.get_user_role(auth.uid()) IN ('admin', 'manager'))
WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'manager'));

-- RLS Policies for purchase_orders
DROP POLICY IF EXISTS "Users can view all purchase orders" ON public.purchase_orders;
CREATE POLICY "Users can view all purchase orders" ON public.purchase_orders FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins and managers can manage purchase orders" ON public.purchase_orders;
CREATE POLICY "Admins and managers can manage purchase orders" ON public.purchase_orders FOR ALL TO authenticated
USING (public.get_user_role(auth.uid()) IN ('admin', 'manager'))
WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'manager'));

-- RLS Policies for purchase_order_items
DROP POLICY IF EXISTS "Users can view all purchase order items" ON public.purchase_order_items;
CREATE POLICY "Users can view all purchase order items" ON public.purchase_order_items FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins and managers can manage purchase order items" ON public.purchase_order_items;
CREATE POLICY "Admins and managers can manage purchase order items" ON public.purchase_order_items FOR ALL TO authenticated
USING (public.get_user_role(auth.uid()) IN ('admin', 'manager'))
WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'manager'));

-- RLS Policies for sales_orders
DROP POLICY IF EXISTS "Users can view all sales orders" ON public.sales_orders;
CREATE POLICY "Users can view all sales orders" ON public.sales_orders FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins and managers can manage sales orders" ON public.sales_orders;
CREATE POLICY "Admins and managers can manage sales orders" ON public.sales_orders FOR ALL TO authenticated
USING (public.get_user_role(auth.uid()) IN ('admin', 'manager'))
WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'manager'));

-- RLS Policies for sales_order_items
DROP POLICY IF EXISTS "Users can view all sales order items" ON public.sales_order_items;
CREATE POLICY "Users can view all sales order items" ON public.sales_order_items FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins and managers can manage sales order items" ON public.sales_order_items;
CREATE POLICY "Admins and managers can manage sales order items" ON public.sales_order_items FOR ALL TO authenticated
USING (public.get_user_role(auth.uid()) IN ('admin', 'manager'))
WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'manager'));

-- RLS Policies for quality_control_records
DROP POLICY IF EXISTS "Users can view all QC records" ON public.quality_control_records;
CREATE POLICY "Users can view all QC records" ON public.quality_control_records FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins, managers, and inspectors can manage QC records" ON public.quality_control_records;
CREATE POLICY "Admins, managers, and inspectors can manage QC records" ON public.quality_control_records FOR ALL TO authenticated
USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'inspector'))
WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'inspector'));

-- RLS Policies for roles
DROP POLICY IF EXISTS "Everyone can view roles" ON public.roles;
CREATE POLICY "Everyone can view roles" ON public.roles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage roles" ON public.roles;
CREATE POLICY "Admins can manage roles" ON public.roles FOR ALL TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin')
WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

-- RLS Policies for user_roles
DROP POLICY IF EXISTS "Users can view all user roles" ON public.user_roles;
CREATE POLICY "Users can view all user roles" ON public.user_roles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
CREATE POLICY "Admins can manage user roles" ON public.user_roles FOR ALL TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin')
WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

-- RLS Policies for reports
DROP POLICY IF EXISTS "Users can view all reports" ON public.reports;
CREATE POLICY "Users can view all reports" ON public.reports FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins and managers can manage reports" ON public.reports;
CREATE POLICY "Admins and managers can manage reports" ON public.reports FOR ALL TO authenticated
USING (public.get_user_role(auth.uid()) IN ('admin', 'manager'))
WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'manager'));

-- RLS Policies for settings
DROP POLICY IF EXISTS "Everyone can view settings" ON public.settings;
CREATE POLICY "Everyone can view settings" ON public.settings FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage settings" ON public.settings;
CREATE POLICY "Admins can manage settings" ON public.settings FOR ALL TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin')
WITH CHECK (public.get_user_role(auth.uid()) = 'admin');


-- Create triggers for updated_at columns
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_batches_updated_at BEFORE UPDATE ON public.batches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sales_orders_updated_at BEFORE UPDATE ON public.sales_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate total stock value
CREATE OR REPLACE FUNCTION public.calculate_total_stock_value()
RETURNS DECIMAL AS $$
DECLARE
  total_value DECIMAL;
BEGIN
  SELECT SUM(price * stock_quantity) INTO total_value
  FROM public.products;
  RETURN total_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate this month's sales
CREATE OR REPLACE FUNCTION public.calculate_monthly_sales()
RETURNS DECIMAL AS $$
DECLARE
  total_sales DECIMAL;
BEGIN
  SELECT SUM(total_amount) INTO total_sales
  FROM public.sales_orders
  WHERE order_date >= date_trunc('month', CURRENT_DATE)
    AND order_date < date_trunc('month', CURRENT_DATE) + interval '1 month';
  RETURN total_sales;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;