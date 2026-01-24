'use client';
import Navbar from '../../components/landing/Navbar';
import Footer from '../../components/landing/Footer';
import { motion } from 'framer-motion';
import { Calendar, Monitor, FileText, PoundSterling, Smartphone, ShieldCheck, Check } from 'lucide-react';

const featuresList = [
    {
        icon: Calendar,
        color: 'bg-blue-100 text-blue-600',
        title: 'Intelligent Rostering',
        subtitle: 'Schedule the right people, in the right place, at the right time.',
        details: [
            'Drag-and-drop shift scheduling',
            'Automatic conflict detection (double booking, holidays)',
            'Staff availability tracking',
            'Shift templates for recurring patterns'
        ]
    },
    {
        icon: Monitor,
        color: 'bg-green-100 text-green-600',
        title: 'Live Monitoring',
        subtitle: 'Complete visibility into your operations, wherever you are.',
        details: [
            'Real-time GPS clock-ins and clock-outs',
            'Late arrival and missed visit alerts',
            'Live dashboard map view',
            'Visit verification logs'
        ]
    },
    {
        icon: FileText,
        color: 'bg-indigo-100 text-indigo-600',
        title: 'Digital Care Plans',
        subtitle: 'Person-centered care documentation that moves with you.',
        details: [
            'Customizable assessment forms',
            'Digital MAR charts (eMAR)',
            'Risk assessment tools',
            'Secure access for authorized family members'
        ]
    },
    {
        icon: PoundSterling,
        color: 'bg-amber-100 text-amber-600',
        title: 'Finance & Payroll',
        subtitle: 'Turn accurate time-tracking into accurate pay and invoices.',
        details: [
            'One-click invoice generation',
            'Payroll export integration (Sage, Xero, etc.)',
            'Mileage and expense tracking',
            'Flexible rate cards for different payers'
        ]
    }
];

export default function FeaturesPage() {
    return (
        <main className="min-h-screen bg-white font-sans">
            <Navbar />

            {/* Hero */}
            <section className="pt-32 pb-20 px-6 bg-slate-50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#224fa6] opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="max-w-7xl mx-auto relative z-10 text-center">
                    <h1 className="text-4xl lg:text-5xl font-extrabold mb-6 tracking-tight text-slate-900">Capabilities that Empower</h1>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                        Explore the diverse toolset that makes BEERU the preferred choice for forward-thinking care agencies.
                    </p>
                </div>
            </section>

            {/* Feature Drilldown */}
            <section className="py-20 px-6">
                <div className="max-w-7xl mx-auto space-y-24">
                    {featuresList.map((feature, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.6 }}
                            className={`flex flex-col md:flex-row gap-12 lg:gap-24 items-center ${idx % 2 === 1 ? 'md:flex-row-reverse' : ''}`}
                        >
                            <div className="flex-1 space-y-6">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${feature.color}`}>
                                    <feature.icon className="w-8 h-8" />
                                </div>
                                <h2 className="text-3xl font-bold text-slate-900">{feature.title}</h2>
                                <p className="text-xl text-slate-600">{feature.subtitle}</p>

                                <ul className="space-y-3 pt-4">
                                    {feature.details.map((detail, i) => (
                                        <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                                            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0">
                                                <Check className="w-3.5 h-3.5" />
                                            </div>
                                            {detail}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="flex-1 w-full bg-slate-50 rounded-3xl min-h-[400px] border border-slate-100 shadow-xl relative overflow-hidden group">
                                {/* Abstract UI Mockup for feature */}
                                <div className="absolute inset-0 bg-white/50" />
                                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-white rounded-xl shadow-lg border border-slate-100 p-6 transition-all duration-500 group-hover:scale-105`}>
                                    <div className="flex items-center gap-4 mb-6 border-b border-slate-50 pb-4">
                                        <div className={`w-10 h-10 rounded-lg ${feature.color} flex items-center justify-center`}><feature.icon size={20} /></div>
                                        <div className="h-4 w-32 bg-slate-100 rounded"></div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="h-2 w-full bg-slate-100 rounded"></div>
                                        <div className="h-2 w-full bg-slate-100 rounded"></div>
                                        <div className="h-2 w-2/3 bg-slate-100 rounded"></div>
                                    </div>
                                    <div className="mt-8 grid grid-cols-2 gap-4">
                                        <div className="h-20 bg-slate-50 rounded-lg"></div>
                                        <div className="h-20 bg-slate-50 rounded-lg"></div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            <Footer />
        </main>
    );
}
