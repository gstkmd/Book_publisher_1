import React from 'react';
import { SecureImage } from './SecureImage';
import { useAuth } from '@/context/AuthContext';

interface Screenshot {
    id: string;
    agent_id: string;
    filename: string;
    timestamp: string;
    computer_name: string;
    is_private?: boolean;
}

interface ScreenshotGalleryProps {
    screenshots: Screenshot[];
    apiUrl: string;
    onScreenshotClick: (shot: Screenshot) => void;
}

export function ScreenshotGallery({ screenshots, apiUrl, onScreenshotClick }: ScreenshotGalleryProps) {
    const { user } = useAuth();
    const isSuperAdmin = user?.role === 'super_admin';

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Recent Screenshots</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {screenshots.map((shot) => {
                    const shouldBlur = shot.is_private && !isSuperAdmin;
                    
                    return (
                        <div 
                            key={shot.id} 
                            onClick={() => onScreenshotClick(shot)}
                            className="group relative rounded-lg overflow-hidden border border-gray-200 cursor-pointer"
                        >
                            <div className="relative">
                                <SecureImage
                                    src={`${apiUrl}/monitoring/dashboard/screenshot/${shot.id}`}
                                    alt={`Screenshot from ${shot.computer_name}`}
                                    className={`w-full h-48 object-cover transition-all group-hover:scale-105 ${shouldBlur ? 'blur-md grayscale' : ''}`}
                                />
                                {shouldBlur && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900/10 backdrop-blur-sm">
                                        <span className="bg-black/60 text-white px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5">
                                            🔒 Private Content
                                        </span>
                                    </div>
                                )}
                            </div>
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-end p-3">
                            <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-40 rounded p-1">
                                <p className="text-xs font-bold truncate">{shot.computer_name}</p>
                                <p className="text-[10px]">
                                    {(() => {
                                        try {
                                            let dateStr = shot.timestamp;
                                            if (dateStr && !dateStr.includes('Z')) {
                                                dateStr = dateStr.replace(' ', 'T') + 'Z';
                                            }
                                            const d = new Date(dateStr);
                                            // Add 5.5 hours to UTC time to get IST
                                            const istTime = new Date(d.getTime() + (5.5 * 60 * 60 * 1000));
                                            return istTime.toISOString().replace('T', ' ').substring(0, 19);
                                        } catch (e) {
                                            return shot.timestamp;
                                        }
                                    })()}
                                </p>
                            </div>
                        </div>
                        </div>
                    );
                })}
                {screenshots.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-lg">
                        No screenshots available.
                    </div>
                )}
            </div>
        </div>
    );
}
