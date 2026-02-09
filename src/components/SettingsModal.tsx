import React, { useState } from 'react';
import { X, User, LogOut, Settings, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from './AuthModal';
import { EditProfileModal } from './EditProfileModal';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const { user, logout } = useAuth();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);

    if (!isOpen) return null;

    return (
                            )
}
                        </button >

    {/* Sign In / Out */ }
{
    user ? (
        <button
            onClick={() => {
                if (confirm('Log out?')) {
                    logout();
                    onClose();
                }
            }}
            className="w-full flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-xl hover:bg-red-50 hover:border-red-100 hover:text-red-600 transition-colors text-gray-700"
        >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
        </button>
    ) : (
        <button
            onClick={() => {
                login();
                onClose();
            }}
            className="w-full flex items-center gap-3 p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-md"
        >
            <Shield className="w-5 h-5" />
            <span className="font-bold">Sign In with Google</span>
        </button>
    )
}
                    </div >

    {/* Info Footer */ }
    < div className = "text-center pt-4 border-t border-gray-100" >
        <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
            <Info className="w-3 h-3" />
            TimeLog v{version}
        </p>
                    </div >
                </div >
            </div >
        </div >
    );
};
