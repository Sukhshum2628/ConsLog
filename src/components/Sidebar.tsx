import React, { useState } from 'react';
import { useSites, type Site } from '../hooks/useSites';
import { Plus, X, Building2, MapPin, ChevronRight, Trash2, Home } from 'lucide-react';
import { AddSiteModal } from './AddSiteModal';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectSite: (site: Site) => void;
    activeSiteId?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onSelectSite, activeSiteId }) => {
    const { sites, deleteSite } = useSites();
    const [showAddModal, setShowAddModal] = useState(false);

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 animate-in fade-in duration-300"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div className={`
                fixed top-0 bottom-0 left-0 w-80 bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-out flex flex-col
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Projects</h2>
                        <p className="text-xs text-gray-500">Manage your construction sites</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {sites.length === 0 ? (
                        <div className="text-center p-8 border-2 border-dashed border-gray-200 rounded-xl">
                            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                            <p className="text-gray-400 text-sm">No sites found.</p>
                        </div>
                    ) : (
                        sites.map(site => {
                            const isActive = site.id === activeSiteId;
                            return (
                                <div
                                    key={site.id}
                                    className={`
                                        group relative p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between
                                        ${isActive
                                            ? 'bg-blue-50 border-blue-200 inset-ring inset-ring-blue-100'
                                            : 'bg-white border-gray-100 hover:border-blue-100 hover:shadow-md'
                                        }
                                    `}
                                    onClick={() => {
                                        onSelectSite(site);
                                        onClose();
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`
                                            w-10 h-10 rounded-lg flex items-center justify-center
                                            ${isActive ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600'}
                                        `}>
                                            {site.isDefault ? <Home size={20} /> : <Building2 size={20} />}
                                        </div>
                                        <div>
                                            <h3 className={`font-bold ${isActive ? 'text-blue-900' : 'text-gray-700'}`}>{site.name}</h3>
                                            {site.location && (
                                                <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                                                    <MapPin size={10} />
                                                    <span className="truncate max-w-[120px]">{site.location}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {isActive && <ChevronRight size={16} className="text-blue-400" />}

                                    {/* Delete Button (Only for non-active, non-default sites?) Or allow active delete? */}
                                    {/* Let's allow delete but stopPropagation */}
                                    {!site.isDefault && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteSite(site.id);
                                            }}
                                            className="absolute right-2 top-2 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                            title="Delete Site"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-gray-200"
                    >
                        <Plus size={18} />
                        Add New Site
                    </button>
                </div>
            </div>

            {showAddModal && <AddSiteModal onClose={() => setShowAddModal(false)} />}
        </>
    );
};
