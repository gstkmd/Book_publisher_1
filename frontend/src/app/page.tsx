import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 selection:bg-indigo-500 selection:text-white">
      {/* Navigation / Header */}
      <nav className="fixed w-full z-50 top-0 start-0 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
        <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
          <span className="self-center text-2xl font-bold whitespace-nowrap bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            Connect Publisher
          </span>
          <div className="flex space-x-3 md:order-2 space-x-reverse">
            <Link href="/login" className="text-white bg-indigo-700 hover:bg-indigo-800 focus:ring-4 focus:outline-none focus:ring-indigo-300 font-medium rounded-lg text-sm px-4 py-2 text-center dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:focus:ring-indigo-800 transition-colors">
              Customer Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="py-8 px-4 mx-auto max-w-screen-xl text-center lg:py-16 lg:px-12 relative z-10">
          <Link href="#" className="inline-flex justify-between items-center py-1 px-1 pr-4 mb-7 text-sm text-gray-700 bg-gray-100 rounded-full dark:bg-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700" role="alert">
            <span className="text-xs bg-indigo-600 rounded-full text-white px-4 py-1.5 mr-3">New</span> <span className="text-sm font-medium">Educational AI Tools Released</span>
            <svg className="ml-2 w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path></svg>
          </Link>
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight leading-none text-gray-900 md:text-5xl lg:text-6xl dark:text-white">
            The Future of <span className="text-indigo-600 dark:text-indigo-500">Educational Publishing</span>
          </h1>
          <p className="mb-8 text-lg font-normal text-gray-500 lg:text-xl sm:px-16 xl:px-48 dark:text-gray-600">
            A powerful, modular platform designed for modern content creation, collaboration, and distribution. Built for publishers, educators, and innovators.
          </p>
          <div className="flex flex-col mb-8 lg:mb-16 space-y-4 sm:flex-row sm:justify-center sm:space-y-0 sm:space-x-4">
            <Link href="/signup" className="inline-flex justify-center items-center py-3 px-5 text-base font-medium text-center text-white rounded-lg bg-indigo-700 hover:bg-indigo-800 focus:ring-4 focus:ring-indigo-300 dark:focus:ring-indigo-900 transition-all shadow-lg hover:shadow-indigo-500/30">
              New User? Start Creating
              <svg className="ml-2 -mr-1 w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
            </Link>
            <Link href="/dashboard/help" className="inline-flex justify-center items-center py-3 px-5 text-base font-medium text-center text-gray-900 rounded-lg border border-gray-300 hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 dark:text-white dark:border-gray-700 dark:hover:bg-gray-700 dark:focus:ring-gray-800 transition-all">
              Explore FAQs & Benefits
            </Link>
          </div>
        </div>
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/10 rounded-full blur-3xl"></div>
        </div>
      </section>

      {/* Modules Section */}
      <section className="py-12 bg-gray-50 dark:bg-gray-800/50">
        <div className="py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-6">
          <div className="mx-auto max-w-screen-md text-center mb-8 lg:mb-12">
            <h2 className="mb-4 text-3xl tracking-tight font-extrabold text-gray-900 dark:text-white">Platform Modules</h2>
            <p className="mb-5 font-light text-gray-500 sm:text-xl dark:text-gray-600">Everything you need to manage the lifecycle of your educational content.</p>
          </div>
          <div className="grid gap-8 mb-6 lg:mb-16 md:grid-cols-2">
            {/* Generic Editor Card */}
            <Link href="/editor/doc-123" className="group relative block p-8 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="flex justify-center items-center mb-4 w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                  <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                </div>
                <h3 className="mb-2 text-xl font-bold dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Generic Editor</h3>
                <p className="font-light text-gray-500 dark:text-gray-600">Collaborative, real-time rich text editing powered by WebSockets. Experience seamless teamwork.</p>
                <div className="mt-4 flex items-center text-indigo-600 dark:text-indigo-400 font-medium text-sm group-hover:translate-x-2 transition-transform">
                  Open Editor <span className="ml-2">→</span>
                </div>
              </div>
            </Link>

            {/* Educational Tools Card */}
            <div className="relative block p-8 bg-white rounded-2xl border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700 opacity-75 grayscale cursor-not-allowed">
              <div className="absolute top-4 right-4 bg-gray-100 text-gray-500 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-gray-600 border border-gray-200 dark:border-gray-600">Coming Soon</div>
              <div className="flex justify-center items-center mb-4 w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900/30">
                <svg className="w-6 h-6 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
              </div>
              <h3 className="mb-2 text-xl font-bold dark:text-white">Educational Tools</h3>
              <p className="font-light text-gray-500 dark:text-gray-600">Advanced tools for lesson planning, standards alignment (CCSS/NGSS), and assessment generation.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Ecosystem Section */}
      <section className="py-20 bg-white dark:bg-slate-900">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4">Our Ecosystem</h2>
            <p className="text-slate-500 dark:text-slate-400">Discover our suite of integrated enterprise applications.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-indigo-50/50 border border-indigo-100 hover:shadow-lg transition-all text-center">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center mx-auto mb-4 font-bold">CS</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Compliance Sarthi</h3>
              <p className="text-sm text-slate-500">Intelligent document creation and regulatory compliance management.</p>
            </div>
            <div className="p-6 rounded-2xl bg-emerald-50/50 border border-emerald-100 hover:shadow-lg transition-all text-center">
              <div className="w-12 h-12 bg-emerald-600 text-white rounded-xl flex items-center justify-center mx-auto mb-4 font-bold">SM</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Stock Manager</h3>
              <p className="text-sm text-slate-500">Real-time inventory tracking and supply chain optimization.</p>
            </div>
            <div className="p-6 rounded-2xl bg-amber-50/50 border border-amber-100 hover:shadow-lg transition-all text-center">
              <div className="w-12 h-12 bg-amber-600 text-white rounded-xl flex items-center justify-center mx-auto mb-4 font-bold">AC</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">AccountCloud</h3>
              <p className="text-sm text-slate-500">Next-generation cloud ERP for comprehensive financial management.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="p-4 bg-white md:p-8 lg:p-10 dark:bg-slate-900 border-t border-gray-200 dark:border-gray-800">
        <div className="mx-auto max-w-screen-xl text-center">
          <span className="text-2xl font-semibold text-gray-900 dark:text-white">Connect Publisher</span>
          <p className="my-6 text-gray-500 dark:text-gray-600">Enterprise publishing infrastructure by Connect ERP.</p>
          <span className="text-sm text-gray-500 sm:text-center dark:text-gray-600">© 2024 <a href="#" className="hover:underline">Connect ERP Architecture™</a>. All Rights Reserved.</span>
        </div>
      </footer>
    </main>
  );
}
