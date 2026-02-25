import { useState, useEffect } from 'react';
import { MapPin, Phone, Truck, Package } from 'lucide-react';
import { supabase, FoodBank, Donation } from '../lib/supabase';

export default function Donations() {
  const [foodBanks, setFoodBanks] = useState<FoodBank[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFoodBanks();
    fetchDonations();
  }, []);

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
    } finally {
      setLoading(false);
    }
  };

  const fetchDonations = async () => {
    try {
      const { data, error } = await supabase
        .from('donations')
        .select('*')
        .order('donated_at', { ascending: false });

      if (error) throw error;
      setDonations(data || []);
    } catch (error) {
      console.error('Error fetching donations:', error);
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Food Bank Partners</h1>
        <p className="text-gray-600">Connect with local food banks to donate surplus food</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {foodBanks.map((foodBank) => (
          <div
            key={foodBank.id}
            className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <Truck className="text-green-600" size={32} />
            </div>

            <h3 className="text-xl font-bold text-gray-800 mb-4">{foodBank.name}</h3>

            <div className="space-y-3 mb-4">
              <div className="flex items-start gap-3 text-sm text-gray-600">
                <MapPin size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <span>{foodBank.distance} km away</span>
              </div>

              <div className="flex items-start gap-3 text-sm text-gray-600">
                <Package size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium text-gray-700">Can accept:</span>
                  <br />
                  {foodBank.capacity}
                </div>
              </div>

              <div className="flex items-start gap-3 text-sm text-gray-600">
                <Phone size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <span>{foodBank.contact}</span>
              </div>
            </div>

            <button className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors">
              Contact
            </button>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Donation History</h2>

        {donations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No donations yet. Expired products can be donated to food banks.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Product Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Food Bank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date Donated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {donations.map((donation) => (
                  <tr key={donation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                      {donation.product_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {donation.food_bank_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {donation.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(donation.donated_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                      ₹{donation.product_price.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
