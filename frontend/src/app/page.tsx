'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-slate-900 selection:bg-indigo-600 selection:text-white overflow-x-hidden">
      
      {/* Soft Background Accents */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-indigo-50 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] bg-blue-50 rounded-full blur-[100px]"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed w-full z-50 top-0 start-0 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4 md:px-6">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-600/20 group-hover:bg-slate-900 transition-all">
              CP
            </div>
            <span className="self-center text-xl font-black whitespace-nowrap text-slate-900 tracking-tighter">
              Connect Publisher
            </span>
          </div>
          <div className="flex items-center gap-8">
            <Link href="/login" className="text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors">
              Customer Login
            </Link>
            <Link href="/signup" className="text-white bg-indigo-600 hover:bg-slate-900 font-black rounded-xl text-[11px] px-8 py-3 text-center uppercase tracking-widest transition-all active:scale-95 shadow-md">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-52 lg:pb-40 z-10 w-full px-4 md:px-6">
        <div className="max-w-screen-xl mx-auto flex flex-col lg:flex-row gap-16 items-center">
          
          {/* Hero Content */}
          <div className="flex-1 text-left animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 border border-slate-200 rounded-full mb-8">
              <span className="px-2 py-0.5 bg-indigo-600 text-white text-[9px] font-black uppercase rounded-full tracking-widest">Enterprise</span>
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Publishing Cloud 1.0</span>
            </div>
            
            <h1 className="text-6xl lg:text-7xl font-black tracking-tighter leading-[1.05] mb-8 text-slate-900">
              The Future of <br/>
              <span className="text-indigo-600">Publishing</span>
            </h1>
            
            <p className="text-xl text-slate-600 mb-10 max-w-lg leading-relaxed font-medium">
              Transform your content lifecycle with an integrated, intelligent platform. 
              Efficiency at scale for global enterprises.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/signup" className="inline-flex justify-center items-center py-4 px-10 text-[11px] font-black text-center text-white rounded-2xl bg-indigo-600 hover:bg-slate-900 transition-all shadow-xl shadow-indigo-600/20 hover:-translate-y-1 uppercase tracking-widest active:scale-95">
                Start Creating
              </Link>
              <Link href="/dashboard/help" className="inline-flex justify-center items-center py-4 px-10 text-[11px] font-black text-center text-slate-900 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all uppercase tracking-widest">
                Learn Benefits
              </Link>
            </div>
          </div>

          {/* Hero Image Container */}
          <div className="flex-1 relative">
            <div className="relative bg-white p-2 rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden animate-float">
               <img src="/images/hero.jpg" alt="Platform Insights" className="w-full h-auto rounded-[2.2rem]" />
               
               {/* Simplified Floating Overlay */}
               <div className="absolute bottom-8 right-8 bg-white/95 backdrop-blur p-4 rounded-2xl border border-slate-100 shadow-xl">
                  <div className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Live Efficiency</div>
                  <div className="text-2xl font-black text-slate-900 leading-none">+85.4%</div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Divider - High Visibility */}
      <div className="bg-slate-50 border-y border-slate-200 py-10">
        <div className="max-w-screen-xl mx-auto px-4 md:px-6 flex flex-wrap justify-between gap-8">
          {['50M+ Pages Published', '10K+ Authors Enabled', '2k+ Hubs Connected', '500+ Enterprise Clients'].map((stat, i) => (
            <div key={i} className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{stat}</div>
          ))}
        </div>
      </div>

      {/* Modules Section */}
      <section className="py-24 bg-white z-10">
        <div className="max-w-screen-xl mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 uppercase tracking-tighter mb-4">Core Workspace Modules</h2>
            <div className="w-16 h-1 bg-indigo-600 mx-auto rounded-full"></div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-10">
            <Link href="/editor/doc-123" className="group p-8 rounded-[2rem] bg-slate-50 border border-slate-100 hover:border-indigo-600 transition-all duration-300">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-indigo-600 mb-6 border border-slate-200 shadow-sm group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-tight">Generic Editor</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Collaborative writing with real-time synchronization and enterprise version control.</p>
            </Link>

            <div className="p-8 rounded-[2rem] bg-white border border-slate-100 opacity-60">
              <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 mb-6">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-tight">Audit Engine</h3>
              <p className="text-slate-600 text-sm">Automated compliance and manuscript verification for quality assurance.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Ecosystem Section */}
      <section className="py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-screen-xl mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-4">Integrated Ecosystem</h2>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Part of the Connect ERP Suite</p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {[
              { id: 'CS', title: 'Compliance Sarthi', desc: 'Secure Document Orchestration' },
              { id: 'SM', title: 'Stock Manager', desc: 'Smarter Logistical Operations' },
              { id: 'AC', title: 'AccountCloud', desc: 'Intelligent Enterprise ERP' }
            ].map((app, i) => (
              <div key={i} className="p-10 rounded-[2.5rem] bg-white border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center">
                <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-xl mb-6 mx-auto shadow-lg shadow-indigo-600/20">{app.id}</div>
                <h4 className="text-lg font-black text-slate-900 uppercase tracking-tighter mb-2">{app.title}</h4>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{app.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-screen-xl mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-10 mb-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-[10px]">CP</div>
              <span className="text-xl font-black uppercase tracking-tighter text-slate-900">Connect Publisher</span>
            </div>
            <div className="flex gap-8">
              {['About', 'Security', 'FAQ', 'Contact'].map(link => (
                <a key={link} href="#" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">{link}</a>
              ))}
            </div>
          </div>
          <div className="text-center pt-10 border-t border-slate-100">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300">© 2024 Connect ERP Architecture. All Rights Reserved.</p>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </main>
  );
}
