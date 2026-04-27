'use client';

import { useState, useMemo } from 'react';
import { faqData, FAQItem } from './faqData';

export default function HelpPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    const categories = ['Tasks', 'Library', 'Workflow'];

    const filteredFAQs = useMemo(() => {
        return faqData.filter(faq => {
            const matchesSearch = 
                faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                faq.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
            
            const matchesCategory = activeCategory ? faq.category === activeCategory : true;
            
            return matchesSearch && matchesCategory;
        });
    }, [searchQuery, activeCategory]);

    const toggleExpand = (index: number) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header section */}
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                    How can we <span className="text-indigo-600">help</span> you?
                </h1>
                <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                    Search our knowledge base for quick answers about tasks, content management, and publishing workflows.
                </p>
            </div>

            {/* Search Bar */}
            <div className="relative group max-w-2xl mx-auto">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-400 group-focus-within:text-indigo-500 transition-colors">🔍</span>
                </div>
                <input
                    type="text"
                    placeholder="Search keywords (e.g. 'task creation', 'publishing')..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all text-gray-900 placeholder-gray-400"
                />
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                    onClick={() => setActiveCategory(null)}
                    className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                        activeCategory === null
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                            : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300'
                    }`}
                >
                    All Topics
                </button>
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                            activeCategory === cat
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* FAQ List */}
            <div className="space-y-4 mt-12">
                {filteredFAQs.length > 0 ? (
                    filteredFAQs.map((faq, idx) => (
                        <div 
                            key={idx}
                            className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${
                                expandedIndex === idx 
                                    ? 'border-indigo-200 shadow-xl shadow-indigo-50 ring-1 ring-indigo-50' 
                                    : 'border-gray-100 hover:border-gray-200 shadow-sm'
                            }`}
                        >
                            <button
                                onClick={() => toggleExpand(idx)}
                                className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 focus:outline-none"
                            >
                                <div className="flex items-center gap-4">
                                    <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                                        faq.category === 'Tasks' ? 'bg-blue-50 text-blue-600' :
                                        faq.category === 'Library' ? 'bg-green-50 text-green-600' :
                                        'bg-purple-50 text-purple-600'
                                    }`}>
                                        {faq.category[0]}
                                    </span>
                                    <span className="font-bold text-gray-900 leading-tight">
                                        {faq.question}
                                    </span>
                                </div>
                                <span className={`text-gray-400 transition-transform duration-300 ${expandedIndex === idx ? 'rotate-180' : ''}`}>
                                    ▼
                                </span>
                            </button>
                            
                            <div 
                                className={`transition-all duration-300 ease-in-out ${
                                    expandedIndex === idx ? 'max-h-[500px] opacity-100 py-6' : 'max-h-0 opacity-0 overflow-hidden'
                                }`}
                            >
                                <div className="px-6 pb-2 text-gray-600 leading-relaxed border-t border-gray-50 pt-6 mx-6">
                                    {faq.answer}
                                </div>
                                <div className="px-6 flex flex-wrap gap-2 mt-4 mx-6">
                                    {faq.tags.map(tag => (
                                        <span key={tag} className="text-[10px] uppercase tracking-wider font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-20 text-center">
                        <div className="text-4xl mb-4 text-gray-300">🔎</div>
                        <h3 className="text-lg font-bold text-gray-900">No results found</h3>
                        <p className="text-gray-500">Try searching with different keywords like "creation" or "review".</p>
                    </div>
                )}
            </div>

            {/* Support section */}
            <div className="mt-16 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-10 text-center text-white shadow-2xl shadow-indigo-200">
                <h2 className="text-2xl font-bold mb-2">Still need help?</h2>
                <p className="text-indigo-100 mb-8 opacity-90">Our support team is available to assist you with more complex queries.</p>
                <div className="flex flex-wrap justify-center gap-4">
                    <button className="px-8 py-3 bg-white text-indigo-600 rounded-xl font-bold hover:bg-opacity-90 transition-all shadow-lg active:scale-95">
                        Chat with Support
                    </button>
                    <button className="px-8 py-3 bg-indigo-500 bg-opacity-30 border border-white border-opacity-30 text-white rounded-xl font-bold hover:bg-opacity-40 transition-all active:scale-95">
                        Email Us
                    </button>
                </div>
            </div>
        </div>
    );
}
