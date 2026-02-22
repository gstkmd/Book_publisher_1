import { useState, useEffect, useRef } from 'react';

export const useCollaboration = (documentId: string) => {
    const [messages, setMessages] = useState<string[]>([]);
    const socketRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        // Connect to WebSocket using dynamic API URL
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
        const wsProtocol = apiUrl.startsWith('https') ? 'wss' : 'ws';
        const wsBase = apiUrl.replace('http://', '').replace('https://', '');
        const wsUrl = `${wsProtocol}://${wsBase}/generic/ws/${documentId}`;

        socketRef.current = new WebSocket(wsUrl);

        socketRef.current.onopen = () => {
            console.log('Connected to collaboration server');
        };

        socketRef.current.onmessage = (event) => {
            setMessages((prev) => [...prev, event.data]);
        };

        socketRef.current.onclose = () => {
            console.log('Disconnected from collaboration server');
        };

        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, [documentId]);

    const sendMessage = (message: string) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(message);
        }
    };

    return { messages, sendMessage };
};
