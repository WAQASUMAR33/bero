'use client';
import { motion } from 'framer-motion';
import { Calendar, Monitor, FileText, PoundSterling, Smartphone, ShieldCheck, ArrowRight } from 'lucide-react';

const features = [
    {
        title: 'Smart Rostering',
        description: 'Effortlessly manage shifts with our intelligent drag-and-drop calendar. Minimize conflicts and ensure coverage.',
        icon: Calendar,
        color: 'bg-blue-100 text-blue-600',
    },
    {
        title: 'Real-time Monitoring',
        description: 'Track attendance, task completion, and visits in real-time. Stay informed with live updates from care workers.',
        icon: Monitor,
        color: 'bg-green-100 text-green-600',
    },
    {
        title: 'Digital Care Plans',
        description: 'Create, update, and access detailed care plans securely. Ensure personalized care delivery for every service user.',
        icon: FileText,
        color: 'bg-indigo-100 text-indigo-600',
    },
    {
        title: 'Finance & Payroll',
        description: 'Automate invoicing and payroll calculations. Integrate seamlessly with your existing accounting software.',
        icon: PoundSterling,
        color: 'bg-amber-100 text-amber-600',
    },
    {
        title: 'Mobile Care App',
        description: 'Empower staff with our user-friendly mobile app for checking shifts, clocking in, and reporting.',
        icon: Smartphone,
        color: 'bg-purple-100 text-purple-600',
    },
    {
        title: 'HR & Compliance',
        description: 'Stay CQC compliant with automated alerts, document management, and staff training tracking.',
        icon: ShieldCheck,
        color: 'bg-rose-100 text-rose-600',
    },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5 }
    }
};

export default function Features() {
    return (
        <section id="features" className="py-24 bg-slate-50 relative overflow-hidden">
            {/* Texture */}
            <div className="absolute inset-0 bg-[linear-gradient(#e5e7eb_1px,transparent_1px),linear-gradient(to_right,#e5e7eb_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="text-sm font-bold text-[#224fa6] uppercase tracking-wider mb-2">Why Choose BEERU</h2>
                    <h3 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Everything you need to manage care.</h3>
                    <p className="text-lg text-slate-600">
                        A complete suite of tools designed to help care businesses save time, reduce costs, and improve care quality.
                    </p>
                </div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                    {features.map((feature, idx) => (
                        <motion.div
                            key={idx}
                            variants={itemVariants}
                            className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 border border-slate-100 group"
                        >
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 ${feature.color}`}>
                                <feature.icon className="w-7 h-7" />
                            </div>
                            <h4 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-[#224fa6] transition-colors">{feature.title}</h4>
                            <p className="text-slate-600 leading-relaxed mb-4">
                                {feature.description}
                            </p>
                            <div className="flex items-center text-[#224fa6] font-bold text-sm cursor-pointer opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                Learn more <ArrowRight className="w-4 h-4 ml-1" />
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
