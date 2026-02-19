import { motion } from 'motion/react';
import { Clock, Calendar, Trophy, Star } from 'lucide-react';

export function EpochsTab() {
  // Mock data for epochs/seasons
  const currentEpoch = {
    number: 0,
    name: "Cosmic Dawn",
    startDate: "2024-01-15",
    endDate: "2024-04-15",
    progress: 0,
    rewards: "0 TOKENS",
    participants: "0"
  };

  const pastEpochs = [
    {
      number: 0,
      name: "Stellar Genesis",
      duration: "0 months",
      rewards: "0 TOKENS",
      participants: "0",
      status: "completed"
    },
    {
      number: 0,
      name: "Origin Protocol",
      duration: "0 months", 
      rewards: "0 TOKENS",
      participants: "0",
      status: "completed"
    }
  ];

  return (
    <div className="pb-1 px-5 pt-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-2xl font-bold text-white mb-2">Epochs</h1>
        <p className="text-gray-400 text-sm">
          Seasonal campaigns with exclusive rewards
        </p>
      </motion.div>

      {/* Current Epoch */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">
          CURRENT EPOCH
        </h2>
        <div className="p-6 backdrop-blur-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-white">
                Epoch {currentEpoch.number}: {currentEpoch.name}
              </h3>
              <p className="text-gray-300 text-sm mt-1">
                {new Date(currentEpoch.startDate).toLocaleDateString()} - {new Date(currentEpoch.endDate).toLocaleDateString()}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center">
              <Star className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-300">Progress</span>
              <span className="text-purple-400 font-semibold">{currentEpoch.progress}%</span>
            </div>
            <div className="w-full bg-gray-700/50 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${currentEpoch.progress}%` }}
                transition={{ delay: 0.5, duration: 1 }}
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-white/5 rounded-xl">
              <Trophy className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
              <div className="text-white font-semibold text-sm">{currentEpoch.rewards}</div>
              <div className="text-gray-400 text-xs">Total Rewards</div>
            </div>
            <div className="text-center p-3 bg-white/5 rounded-xl">
              <Clock className="w-5 h-5 text-blue-400 mx-auto mb-1" />
              <div className="text-white font-semibold text-sm">{currentEpoch.participants}</div>
              <div className="text-gray-400 text-xs">Participants</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Past Epochs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mb-6"
      >
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">
          PAST EPOCHS
        </h2>
        <div className="space-y-3">
          {pastEpochs.map((epoch, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="p-4 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">
                      Epoch {epoch.number}: {epoch.name}
                    </h4>
                    <p className="text-gray-400 text-xs">{epoch.duration}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-green-400 text-sm font-semibold">
                    {epoch.rewards}
                  </div>
                  <div className="text-gray-400 text-xs">
                    {epoch.participants} users
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Next Epoch Preview */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mb-6"
      >
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">
          COMING SOON
        </h2>
        <div className="p-4 backdrop-blur-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-400 flex items-center justify-center">
              <Star className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="text-white font-semibold">Epoch 0: Quantum Leap</h4>
              <p className="text-gray-300 text-sm">Starts April 16, 2024</p>
              <p className="text-orange-400 text-xs mt-1">Enhanced rewards & new features</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}