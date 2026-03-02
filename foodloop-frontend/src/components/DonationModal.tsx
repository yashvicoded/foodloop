import React, { useState } from 'react';
import { X, Truck, Package, Loader, MapPin, Phone } from 'lucide-react';
import { Product } from '../types';
import { donationAPI } from '../lib/api';

export default function DonationModal({ product, onClose, onSuccess }: any) {
  // 1. CRITICAL SAFETY: If product is null/undefined, don't render anything
  if (!product) return null;

  // 2. DATA FALLBACKS: Use '0' or '1' if the database values are missing
  const [quantity, setQuantity] = useState(product?.quantity || 1);
  const [selectedBank, setSelectedBank] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const unitPrice = product?.originalPrice || 0;

  const handleDonate = async () => {
    if (!selectedBank) return setError('Please choose a Food Bank');
    setIsProcessing(true);
    try {
      await donationAPI.record({ 
       productId: product.id,      // Ensure this matches your backend req.body
      productName: product.name,  // Added for history visibility
      foodBankId: selectedBank.id,
      quantity,
      });
      onSuccess();
    } catch (err: any) {
      setError('Connection lost. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-[50px] max-w-lg w-full p-10 shadow-2xl animate-in zoom-in duration-300">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
           <h2 className="text-2xl font-black text-gray-800">Donate {product?.name || 'Item'}</h2>
           <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-all">
             <X size={24} className="text-gray-400" />
           </button>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl font-bold mb-6 text-sm">{error}</div>}

        <div className="space-y-6">
           {/* Summary Box */}
           <div className="bg-green-50 p-6 rounded-[30px] border border-green-100 flex justify-between items-center">
              <div>
                 <p className="text-[10px] font-black text-green-400 uppercase">Donation Value</p>
                 <p className="text-2xl font-black text-green-700">₹{(unitPrice * quantity).toFixed(2)}</p>
              </div>
              <div className="text-right">
                 <p className="text-[10px] font-black text-green-400 uppercase">Available</p>
                 <p className="text-xl font-black text-green-700">{product?.quantity || 0} Units</p>
              </div>
           </div>

           {/* NGO Selection */}
           <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3 ml-2">Select Recipient</label>
              <div className="space-y-2">
                 {[
                   { id: '1', name: 'Food Bank India', dist: '3.2 km' },
                   { id: '2', name: 'Hope Society', dist: '5.1 km' }
                 ].map((bank) => (
                   <button 
                     key={bank.id}
                     onClick={() => setSelectedBank(bank)}
                     className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex justify-between items-center ${
                       selectedBank?.id === bank.id ? 'border-[#2ecc71] bg-green-50/50' : 'border-gray-50 hover:border-gray-100'
                     }`}
                   >
                      <span className="font-bold text-gray-700">{bank.name}</span>
                      <span className="text-[10px] font-black text-gray-400">{bank.dist}</span>
                   </button>
                 ))}
              </div>
           </div>

           {/* Action Buttons */}
           <div className="flex gap-4 pt-4">
              <button onClick={onClose} className="flex-1 py-4 font-black text-gray-400">Cancel</button>
              <button 
                onClick={handleDonate}
                disabled={isProcessing || !selectedBank}
                className="flex-1 bg-[#2ecc71] hover:bg-[#27ae60] text-white py-4 rounded-3xl font-black shadow-lg shadow-green-100 transition-all flex items-center justify-center gap-2 disabled:bg-gray-200"
              >
                {isProcessing ? <Loader className="animate-spin" /> : <><Truck size={20} /> Confirm</>}
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}