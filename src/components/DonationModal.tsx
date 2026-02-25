import { X, Truck, MapPin } from 'lucide-react';
import { Product, FoodBank } from '../lib/supabase';

interface DonationModalProps {
  product: Product;
  foodBanks: FoodBank[];
  onClose: () => void;
  onConfirm: (foodBankName: string) => void;
}

export default function DonationModal({ product, foodBanks, onClose, onConfirm }: DonationModalProps) {
  const handleDonate = (foodBankName: string) => {
    onConfirm(foodBankName);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-gray-800">Donate Product</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">Product Details</h3>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Name:</span> {product.name}</p>
              <p><span className="font-medium">Expiry Date:</span> {new Date(product.expiry_date).toLocaleDateString()}</p>
              <p><span className="font-medium">Value:</span> ₹{product.original_price.toFixed(2)}</p>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Food Bank</h3>
          <div className="space-y-3">
            {foodBanks.map((foodBank) => (
              <div
                key={foodBank.id}
                className="border-2 border-gray-200 rounded-lg p-4 hover:border-green-500 transition-colors cursor-pointer"
                onClick={() => handleDonate(foodBank.name)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800 mb-2">{foodBank.name}</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-gray-400" />
                        <span>{foodBank.distance} km away</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Truck size={16} className="text-gray-400" />
                        <span>Can accept: {foodBank.capacity}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Contact: {foodBank.contact}</p>
                    </div>
                  </div>
                  <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
                    Donate Here
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
