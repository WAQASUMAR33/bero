'use client';
import Link from 'next/link';

export default function LoginChoice() {
    return (
        <div className="flex flex-col md:flex-row min-h-screen">
            {/* Administrator Side (White) */}
            <Link
                href="/login"
                className="group relative flex-1 flex flex-col justify-center items-center bg-white overflow-hidden transition-all duration-700 hover:flex-[1.2] cursor-pointer"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                <div className="relative z-10 text-center transform group-hover:scale-105 transition-transform duration-700">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] group-hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-shadow duration-700">
                        <svg className="w-10 h-10 sm:w-14 sm:h-14 text-[#224fa6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight group-hover:text-[#224fa6] transition-colors duration-700">
                        Sign in as <br className="hidden sm:block" /> Administrator
                    </h2>
                    <p className="mt-6 text-slate-500 font-medium opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-700 delay-100">
                        Access the management portal
                    </p>
                </div>
            </Link>

            {/* Care Worker Side (Blue) */}
            <Link
                href="/care-worker-login"
                className="group relative flex-1 flex flex-col justify-center items-center bg-[#224fa6] overflow-hidden transition-all duration-700 hover:flex-[1.2] cursor-pointer"
            >
                <div className="absolute inset-0 bg-gradient-to-tl from-[#1a3d82] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                <div className="relative z-10 text-center transform group-hover:scale-105 transition-transform duration-700">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-blue-400/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-8 shadow-lg group-hover:shadow-xl transition-shadow duration-700 border border-blue-400/30">
                        <svg className="w-10 h-10 sm:w-14 sm:h-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight group-hover:text-blue-200 transition-colors duration-700">
                        Sign in as <br className="hidden sm:block" /> Care Worker
                    </h2>
                    <p className="mt-6 text-blue-100 font-medium opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-700 delay-100">
                        Access your shifts and visits
                    </p>
                </div>
            </Link>
        </div>
    );
}
