import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans selection:bg-cyan-200 selection:text-cyan-900 overflow-x-hidden">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex justify-between items-center shadow-xs">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md group-hover:rotate-6 transition-transform duration-300">
            <LogoIcon className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">OfficePM</h1>
        </div>
        <div className="flex gap-4 items-center">
          <Link href="/login" className="px-4 py-2 font-semibold text-gray-600 hover:text-cyan-600 transition-colors duration-200">
            Log In
          </Link>
          <Link href="/register" className="px-5 py-2.5 rounded-xl bg-gray-900 text-white font-bold shadow-md hover:bg-gray-800 hover:-translate-y-0.5 transition-all duration-300">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section - Split Layout */}
      <section className="pt-32 pb-20 px-6 lg:px-12 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Left: Text Content */}
          <div className="max-w-2xl">
            <h1 className="text-5xl lg:text-7xl font-black text-gray-900 leading-[1.1] mb-8 tracking-tight">
              Manage Work.<br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-500 to-blue-600">
                Track Progress.
              </span><br />
              Stay Happy.
            </h1>
            <p className="text-xl text-gray-500 mb-10 leading-relaxed max-w-lg">
              The all-in-one workspace for teams who want to get things done without the clutter. Simple, powerful, and cheerful.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register" className="px-8 py-4 rounded-2xl bg-linear-to-r from-cyan-500 to-blue-600 text-white text-lg font-bold shadow-lg hover:shadow-cyan-500/30 hover:-translate-y-1 transition-all duration-300 text-center">
                Start for Free
              </Link>
              <Link href="/login" className="px-8 py-4 rounded-2xl bg-white text-gray-700 border border-gray-200 text-lg font-bold hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700 transition-all duration-300 text-center shadow-sm">
                Live Demo
              </Link>
            </div>
          </div>

          {/* Right: 3D Floating UI Preview */}
          <div className="relative group perspective-1000 hidden lg:block">
            {/* Abstract Decorative blobs behind */}
            <div className="absolute -top-20 -right-20 w-[500px] h-[500px] bg-linear-to-br from-cyan-100 to-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse"></div>

            {/* Main Floating Card */}
            <div className="relative z-10 bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 transform rotate-y-6 rotate-x-6 group-hover:rotate-y-2 group-hover:rotate-x-2 transition-transform duration-500 ease-out">
              {/* Mockup Header */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="h-2 w-20 bg-gray-100 rounded-full"></div>
              </div>

              {/* Mockup Content: Project Progress */}
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <div className="flex justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-blue-100 text-blue-600 rounded-lg"><TaskIcon className="w-4 h-4" /></span>
                      <span className="font-bold text-gray-700 text-sm">Website Redesign</span>
                    </div>
                    <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">Active</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div className="bg-blue-500 h-2 rounded-full w-3/4"></div>
                  </div>
                  <div className="flex -space-x-2 overflow-hidden">
                    <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-purple-200"></div>
                    <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-yellow-200"></div>
                    <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-pink-200"></div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 opacity-80">
                  <div className="flex justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-purple-100 text-purple-600 rounded-lg"><PlanIcon className="w-4 h-4" /></span>
                      <span className="font-bold text-gray-700 text-sm">Q1 Marketing Plan</span>
                    </div>
                    <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded-full">Planning</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div className="bg-purple-500 h-2 rounded-full w-1/4"></div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 opacity-60">
                  <div className="flex justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-yellow-100 text-yellow-600 rounded-lg"><WorkerIcon className="w-4 h-4" /></span>
                      <span className="font-bold text-gray-700 text-sm">Hiring Process</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Badge 1 */}
            <div className="absolute -left-12 top-1/3 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 transform -rotate-6 z-20 animate-bounce delay-700">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg text-green-600">
                  <CheckIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase">Status</p>
                  <p className="font-bold text-gray-800">Completed</p>
                </div>
              </div>
            </div>

            {/* Floating Badge 2 */}
            <div className="absolute -right-8 bottom-10 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 transform rotate-3 z-20 animate-bounce">
              <div className="flex items-center gap-3">
                <div className="bg-pink-100 p-2 rounded-lg text-pink-600">
                  <CollabIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase">Team</p>
                  <p className="font-bold text-gray-800">Collaborating</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid Features Section */}
      <section className="py-24 px-6 lg:px-12 max-w-7xl mx-auto">
        <div className="mb-16">
          <h2 className="text-4xl font-black text-gray-900 mb-6">Everything you need.<br />Nothing you don't.</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">

          {/* Feature 1: Task Management (Large) */}
          <div className="md:col-span-2 rounded-3xl bg-blue-50 p-10 relative overflow-hidden group hover:shadow-lg transition-shadow duration-300">
            <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition-opacity duration-300 transform group-hover:scale-110">
              <TaskIcon className="w-64 h-64 text-blue-600" />
            </div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-6">
                <TaskIcon className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-3xl font-bold text-blue-900 mb-2">Task Management</h3>
                <p className="text-blue-700/80 text-lg max-w-md">Create, assign, and track tasks with intuitive boards and lists. Keep everyone aligned.</p>
              </div>
            </div>
          </div>

          {/* Feature 2: Analytics (Tall) */}
          <div className="md:row-span-2 rounded-3xl bg-gray-900 p-10 relative overflow-hidden group hover:shadow-xl transition-shadow duration-300 text-white">
            <div className="absolute bottom-0 right-0 w-full h-1/2 bg-linear-to-t from-gray-800 to-transparent opacity-50"></div>
            <div className="relative z-10 h-full flex flex-col">
              <div className="w-14 h-14 bg-gray-700/50 backdrop-blur-md rounded-2xl flex items-center justify-center text-white mb-6 border border-gray-600">
                <AnalysisIcon className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-bold mb-4">Real-time Analytics</h3>
              <p className="text-gray-400 mb-8 leading-relaxed">Visual statistics, completion percentages, and issue tracking. Know where project stands at a glance.</p>

              {/* Mini Chart Mockup */}
              <div className="mt-auto flex items-end gap-2 h-32 opacity-80">
                <div className="w-1/4 bg-blue-500 rounded-t-lg h-[40%]"></div>
                <div className="w-1/4 bg-cyan-400 rounded-t-lg h-[70%]"></div>
                <div className="w-1/4 bg-purple-500 rounded-t-lg h-[50%]"></div>
                <div className="w-1/4 bg-green-500 rounded-t-lg h-[85%]"></div>
              </div>
            </div>
          </div>

          {/* Feature 3: Planning (Square) */}
          <div className="rounded-3xl bg-yellow-50 p-8 relative overflow-hidden group hover:shadow-lg transition-shadow duration-300 border border-yellow-100">
            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-yellow-200 rounded-full opacity-50 blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center text-yellow-900 mb-4">
                <PlanIcon className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-yellow-900 mb-2">Smart Planning</h3>
              <p className="text-yellow-800/70">Timelines, sprints, and budgets organized in one place.</p>
            </div>
          </div>

          {/* Feature 4: Collaboration (Square) */}
          <div className="rounded-3xl bg-purple-50 p-8 relative overflow-hidden group hover:shadow-lg transition-shadow duration-300 border border-purple-100">
            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-purple-200 rounded-full opacity-50 blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-purple-400 rounded-xl flex items-center justify-center text-white mb-4">
                <CollabIcon className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-purple-900 mb-2">Team Sync</h3>
              <p className="text-purple-800/70">@mention teammates, share files, and comment instantly.</p>
            </div>
          </div>

          {/* Role Based Callout */}
          <div className="md:col-span-3 bg-white border border-gray-100 rounded-3xl p-10 flex flex-col md:flex-row items-center justify-between shadow-sm hover:shadow-md transition-shadow">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Built for every role</h3>
              <p className="text-gray-500">From Project Managers to Workers, everyone has their own dedicated view.</p>
            </div>
            <div className="flex gap-4 mt-6 md:mt-0">
              <span className="px-4 py-2 bg-gray-100 rounded-lg text-gray-600 font-bold text-sm">Project Managers</span>
              <span className="px-4 py-2 bg-gray-100 rounded-lg text-gray-600 font-bold text-sm">Team Leaders</span>
              <span className="px-4 py-2 bg-gray-100 rounded-lg text-gray-600 font-bold text-sm">Workers</span>
            </div>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gray-900"></div>
            <span className="font-bold text-gray-900">OfficePM</span>
          </div>
          <div className="text-gray-400 text-sm">
            © 2026 Office Project Management.
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-gray-400 hover:text-gray-900">Twitter</a>
            <a href="#" className="text-gray-400 hover:text-gray-900">GitHub</a>
            <a href="#" className="text-gray-400 hover:text-gray-900">Discord</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Icons
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function LogoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

function PMIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 20h.01" />
      <path d="M7 20v-4" />
      <path d="M12 20v-8" />
      <path d="M17 20V8" />
      <path d="M22 4v16" />
    </svg>
  )
}

function LeaderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  )
}

function WorkerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  )
}

function TaskIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  )
}

function PlanIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function CollabIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  )
}

function AnalysisIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}
