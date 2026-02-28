'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, CheckCircle, Shield, Activity, Users } from 'lucide-react';

export default function Hero() {
    return (
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-white">
            {/* Background blobs */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50 -z-10" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 opacity-50 -z-10" />

            <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[#224fa6] text-sm font-bold mb-6">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        The #1 Care Management Platform
                    </div>
                    <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6">
                        Unified Care <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#224fa6] to-[#3270e9]">Excellence</span>
                    </h1>
                    <p className="text-lg text-slate-600 leading-relaxed mb-8 max-w-xl">
                        BEERU empowers care agencies with a unified platform for rostering, compliance, and care planning. Streamline your operations and focus on what matters most—delivering exceptional care.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <Link href="/login-choice" className="inline-flex justify-center items-center gap-2 bg-[#224fa6] hover:bg-[#1e438f] text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl shadow-blue-900/20 active:scale-95 transition-all">
                            Start Free Trial <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link href="/contact" className="inline-flex justify-center items-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-8 py-4 rounded-xl font-bold text-lg transition-all">
                            Book Demo
                        </Link>
                    </div>

                    <div className="mt-8 flex flex-wrap items-center gap-6 text-sm font-medium text-slate-500">
                        <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Compliance Ready</div>
                        <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Real-time Monitoring</div>
                        <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Easy Onboarding</div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="relative hidden lg:block"
                >
                    {/* Abstract Dashboard UI Composition */}
                    <div className="relative rounded-2xl bg-white shadow-2xl border border-slate-200 p-2 transform rotate-1 hover:rotate-0 transition-all duration-700">
                        <div className="absolute inset-0 bg-gradient-to-tr from-[#224fa6]/5 to-transparent rounded-2xl pointer-events-none" />

                        <div className="aspect-[4/3] bg-slate-50 rounded-xl overflow-hidden relative border border-slate-100">
                            {/* Sidebar */}
                            <div className="absolute left-0 top-0 bottom-0 w-16 bg-white border-r border-slate-100 flex flex-col items-center py-4 gap-4">
                                <div className="w-8 h-8 rounded-lg bg-[#224fa6]"></div>
                                <div className="w-8 h-8 rounded-lg bg-slate-100"></div>
                                <div className="w-8 h-8 rounded-lg bg-slate-100"></div>
                                <div className="w-8 h-8 rounded-lg bg-slate-100"></div>
                            </div>

                            {/* Topbar */}
                            <div className="absolute top-0 left-16 right-0 h-14 bg-white border-b border-slate-100 flex items-center px-6 justify-between">
                                <div className="w-32 h-4 bg-slate-100 rounded-full"></div>
                                <div className="flex gap-2">
                                    <div className="w-8 h-8 rounded-full bg-slate-100"></div>
                                    <div className="w-8 h-8 rounded-full bg-blue-100"></div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="absolute top-14 left-16 right-0 bottom-0 p-6 bg-slate-50/50">
                                <div className="grid grid-cols-3 gap-4 mb-6">
                                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                        <div className="w-8 h-8 rounded-full bg-blue-50 mb-2 flex items-center justify-center text-blue-500"><Activity size={16} /></div>
                                        <div className="h-4 w-12 bg-slate-100 rounded mb-1"></div>
                                        <div className="h-6 w-20 bg-slate-200 rounded"></div>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                        <div className="w-8 h-8 rounded-full bg-green-50 mb-2 flex items-center justify-center text-green-500"><Users size={16} /></div>
                                        <div className="h-4 w-12 bg-slate-100 rounded mb-1"></div>
                                        <div className="h-6 w-20 bg-slate-200 rounded"></div>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                        <div className="w-8 h-8 rounded-full bg-indigo-50 mb-2 flex items-center justify-center text-indigo-500"><Shield size={16} /></div>
                                        <div className="h-4 w-12 bg-slate-100 rounded mb-1"></div>
                                        <div className="h-6 w-20 bg-slate-200 rounded"></div>
                                    </div>
                                </div>
                                <div className="bg-white rounded-xl border border-slate-100 shadow-sm h-40 p-4">
                                    <div className="h-4 w-32 bg-slate-100 rounded mb-4"></div>
                                    <div className="space-y-2">
                                        <div className="h-8 w-full bg-slate-50 rounded"></div>
                                        <div className="h-8 w-full bg-slate-50 rounded"></div>
                                        <div className="h-8 w-full bg-slate-50 rounded"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Floating Badge */}
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -bottom-8 -left-8 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-4 z-10"
                    >
                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600 font-bold text-xl">
                            <Shield className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">CQC Compliance</p>
                            <p className="font-bold text-slate-800 text-lg">Outstanding</p>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}
