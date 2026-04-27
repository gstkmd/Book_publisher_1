'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50 selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Navigation */}
      <nav className="fixed w-full z-50 top-0 start-0 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl">
        <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="w-8 h-8 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center text-white font-black shadow-lg shadow-indigo-500/20 group-hover:rotate-12 transition-transform duration-300">
              CP
            </div>
            <span className="self-center text-xl font-black whitespace-nowrap bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Connect Publisher
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors">
              Customer Login
            </Link>
            <Link href="/signup" className="text-white bg-indigo-600 hover:bg-indigo-700 font-bold rounded-xl text-xs px-6 py-2.5 text-center uppercase tracking-widest transition-all hover:shadow-xl hover:shadow-indigo-500/20 active:scale-95">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-40 z-10 w-full px-4 overflow-hidden">
        <div className="max-w-screen-xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Hero Content */}
          <div className="text-left animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-full mb-6">
              <span className="px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-full">New</span>
              <span className="text-[11px] font-bold text-indigo-900 dark:text-indigo-300">Educational AI Tools 2.0 Released</span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-black tracking-tighter leading-[1.1] mb-6 text-slate-900 dark:text-white">
              The Future of <br/>
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent animate-gradient-x">
                Publishing
              </span>
            </h1>
            
            <p className="text-lg lg:text-xl text-slate-500 dark:text-slate-400 mb-10 max-w-lg leading-relaxed">
              A powerful, modular platform for modern content creation. 
              Seamless collaboration for publishers, educators, and innovators worldwide.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/signup" className="inline-flex justify-center items-center py-4 px-8 text-sm font-black text-center text-white rounded-2xl bg-indigo-600 hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-500/40 hover:-translate-y-1 uppercase tracking-widest active:scale-95">
                New User? Start Creating
              </Link>
              <Link href="/dashboard/help" className="inline-flex justify-center items-center py-4 px-8 text-sm font-black text-center text-slate-900 dark:text-white rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all uppercase tracking-widest">
                Explore FAQs
              </Link>
            </div>
          </div>

          {/* Hero Image / Graphic */}
          <div className="relative group animate-float">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600/20 to-violet-600/20 blur-[60px] group-hover:blur-[80px] transition-all"></div>
            <div className="relative bg-white dark:bg-slate-900 p-2 rounded-[2rem] border border-slate-200/50 dark:border-slate-800/50 shadow-2xl overflow-hidden">
               <img src="/images/hero.png" alt="Connect Publisher Illustration" className="w-full h-auto rounded-3xl" />
               
               {/* Floating Stats / Tags */}
               <div className="absolute top-8 left-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur pb-2 pt-1 px-4 rounded-2xl border border-white/20 shadow-xl">
                  <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Live Users</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white leading-none mt-1">12,482</div>
               </div>
               
               <div className="absolute bottom-8 right-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur p-4 rounded-2xl border border-white/20 shadow-xl text-center">
                  <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Efficiency</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white leading-none mt-1">+85%</div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modules Grid */}
      <section className="py-24 relative z-10 bg-slate-50 dark:bg-slate-900/30">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-4 lg:text-4xl">Core Platform Modules</h2>
            <div className="w-20 h-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 mx-auto rounded-full"></div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Link href="/editor/doc-123" className="group relative p-1 rounded-[2rem] bg-gradient-to-br from-indigo-100 to-slate-100 dark:from-indigo-900/20 dark:to-slate-800/20 overflow-hidden transition-all hover:scale-[1.02]">
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[1.9rem] h-full transition-colors group-hover:bg-slate-50 dark:group-hover:bg-slate-800">
                <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center mb-6 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">Generic Editor</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-6">Real-time collaborative editing with granular version control. Built for high-stakes content creation.</p>
                <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest group-hover:gap-4 transition-all">
                  Open Workspace <span>→</span>
                </div>
              </div>
            </Link>

            <div className="relative p-1 rounded-[2rem] bg-slate-100 dark:bg-slate-800 opacity-60">
              <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-[1.9rem] h-full">
                <span className="absolute top-6 right-6 px-3 py-1 bg-slate-200 dark:bg-slate-800 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-500">Coming Soon</span>
                <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/50 rounded-2xl flex items-center justify-center mb-6 text-emerald-600 dark:text-emerald-400">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">Educational Tools</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">Integrated workflows for standards alignment, assessment bank management, and automatic curriculum mapping.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ecosystem Section */}
      <section className="py-24 bg-white dark:bg-slate-950">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-16">
            <div>
              <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-6">Our Unified <br/> <span className="text-indigo-600">Enterprise Ecosystem</span></h2>
              <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed mb-8">
                Connect Publisher is part of a broader suite designed to automate every facet of your business operations. 
                Experience a truly integrated workflow from accounting to stock management.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <div className="text-2xl font-black text-indigo-600 mb-1">20+</div>
                  <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Integrated Apps</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <div className="text-2xl font-black text-violet-600 mb-1">99.9%</div>
                  <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Cloud Uptime</div>
                </div>
              </div>
            </div>
            
            <div className="grid gap-4">
              <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-50 to-white dark:from-indigo-900/10 dark:to-slate-900 border border-indigo-100 dark:border-indigo-800 flex items-center gap-6 hover:shadow-xl transition-all group">
                <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg shadow-indigo-600/20 group-hover:rotate-6 transition-transform">CS</div>
                <div>
                  <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-1">Compliance Sarthi</h4>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest text-indigo-500">Document Creation & RA</p>
                </div>
              </div>
              
              <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-50 to-white dark:from-emerald-900/10 dark:to-slate-900 border border-emerald-100 dark:border-emerald-800 flex items-center gap-6 hover:shadow-xl transition-all group">
                <div className="w-16 h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg shadow-emerald-600/20 group-hover:rotate-6 transition-transform">SM</div>
                <div>
                  <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-1">Stock Manager</h4>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest text-emerald-500">Inventory & Supply Chain</p>
                </div>
              </div>
              
              <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-50 to-white dark:from-amber-900/10 dark:to-slate-900 border border-amber-100 dark:border-amber-800 flex items-center gap-6 hover:shadow-xl transition-all group">
                <div className="w-16 h-16 bg-amber-600 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg shadow-amber-600/20 group-hover:rotate-6 transition-transform">AC</div>
                <div>
                  <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-1">AccountCloud</h4>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest text-amber-500">Intelligent ERP & Accounting</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 relative z-10">
        <div className="max-w-screen-xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-xs">CP</div>
            <span className="text-2xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">Connect Publisher</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm mx-auto font-medium">
            Next-generation enterprise publishing infrastructure by Connect ERP. 
            Empowering global publishers with intelligent technology.
          </p>
          <div className="flex justify-center gap-8 mb-12">
            {['Twitter', 'LinkedIn', 'App Store', 'Documentation'].map(item => (
              <a key={item} href="#" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-indigo-600 transition-colors">{item}</a>
            ))}
          </div>
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 dark:text-slate-700">
            © 2024 Connect ERP Architecture™. All Rights Reserved.
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
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(1deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        @keyframes gradient-x {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 5s ease infinite;
        }
      `}</style>
    </main>
  );
}
