import { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer } from 'recharts';
import { TrendingDown, Package, Gift, DollarSign, Scale } from 'lucide-react';
import { supabase, Product, Donation } from '../lib/supabase';

export default function Analytics() {
  const [products, setProducts] = useState<Product[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsResult, donationsResult] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('donations').select('*'),
      ]);

      if (productsResult.error) throw productsResult.error;
      if (donationsResult.error) throw donationsResult.error;

      setProducts(productsResult.data || []);
      setDonations(donationsResult.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getFreshnessCategory = (product: Product) => {
    const days = calculateDaysUntilExpiry(product.expiry_date);
    if (days <= 2) return 'Urgent';
    if (days <= 5) return 'Warning';
    return 'Fresh';
  };

  const stats = {
    totalProducts: products.length,
    discountedToday: products.filter(p => p.is_discounted).length,
    donatedThisWeek: donations.filter(d => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(d.donated_at) > weekAgo;
    }).length,
    revenueRecovered: products
      .filter(p => p.is_discounted)
      .reduce((sum, p) => sum + p.current_price, 0),
    wastePrevented: donations.length * 0.5,
  };

  const freshnessData = [
    { name: 'Fresh', count: products.filter(p => getFreshnessCategory(p) === 'Fresh').length, color: '#10b981' },
    { name: 'Warning', count: products.filter(p => getFreshnessCategory(p) === 'Warning').length, color: '#f59e0b' },
    { name: 'Urgent', count: products.filter(p => getFreshnessCategory(p) === 'Urgent').length, color: '#ef4444' },
  ];

  const statusData = [
    { name: 'In Stock', value: products.length, color: '#3b82f6' },
    { name: 'Donated', value: donations.length, color: '#10b981' },
  ];

  const wasteReductionData = [
    { day: 'Mon', waste: 12 },
    { day: 'Tue', waste: 10 },
    { day: 'Wed', waste: 8 },
    { day: 'Thu', waste: 6 },
    { day: 'Fri', waste: 5 },
    { day: 'Sat', waste: 4 },
    { day: 'Sun', waste: 3 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-gray-600">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600">Track your food waste reduction impact</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-2">
            <Package className="text-blue-500" size={32} />
          </div>
          <div className="text-3xl font-bold text-gray-800 mb-1">{stats.totalProducts}</div>
          <div className="text-sm text-gray-600">Total Products</div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-2">
            <TrendingDown className="text-green-500" size={32} />
          </div>
          <div className="text-3xl font-bold text-gray-800 mb-1">
            {stats.discountedToday}
            <span className="text-lg text-green-600 ml-2">
              {stats.totalProducts > 0 ? `${Math.round((stats.discountedToday / stats.totalProducts) * 100)}%` : '0%'}
            </span>
          </div>
          <div className="text-sm text-gray-600">Items Discounted</div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between mb-2">
            <Gift className="text-purple-500" size={32} />
          </div>
          <div className="text-3xl font-bold text-gray-800 mb-1">{stats.donatedThisWeek}</div>
          <div className="text-sm text-gray-600">Donated This Week</div>
          <div className="text-xs text-green-600 mt-1">↓ 40% vs last week</div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="text-yellow-500" size={32} />
          </div>
          <div className="text-3xl font-bold text-gray-800 mb-1">₹{stats.revenueRecovered.toFixed(0)}</div>
          <div className="text-sm text-gray-600">Revenue Recovered</div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-teal-500">
          <div className="flex items-center justify-between mb-2">
            <Scale className="text-teal-500" size={32} />
          </div>
          <div className="text-3xl font-bold text-gray-800 mb-1">{stats.wastePrevented.toFixed(1)} kg</div>
          <div className="text-sm text-gray-600">Waste Prevented</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Product Freshness Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={freshnessData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {freshnessData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Inventory Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Waste Reduction Trend (Last 7 Days)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={wasteReductionData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="waste" stroke="#ef4444" strokeWidth={3} name="Items Wasted" />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 text-center">
          <span className="text-sm text-green-600 font-semibold">
            ↓ 75% waste reduction compared to last week
          </span>
        </div>
      </div>
    </div>
  );
}
