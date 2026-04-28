'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface SecureImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
}

export function SecureImage({ src, ...props }: SecureImageProps) {
    const { token } = useAuth();
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const fetchImage = async () => {
            if (!token || !src) return;
            
            try {
                const response = await fetch(src, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (!response.ok) throw new Error('Failed to fetch image');
                
                const blob = await response.blob();
                const objectUrl = URL.createObjectURL(blob);
                
                if (isMounted) {
                    setImageSrc(objectUrl);
                    setIsLoading(false);
                }
            } catch (err) {
                console.error('Error fetching secure image:', err);
                if (isMounted) {
                    setError(true);
                    setIsLoading(false);
                }
            }
        };

        fetchImage();

        return () => {
            isMounted = false;
            if (imageSrc) {
                URL.revokeObjectURL(imageSrc);
            }
        };
    }, [src, token]);

    if (isLoading) {
        return <div className={`animate-pulse bg-gray-200 ${props.className}`} style={{ minHeight: '100px' }} />;
    }

    if (error || !imageSrc) {
        return <div className={`flex items-center justify-center bg-gray-100 text-gray-400 text-xs ${props.className}`}>Failed to load image</div>;
    }

    return <img src={imageSrc} {...props} />;
}
