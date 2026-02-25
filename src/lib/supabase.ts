import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Product {
  id: string;
  name: string;
  expiry_date: string;
  original_price: number;
  current_price: number;
  is_discounted: boolean;
  created_at: string;
}

export interface FoodBank {
  id: string;
  name: string;
  distance: number;
  capacity: string;
  contact: string;
  created_at: string;
}

export interface Donation {
  id: string;
  product_name: string;
  food_bank_name: string;
  quantity: number;
  donated_at: string;
  product_price: number;
}
