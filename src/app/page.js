'use client';

import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import Footer from '../components/landing/Footer';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white overflow-x-hidden selection:bg-[#224fa6] selection:text-white font-sans">
      <Navbar />
      <Hero />
      <Features />

      {/* CTA Section */}
      <section className="py-20 px-6 bg-[#224fa6] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-400 opacity-20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="max-w-4xl mx-auto text-center relative z-10 text-white">
          <h2 className="text-4xl lg:text-5xl font-extrabold mb-6 tracking-tight">Ready to transform your care business?</h2>
          <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            Join hundreds of care agencies using BEERU to streamline operations and deliver better care. Start your 14-day free trial today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/login" className="px-8 py-4 bg-white text-[#224fa6] font-bold rounded-xl text-lg hover:bg-blue-50 transition-all shadow-xl active:scale-95">Get Started Now</a>
            <a href="/login" className="px-8 py-4 bg-[#2f66d4] text-white border border-blue-400 font-bold rounded-xl text-lg hover:bg-[#346fe0] transition-all">Contact Sales</a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}