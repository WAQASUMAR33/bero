'use client';
import Link from 'next/link';
import { Facebook, Twitter, Linkedin, Instagram, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-slate-900 text-slate-300 py-16">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    {/* Brand */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2">
                            {/* Simplified Logo Fallback */}
                            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-xl">B</div>
                            <span className="text-2xl font-bold text-white tracking-tight">BEERU</span>
                        </div>
                        <p className="leading-relaxed text-slate-400">
                            Business, Employee & Enterprise Resource Unification. The all-in-one platform for modern care agencies.
                        </p>
                        <div className="flex gap-4">
                            <Link href="#" className="p-2 bg-slate-800 rounded-lg hover:bg-blue-600 transition-colors"><Facebook size={20} /></Link>
                            <Link href="#" className="p-2 bg-slate-800 rounded-lg hover:bg-blue-600 transition-colors"><Twitter size={20} /></Link>
                            <Link href="#" className="p-2 bg-slate-800 rounded-lg hover:bg-blue-600 transition-colors"><Linkedin size={20} /></Link>
                            <Link href="#" className="p-2 bg-slate-800 rounded-lg hover:bg-blue-600 transition-colors"><Instagram size={20} /></Link>
                        </div>
                    </div>

                    {/* Links */}
                    <div>
                        <h4 className="text-white font-bold text-lg mb-6">Product</h4>
                        <ul className="space-y-4">
                            <li><Link href="#" className="hover:text-blue-400 transition-colors">Features</Link></li>
                            <li><Link href="#" className="hover:text-blue-400 transition-colors">Pricing</Link></li>
                            <li><Link href="#" className="hover:text-blue-400 transition-colors">Case Studies</Link></li>
                            <li><Link href="#" className="hover:text-blue-400 transition-colors">Reviews</Link></li>
                            <li><Link href="#" className="hover:text-blue-400 transition-colors">Updates</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-bold text-lg mb-6">Company</h4>
                        <ul className="space-y-4">
                            <li><Link href="#" className="hover:text-blue-400 transition-colors">About Us</Link></li>
                            <li><Link href="#" className="hover:text-blue-400 transition-colors">Careers</Link></li>
                            <li><Link href="#" className="hover:text-blue-400 transition-colors">Contact</Link></li>
                            <li><Link href="#" className="hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
                            <li><Link href="#" className="hover:text-blue-400 transition-colors">Terms of Service</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="text-white font-bold text-lg mb-6">Contact Us</h4>
                        <ul className="space-y-5">
                            <li className="flex items-start gap-4">
                                <Mail className="w-5 h-5 text-blue-500 mt-1" />
                                <span>contact@beeru.com<br />support@beeru.com</span>
                            </li>
                            <li className="flex items-start gap-4">
                                <Phone className="w-5 h-5 text-blue-500 mt-1" />
                                <span>+44 (0) 20 1234 5678</span>
                            </li>
                            <li className="flex items-start gap-4">
                                <MapPin className="w-5 h-5 text-blue-500 mt-1" />
                                <span>123 Care Street,<br />London, UK</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-slate-500 text-sm">© {new Date().getFullYear()} BEERU Systems Ltd. All rights reserved.</p>
                    <div className="flex gap-6 text-sm">
                        <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
                        <Link href="#" className="hover:text-white transition-colors">Cookies</Link>
                        <Link href="#" className="hover:text-white transition-colors">Terms</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
