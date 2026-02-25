/*
  # FoodLoop Database Schema

  1. New Tables
    - `products`
      - `id` (uuid, primary key)
      - `name` (text) - Product name
      - `expiry_date` (date) - When product expires
      - `original_price` (decimal) - Original price
      - `current_price` (decimal) - Current price after discounts
      - `is_discounted` (boolean) - Whether discount is applied
      - `created_at` (timestamptz) - Creation timestamp
    
    - `food_banks`
      - `id` (uuid, primary key)
      - `name` (text) - Food bank name
      - `distance` (decimal) - Distance in km
      - `capacity` (text) - What they can accept
      - `contact` (text) - Contact information
      - `created_at` (timestamptz) - Creation timestamp
    
    - `donations`
      - `id` (uuid, primary key)
      - `product_name` (text) - Name of donated product
      - `food_bank_name` (text) - Food bank that received it
      - `quantity` (integer) - Quantity donated
      - `donated_at` (timestamptz) - When donation was made
      - `product_price` (decimal) - Original product price
  
  2. Security
    - Enable RLS on all tables
    - Add policies for public access (since this is a demo app without authentication)
*/

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  expiry_date date NOT NULL,
  original_price decimal(10,2) NOT NULL,
  current_price decimal(10,2) NOT NULL,
  is_discounted boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create food_banks table
CREATE TABLE IF NOT EXISTS food_banks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  distance decimal(5,2) NOT NULL,
  capacity text NOT NULL,
  contact text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create donations table
CREATE TABLE IF NOT EXISTS donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name text NOT NULL,
  food_bank_name text NOT NULL,
  quantity integer DEFAULT 1,
  donated_at timestamptz DEFAULT now(),
  product_price decimal(10,2) NOT NULL
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (demo app)
CREATE POLICY "Allow public read access to products"
  ON products FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert access to products"
  ON products FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update access to products"
  ON products FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to products"
  ON products FOR DELETE
  TO anon
  USING (true);

CREATE POLICY "Allow public read access to food_banks"
  ON food_banks FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert access to food_banks"
  ON food_banks FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public read access to donations"
  ON donations FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert access to donations"
  ON donations FOR INSERT
  TO anon
  WITH CHECK (true);

-- Insert sample food banks
INSERT INTO food_banks (name, distance, capacity, contact) VALUES
  ('St. Mary''s Food Bank', 4.2, 'Dairy, Bakery, Produce', '+91-9876543210'),
  ('Hope Community Kitchen', 7.5, 'All Categories', '+91-9876543211'),
  ('Green Valley Food Pantry', 5.8, 'Packaged Goods, Canned Items', '+91-9876543212')
ON CONFLICT DO NOTHING;

-- Insert sample products with various expiry dates
INSERT INTO products (name, expiry_date, original_price, current_price) VALUES
  ('Fresh Milk 1L', CURRENT_DATE + INTERVAL '1 day', 60.00, 60.00),
  ('Whole Wheat Bread', CURRENT_DATE + INTERVAL '2 days', 45.00, 45.00),
  ('Greek Yogurt', CURRENT_DATE + INTERVAL '3 days', 80.00, 80.00),
  ('Cheddar Cheese', CURRENT_DATE + INTERVAL '4 days', 120.00, 120.00),
  ('Fresh Spinach', CURRENT_DATE + INTERVAL '5 days', 35.00, 35.00),
  ('Cherry Tomatoes', CURRENT_DATE + INTERVAL '6 days', 55.00, 55.00),
  ('Organic Eggs (12)', CURRENT_DATE + INTERVAL '8 days', 90.00, 90.00),
  ('Butter 200g', CURRENT_DATE + INTERVAL '10 days', 100.00, 100.00),
  ('Orange Juice 1L', CURRENT_DATE + INTERVAL '12 days', 85.00, 85.00),
  ('Chocolate Cookies', CURRENT_DATE + INTERVAL '15 days', 65.00, 65.00)
ON CONFLICT DO NOTHING;