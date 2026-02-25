import { useState } from 'react';
import { LayoutDashboard, Gift, BarChart3, Leaf } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Donations from './components/Donations';
import Analytics from './components/Analytics';

type TabType = 'dashboard' | 'donations' | 'analytics';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const tabs = [
    { id: 'dashboard' as TabType, label: 'Products', icon: LayoutDashboard },
    { id: 'donations' as TabType, label: 'Donations', icon: Gift },
    { id: 'analytics' as TabType, label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-green-600 to-teal-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-white rounded-full p-3">
              <Leaf className="text-green-600" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">FoodLoop</h1>
              <p className="text-green-100 text-sm">Reducing Food Waste, One Product at a Time</p>
            </div>
          </div>

          <nav className="flex gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                    activeTab === tab.id
                      ? 'bg-white text-green-600 shadow-md'
                      : 'bg-green-500 bg-opacity-20 text-white hover:bg-opacity-30'
                  }`}
                >
                  <Icon size={20} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="py-6">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'donations' && <Donations />}
        {activeTab === 'analytics' && <Analytics />}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-4 text-center text-gray-600 text-sm">
          FoodLoop - Hackathon Project | Built with React + Supabase
        </div>
      </footer>
    </div>
  );
}

export default App;
