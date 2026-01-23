'use client';
import Navbar from '../../components/landing/Navbar';
import Footer from '../../components/landing/Footer';
import { motion } from 'framer-motion';
import { Users, Target, Heart } from 'lucide-react';

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-white font-sans">
            <Navbar />

            {/* Hero */}
            <section className="pt-32 pb-20 px-6 bg-slate-50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-100 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3" />
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl font-extrabold text-slate-900 mb-6 tracking-tight"
                    >
                        We are <span className="text-[#224fa6]">BEERU</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto"
                    >
                        Business, Employee & Enterprise Resource Unification. <br />
                        Our mission is to simplify care management so you can focus on what truly matters: people.
                    </motion.p>
                </div>
            </section>

            {/* Story Section */}
            <section className="py-20 px-6">
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
                    <div className="relative">
                        <div className="bg-slate-100 rounded-2xl aspect-square md:aspect-[4/5] relative overflow-hidden shadow-2xl rotate-2 hover:rotate-0 transition-all duration-500">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-indigo-600/20 z-10" />
                            {/* Abstract Representation of a team */}
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-200">
                                <Users className="w-32 h-32 text-slate-400" />
                            </div>
                        </div>
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-6">Born from Experience</h2>
                        <div className="space-y-4 text-lg text-slate-600 leading-relaxed">
                            <p>
                                BEERU was founded with a simple yet powerful vision: to unify the fragmented world of care management. We noticed that care agencies were juggling multiple disjointed systems—one for rostering, another for payroll, and yet another for care plans.
                            </p>
                            <p>
                                This fragmentation led to errors, inefficiency, and burnout. We knew there had to be a better way.
                            </p>
                            <p>
                                Drawing on years of industry experience, we built BEERU to be the comprehensive "Operating System" for care businesses. A single source of truth that brings everything—and everyone—together.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="py-20 px-6 bg-slate-900 text-white">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-3xl font-bold mb-12 text-center">Our Core Values</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 hover:border-blue-500 transition-colors">
                            <Heart className="w-10 h-10 text-rose-500 mb-4" />
                            <h3 className="text-xl font-bold mb-2">Care First</h3>
                            <p className="text-slate-400">Technology should enable care, not complicate it. Every feature we build is designed with the end-user in mind.</p>
                        </div>
                        <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 hover:border-blue-500 transition-colors">
                            <Target className="w-10 h-10 text-blue-500 mb-4" />
                            <h3 className="text-xl font-bold mb-2">Simplicity</h3>
                            <p className="text-slate-400">Complex problems don't need complex solutions. We strive for intuitive, elegant design in everything we do.</p>
                        </div>
                        <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 hover:border-blue-500 transition-colors">
                            <Users className="w-10 h-10 text-green-500 mb-4" />
                            <h3 className="text-xl font-bold mb-2">Partnership</h3>
                            <p className="text-slate-400">We are not just a software provider; we are partners in your success, dedicated to growing with you.</p>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
