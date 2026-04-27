import React, { useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface Screenshot {
    id: string;
    timestamp: string;
    computer_name: string;
    [key: string]: any;
}

interface ScreenshotPreviewProps {
    screenshot: Screenshot | null;
    screenshots: Screenshot[];
    onClose: () => void;
    onNavigate: (screenshot: Screenshot) => void;
    apiUrl: string;
}

export function ScreenshotPreview({ 
    screenshot, 
    screenshots, 
    onClose, 
    onNavigate,
    apiUrl 
}: ScreenshotPreviewProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!screenshot) return;
            
            if (e.key === 'ArrowRight') {
                handleNext();
            } else if (e.key === 'ArrowLeft') {
                handlePrevious();
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [screenshot]);

    if (!screenshot) return null;

    const currentIndex = screenshots.findIndex(s => s.id === screenshot.id);
    const hasNext = currentIndex < screenshots.length - 1;
    const hasPrevious = currentIndex > 0;

    const handleNext = () => {
        if (hasNext) {
            onNavigate(screenshots[currentIndex + 1]);
        }
    };

    const handlePrevious = () => {
        if (hasPrevious) {
            onNavigate(screenshots[currentIndex - 1]);
        }
    };

    const formatDateTimeIST = (dateString: string | null | undefined) => {
        if (!dateString) return '-';
        try {
            let dStr = dateString;
            if (!dStr.endsWith('Z') && !dStr.includes('+') && !dStr.match(/-\d{2}:\d{2}$/)) {
                dStr += 'Z';
            }
            const d = new Date(dStr);
            return new Intl.DateTimeFormat('en-IN', {
                timeZone: 'Asia/Kolkata',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            }).format(d);
        } catch {
            return '-';
        }
    };

    return (
        <Modal 
            isOpen={!!screenshot} 
            onClose={onClose}
            title={`Screenshot Preview - ${screenshot.computer_name}`}
        >
            <div className="relative group flex flex-col items-center w-full min-h-[400px] justify-center">
                {/* Navigation Buttons Overlay */}
                <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
                    {hasPrevious ? (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handlePrevious();
                            }}
                            className="p-3 bg-white/80 hover:bg-white text-gray-800 rounded-full shadow-lg transition-all transform hover:scale-110 pointer-events-auto group-hover:translate-x-0 -translate-x-12 opacity-0 group-hover:opacity-100 border border-gray-200"
                            aria-label="Previous screenshot"
                        >
                            <ChevronLeft size={24} />
                        </button>
                    ) : <div />}

                    {hasNext ? (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleNext();
                            }}
                            className="p-3 bg-white/80 hover:bg-white text-gray-800 rounded-full shadow-lg transition-all transform hover:scale-110 pointer-events-auto group-hover:translate-x-0 translate-x-12 opacity-0 group-hover:opacity-100 border border-gray-200"
                            aria-label="Next screenshot"
                        >
                            <ChevronRight size={24} />
                        </button>
                    ) : <div />}
                </div>

                {/* Counter Tag */}
                <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm z-10">
                    {currentIndex + 1} / {screenshots.length}
                </div>

                <div className="w-full flex flex-col items-center gap-6">
                    <div className="relative bg-white p-2 rounded-xl shadow-inner border border-gray-100">
                        <img 
                            src={`${apiUrl}/monitoring/dashboard/screenshot/${screenshot.id}`} 
                            alt="Full Size Screenshot"
                            className="max-w-full max-h-[70vh] object-contain rounded-lg transition-opacity duration-300"
                            onLoad={(e) => e.currentTarget.style.opacity = '1'}
                            style={{ opacity: 0 }}
                        />
                    </div>
                    
                    <div className="flex flex-col items-center gap-2">
                        <div className="text-sm font-bold text-gray-600 bg-white px-6 py-2.5 rounded-full border border-gray-200 shadow-sm flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Captured at: {formatDateTimeIST(screenshot.timestamp)}
                        </div>
                        <div className="text-xs text-gray-400 font-medium">
                            Use arrow keys to navigate
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
