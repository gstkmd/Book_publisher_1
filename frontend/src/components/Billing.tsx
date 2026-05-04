'use client';
import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Check, Zap, Shield, Crown, CreditCard, Clock } from 'lucide-react';

export const Billing = () => {
    const { token } = useAuth();
    const [org, setOrg] = useState<any>(null);

    useEffect(() => {
        if (token) fetchOrg();
    }, [token]);

    const fetchOrg = async () => {
        try {
            const data = await api.get('/organizations/me', token!);
            setOrg(data);
        } catch (err) { console.error(err); }
    };

    if (!org) return null;

    const plans = [
        {
            id: 'basic_10k',
            name: 'Basic Plan',
            price: '₹10,000',
            description: 'Essential features for growing publishing teams.',
            features: [
                'Up to 10 Team Members',
                'Manuscript Editor',
                'Task Management',
                'Standard Library Access',
                '30-Day Data Retention',
                'Email Support'
            ],
            color: 'blue',
            icon: Zap
        },
        {
            id: 'pro_18k',
            name: 'Growth Plan',
            price: '₹18,000',
            description: 'Expanded capacity for established publishing houses.',
            features: [
                'Up to 20 Team Members',
                'Everything in Basic',
                'Workflow Automation',
                '90-Day Data Retention',
                'Priority Support',
                'Custom Fields'
            ],
            color: 'indigo',
            icon: Crown,
            popular: true
        },
        {
            id: 'enterprise',
            name: 'Enterprise',
            price: 'Custom',
            description: 'Scale without limits with custom infrastructure.',
            features: [
                'Unlimited Team Members (> 20)',
                'Everything in Growth',
                'Custom Retention Policies',
                'Dedicated Support Team',
                'White-label Solution',
                'Advanced Security & SSO'
            ],
            color: 'emerald',
            icon: Shield
        }
    ];

    const isTrial = org.plan === 'trial' || org.subscription_status === 'trialing';
    const trialDaysLeft = org.trial_ends_at 
        ? Math.max(0, Math.ceil((new Date(org.trial_ends_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
        : 10;

    if (org.plan === 'custom') {
        plans.push({
            id: 'custom',
            name: org.plan_display_name || 'Custom Plan',
            price: org.plan_price_display || 'Contact Sales',
            description: 'Your tailored enterprise arrangement.',
            features: [
                `Up to ${org.max_users} Team Members`,
                'Full Platform Access',
                'Custom Retention Policies',
                'Dedicated Support',
                'Personalized Workflow'
            ],
            color: 'purple',
            icon: Shield,
            popular: true
        });
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Trial Banner */}
            {isTrial && (
                <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-6 rounded-[2rem] shadow-xl shadow-orange-100 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 text-white">
                        <div className="p-3 bg-white/20 rounded-2xl">
                            <Clock className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tight">Free Trial Active</h3>
                            <p className="font-bold opacity-90">You have <span className="bg-white text-orange-600 px-2 py-0.5 rounded-lg mx-1">{trialDaysLeft} days</span> left in your trial.</p>
                        </div>
                    </div>
                    <button className="bg-white text-orange-600 px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-orange-50 transition-all shadow-lg active:scale-95">
                        Choose a Plan Now
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                            <CreditCard className="w-6 h-6" />
                        </div>
                        Subscription & Billing
                    </h2>
                    <p className="text-slate-500 font-medium mt-1">Manage your organization's plan and billing cycle.</p>
                </div>
                {!isTrial && (
                    <div className="flex items-center gap-3 px-6 py-3 bg-indigo-50 rounded-2xl border border-indigo-100">
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Active Plan</span>
                        <span className="text-lg font-black text-indigo-600 uppercase tracking-tight">
                            {plans.find(p => p.id === org.plan)?.name || org.plan}
                        </span>
                    </div>
                )}
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {plans.map((plan) => (
                    <div 
                        key={plan.id}
                        className={`relative bg-white rounded-[2.5rem] p-8 shadow-xl transition-all duration-300 hover:scale-[1.02] border-2 
                            ${plan.id === org.plan ? `border-${plan.color}-500 shadow-${plan.color}-100` : 'border-transparent shadow-slate-100 hover:shadow-indigo-100'}
                        `}
                    >
                        {plan.popular && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                                Recommended
                            </div>
                        )}

                        <div className="space-y-6">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-${plan.color}-50 text-${plan.color}-600`}>
                                <plan.icon className="w-8 h-8" />
                            </div>

                            <div>
                                <h3 className="text-xl font-black text-slate-900">{plan.name}</h3>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-3xl font-black text-slate-900">{plan.price}</span>
                                    {plan.id !== 'enterprise' && <span className="text-slate-400 font-bold">/month</span>}
                                </div>
                            </div>

                            <p className="text-slate-500 text-sm font-medium leading-relaxed">
                                {plan.description}
                            </p>

                            <div className="space-y-3 pt-4">
                                {plan.features.map((feature, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <div className={`mt-0.5 p-0.5 rounded-full bg-${plan.color}-100 text-${plan.color}-600`}>
                                            <Check className="w-3 h-3" />
                                        </div>
                                        <span className="text-xs font-bold text-slate-600">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <button 
                                disabled={plan.id === org.plan}
                                className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg
                                    ${plan.id === org.plan 
                                        ? `bg-${plan.color}-50 text-${plan.color}-400 cursor-default shadow-none` 
                                        : `bg-slate-900 text-white hover:bg-${plan.color}-600 shadow-${plan.color}-100 active:scale-95`}
                                `}
                            >
                                {plan.id === org.plan ? 'Current Plan' : plan.id === 'enterprise' ? 'Contact Sales' : 'Upgrade to ' + plan.name}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer Note */}
            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-center space-y-4">
                <p className="text-slate-400 font-bold text-sm">
                    Secure payments powered by Stripe. All transactions are encrypted.
                </p>
                <div className="flex justify-center gap-8 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500">
                    <div className="text-white font-black italic tracking-tighter text-xl">STRIPE</div>
                    <div className="text-white font-black italic tracking-tighter text-xl">VISA</div>
                    <div className="text-white font-black italic tracking-tighter text-xl">MASTERCARD</div>
                </div>
            </div>
        </div>
    );
};
