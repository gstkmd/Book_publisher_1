'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      
      {/* Mesh Gradient Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-teal-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '3s' }}></div>
      </div>

      {/* Navigation */}
      <nav className="fixed w-full z-50 top-0 start-0 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 via-indigo-500 to-teal-500 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-all">
              CP
            </div>
            <span className="self-center text-xl font-black whitespace-nowrap bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 dark:from-white dark:to-slate-400 bg-clip-text text-transparent tracking-tighter">
              Connect Publisher
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-indigo-600 transition-colors">
              Customer Login
            </Link>
            <Link href="/signup" className="text-white bg-indigo-600 hover:bg-slate-900 dark:hover:bg-white dark:hover:text-slate-900 font-black rounded-xl text-[10px] px-8 py-3 text-center uppercase tracking-[0.2em] transition-all hover:shadow-2xl active:scale-95">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 lg:pt-56 lg:pb-48 z-10 w-full px-4 overflow-hidden">
        <div className="max-w-screen-xl mx-auto flex flex-col lg:flex-row gap-16 items-center">
          
          {/* Hero Content */}
          <div className="flex-1 text-left animate-fade-in-up">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full mb-8 shadow-sm">
              <span className="px-2 py-0.5 bg-indigo-600 text-white text-[9px] font-black uppercase rounded-full tracking-widest leading-none">Enterprise</span>
              <span className="text-[10px] font-black text-slate-900 dark:text-slate-300 uppercase tracking-widest">Intelligent Publishing 1.0</span>
            </div>
            
            <h1 className="text-6xl lg:text-8xl font-black tracking-tighter leading-[0.95] mb-8 text-slate-900 dark:text-white">
              The Future of <br/>
              <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-teal-500 bg-clip-text text-transparent animate-gradient-x">
                Publishing
              </span>
            </h1>
            
            <p className="text-xl text-slate-500 dark:text-slate-400 mb-12 max-w-xl leading-relaxed font-medium">
              A comprehensive, AI-driven platform for modern content lifecycle management. 
              Built for high-performance publishing enterprises.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-5">
              <Link href="/signup" className="inline-flex justify-center items-center py-5 px-10 text-[11px] font-black text-center text-white rounded-2xl bg-indigo-600 hover:bg-slate-900 dark:hover:bg-white dark:hover:text-indigo-600 transition-all shadow-2xl shadow-indigo-500/30 hover:-translate-y-1 uppercase tracking-[0.2em] active:scale-95">
                New User? Start Creating
              </Link>
              <Link href="/dashboard/help" className="inline-flex justify-center items-center py-5 px-10 text-[11px] font-black text-center text-slate-900 dark:text-white rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all uppercase tracking-[0.2em]">
                Explore Benefits
              </Link>
            </div>
          </div>

          {/* Hero Image Group */}
          <div className="flex-1 relative animate-float">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/30 via-teal-500/20 to-transparent blur-[80px] -z-10"></div>
            <div className="relative bg-white dark:bg-slate-900 p-3 rounded-[3rem] border border-slate-200/50 dark:border-slate-800/50 shadow-3xl overflow-hidden group">
               <img src="/images/hero.jpg" alt="Connect Publisher Platform" className="w-full h-auto rounded-[2.5rem] group-hover:scale-105 transition-transform duration-700" />
               <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent pointer-events-none"></div>
               
               {/* Professional Floating Overlays */}
               <div className="absolute top-10 left-10 bg-white/90 dark:bg-slate-950/90 backdrop-blur p-5 rounded-3xl border border-white/20 shadow-2xl animate-fade-in-up delay-300">
                  <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Global Coverage</div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white leading-none tracking-tighter">140+ Countries</div>
               </div>
               
               <div className="absolute bottom-10 right-10 bg-white/90 dark:bg-slate-950/90 backdrop-blur p-5 rounded-3xl border border-white/20 shadow-2xl animate-fade-in-up delay-500">
                  <div className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-1">Uptime</div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white leading-none tracking-tighter">99.9%</div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Divider */}
      <div className="max-w-screen-xl mx-auto px-4 py-12 border-y border-slate-200 dark:border-slate-800 flex flex-wrap justify-between gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
        {['50M+ Pages Published', '10K+ Global Authors', '2k+ Learning Centers', '500+ Organizations'].map((stat, i) => (
          <div key={i} className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-slate-500">{stat}</div>
        ))}
      </div>

      {/* Modules Section */}
      <section className="py-32 bg-white dark:bg-slate-950 relative z-10">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="max-w-xl mb-24">
            <h2 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-6 leading-tight">Modular Control <br/>for Enterprise.</h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg">Integrated tools that scale with your team's complexity.</p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12">
            <Link href="/editor/doc-123" className="group p-10 rounded-[3rem] bg-slate-50 dark:bg-slate-900 hover:bg-indigo-600 transition-all duration-500">
              <div className="w-16 h-16 bg-white dark:bg-slate-950 rounded-2xl flex items-center justify-center text-indigo-600 mb-8 border border-slate-200 dark:border-slate-800 shadow-xl group-hover:rotate-6 transition-transform">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 group-hover:text-white transition-colors uppercase tracking-tight">Generic Editor</h3>
              <p className="text-slate-500 dark:text-slate-400 group-hover:text-white/80 transition-colors leading-relaxed">High-fidelity collaborative editing with real-time sync and nested version branches.</p>
            </Link>

            <div className="p-10 rounded-[3rem] bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 opacity-40">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-950 rounded-2xl flex items-center justify-center text-slate-400 mb-8">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tight">Audit Insights</h3>
              <p className="text-slate-500 dark:text-slate-400">Next-gen analytics engine for manuscript auditing and compliance checking.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Ecosystem Section */}
      <section className="py-32 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="text-center mb-24">
            <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-4">The Connect ERP Suite</h2>
            <p className="text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px] font-black">Fully Integrated Architecture</p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {[
              { id: 'CS', title: 'Compliance Sarthi', desc: 'Secure Document Orchestration', bg: 'from-indigo-600/10' },
              { id: 'SM', title: 'Stock Manager', desc: 'Smarter Logistical Operations', bg: 'from-teal-600/10' },
              { id: 'AC', title: 'AccountCloud', desc: 'Hyper-Scale Financial ERP', bg: 'from-fuchsia-600/10' }
            ].map((app, i) => (
              <div key={i} className={`p-10 rounded-[3rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:shadow-3xl hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${app.bg} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                <div className="w-16 h-16 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-3xl flex items-center justify-center font-black text-xl mb-8 shadow-xl relative z-10">{app.id}</div>
                <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2 relative z-10">{app.title}</h4>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest relative z-10">{app.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Professional Footer */}
      <footer className="py-32 bg-slate-950 text-white relative z-10">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="flex flex-col lg:flex-row justify-between gap-16 items-start mb-24">
            <div className="max-w-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xs">CP</div>
                <span className="text-2xl font-black uppercase tracking-tighter">Connect Publisher</span>
              </div>
              <p className="text-slate-500 font-medium leading-relaxed mb-10">
                Pioneering high-density enterprise publishing solutions for the age of intelligence.
              </p>
              <div className="flex gap-6">
                {['Twitter', 'LinkedIn', 'App Store'].map(link => (
                  <a key={link} href="#" className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 hover:text-white transition-colors">{link}</a>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-16">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 mb-8">Platform</div>
                <ul className="space-y-4 text-xs font-bold text-slate-400">
                  <li className="hover:text-white cursor-pointer transition-colors">Core Infrastructure</li>
                  <li className="hover:text-white cursor-pointer transition-colors">Editor Suite</li>
                  <li className="hover:text-white cursor-pointer transition-colors">Audit Engine</li>
                </ul>
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 mb-8">Company</div>
                <ul className="space-y-4 text-xs font-bold text-slate-400">
                  <li className="hover:text-white cursor-pointer transition-colors">About Us</li>
                  <li className="hover:text-white cursor-pointer transition-colors">Enterprise Support</li>
                  <li className="hover:text-white cursor-pointer transition-colors">Security</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="pt-16 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-700">© 2024 Connect ERP Architecture. Enterprise Grade.</div>
            <div className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-700">Protected by 128-bit Encryption</div>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(1deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        @keyframes gradient-x {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 6s ease-in-out infinite;
        }
      `}</style>
    </main>
  );
}
