import { motion } from 'motion/react';
import { CheckCircle, User, Camera, Upload } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface UserHeaderProps {
  username: string;
  address?: string;
  verified: boolean;
}

export function UserHeader({ username, address, verified }: UserHeaderProps) {
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved photo from localStorage on component mount
  useEffect(() => {
    const savedPhoto = localStorage.getItem('desocial_profile_photo');
    if (savedPhoto) {
      setProfilePhoto(savedPhoto);
    }
  }, []);

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setProfilePhoto(result);
        localStorage.setItem('desocial_profile_photo', result);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center mb-6"
    >
      {/* Profile Photo Section */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.2 }}
        className="relative mb-4"
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={triggerFileInput}
          className="relative w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center shadow-lg shadow-purple-500/50 cursor-pointer group overflow-hidden"
        >
          {profilePhoto ? (
            <img
              src={profilePhoto}
              alt="Profile"
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <User className="w-12 h-12 text-white" />
          )}
          
          {/* Upload Overlay */}
          <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            {isUploading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Upload className="w-6 h-6 text-white" />
              </motion.div>
            ) : (
              <Camera className="w-6 h-6 text-white" />
            )}
          </div>
          
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/50 to-blue-500/50 blur-xl" />
        </motion.div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoUpload}
          className="hidden"
        />

        {/* Upload hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-purple-500/20 backdrop-blur-xl border border-purple-500/30 rounded-full px-2 py-1"
        >
          <Camera className="w-3 h-3 text-purple-400" />
        </motion.div>
      </motion.div>

      {/* Username */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-xl font-bold text-white mb-1"
      >
        {username.startsWith('@') ? username : `@${username}`}
      </motion.h1>

      {/* Address */}
      {address && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-1.5 text-sm text-gray-300 mb-3"
        >
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span>{address}</span>
        </motion.div>
      )}

      {/* Verification Badge */}
      {verified && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
          className="flex items-center gap-1.5 px-3 py-1.5 backdrop-blur-xl bg-green-500/20 rounded-lg border border-green-500/30"
        >
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span className="text-green-400 text-sm font-medium">Status Verified</span>
        </motion.div>
      )}
    </motion.div>
  );
}