'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6'}`}>
            <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                <Link href="/" className="flex items-center gap-2">
                    <Image src="/assets/logo2.png" alt="BEERU" width={140} height={60} className="h-14 w-auto object-contain" />
                </Link>

                <div className="hidden md:flex items-center gap-8">
                    <Link href="/" className="text-slate-600 hover:text-[#224fa6] font-medium transition-colors">Home</Link>
                    <Link href="/features" className="text-slate-600 hover:text-[#224fa6] font-medium transition-colors">Features</Link>
                    <Link href="/about" className="text-slate-600 hover:text-[#224fa6] font-medium transition-colors">About</Link>
                    <Link href="/contact" className="text-slate-600 hover:text-[#224fa6] font-medium transition-colors">Contact</Link>
                </div>

                <div className="hidden md:flex items-center gap-4">
                    <Link href="/login" className="text-[#224fa6] font-bold hover:bg-blue-50 px-5 py-2.5 rounded-xl transition-all">
                        Login
                    </Link>
                    <Link href="/login" className="bg-[#224fa6] hover:bg-[#1e438f] text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-900/20 hover:shadow-xl transition-all active:scale-95">
                        Get Started
                    </Link>
                </div>

                <button className="md:hidden p-2 text-slate-600" onClick={() => setIsOpen(!isOpen)}>
                    {isOpen ? <X /> : <Menu />}
                </button>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-white border-b shadow-lg"
                    >
                        <div className="px-6 py-4 flex flex-col gap-4">
                            <Link href="/" onClick={() => setIsOpen(false)} className="text-slate-600 font-medium">Home</Link>
                            <Link href="/features" onClick={() => setIsOpen(false)} className="text-slate-600 font-medium">Features</Link>
                            <Link href="/about" onClick={() => setIsOpen(false)} className="text-slate-600 font-medium">About</Link>
                            <Link href="/contact" onClick={() => setIsOpen(false)} className="text-slate-600 font-medium">Contact</Link>
                            <hr />
                            <Link href="/login" className="text-[#224fa6] font-bold">Login</Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
