import { useState, useEffect } from 'react';
import { Calculator, Check } from 'lucide-react';
import { supabase, Product, FoodBank } from '../lib/supabase';
import ProductCard from './ProductCard';
import ProductForm from './ProductForm';
import DonationModal from './DonationModal';

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [foodBanks, setFoodBanks] = useState<FoodBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchFoodBanks();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('expiry_date', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFoodBanks = async () => {
    try {
      const { data, error } = await supabase
        .from('food_banks')
        .select('*')
        .order('distance', { ascending: true });

      if (error) throw error;
      setFoodBanks(data || []);
    } catch (error) {
      console.error('Error fetching food banks:', error);
    }
  };

  const handleAddProduct = async (productData: { name: string; expiry_date: string; price: number }) => {
    try {
      const { error } = await supabase.from('products').insert({
        name: productData.name,
        expiry_date: productData.expiry_date,
        original_price: productData.price,
        current_price: productData.price,
        is_discounted: false,
      });

      if (error) throw error;
      fetchProducts();
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);

      if (error) throw error;
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const calculateDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleCalculateDiscounts = () => {
    const updatedProducts = products.map((product) => {
      const daysLeft = calculateDaysUntilExpiry(product.expiry_date);
      let discountPercent = 0;

      if (daysLeft <= 2) discountPercent = 75;
      else if (daysLeft <= 4) discountPercent = 50;
      else if (daysLeft <= 6) discountPercent = 25;

      if (discountPercent > 0) {
        const discountedPrice = product.original_price * (1 - discountPercent / 100);
        return { ...product, current_price: discountedPrice, is_discounted: true };
      }
      return product;
    });

    setProducts(updatedProducts);
    alert('Discounts calculated! Click "Apply Discounts" to save.');
  };

  const handleApplyDiscounts = async () => {
    try {
      for (const product of products) {
        if (product.is_discounted) {
          await supabase
            .from('products')
            .update({
              current_price: product.current_price,
              is_discounted: true,
            })
            .eq('id', product.id);
        }
      }
      alert('Discounts applied successfully!');
      fetchProducts();
    } catch (error) {
      console.error('Error applying discounts:', error);
    }
  };

  const handleDonateProduct = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleConfirmDonation = async (foodBankName: string) => {
    if (!selectedProduct) return;

    try {
      await supabase.from('donations').insert({
        product_name: selectedProduct.name,
        food_bank_name: foodBankName,
        quantity: 1,
        product_price: selectedProduct.original_price,
      });

      await supabase.from('products').delete().eq('id', selectedProduct.id);

      setSuccessMessage(`Item sent to ${foodBankName}`);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

      fetchProducts();
      setSelectedProduct(null);
    } catch (error) {
      console.error('Error donating product:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <ProductForm onAdd={handleAddProduct} />

      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={handleCalculateDiscounts}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors"
        >
          <Calculator size={20} />
          Calculate Discounts
        </button>
        <button
          onClick={handleApplyDiscounts}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors"
        >
          <Check size={20} />
          Apply Discounts
        </button>
      </div>

      {showSuccess && (
        <div className="bg-green-100 border-2 border-green-500 text-green-800 px-6 py-4 rounded-lg mb-6 font-semibold">
          ✓ {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onDelete={handleDeleteProduct}
            onDonate={handleDonateProduct}
          />
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No products in inventory. Add some products to get started!
        </div>
      )}

      {selectedProduct && (
        <DonationModal
          product={selectedProduct}
          foodBanks={foodBanks}
          onClose={() => setSelectedProduct(null)}
          onConfirm={handleConfirmDonation}
        />
      )}
    </div>
  );
}
