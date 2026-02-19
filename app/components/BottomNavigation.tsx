import { motion } from 'motion/react';
import { Home, Gift, User, Clock } from 'lucide-react';

type Tab = 'home' | 'claim' | 'epochs' | 'profile';

interface BottomNavigationProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const tabs = [
  { id: 'home' as Tab, label: 'Home', icon: Home },
  { id: 'claim' as Tab, label: 'Claim', icon: Gift },
  { id: 'epochs' as Tab, label: 'Epochs', icon: Clock },
  { id: 'profile' as Tab, label: 'Profile', icon: User },
];

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      <div className="mx-auto max-w-lg pointer-events-auto">
        <div className="backdrop-blur-xl bg-[#0f1028]/95 rounded-md px-6 py-4 safe-area-inset-bottom">
          <div className="flex items-center justify-around">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;

              return (
                <motion.button
                  key={tab.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onTabChange(tab.id)}
                  className="flex flex-col items-center gap-1.5 relative min-w-[60px] py-2 touch-manipulation"
                  style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
                >
                  <Icon
                    className={`w-6 h-6 transition-colors ${
                      isActive ? 'text-purple-400' : 'text-gray-500'
                    }`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span
                    className={`text-xs font-medium transition-colors ${
                      isActive ? 'text-purple-400' : 'text-gray-500'
                    }`}
                  >
                    {tab.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}