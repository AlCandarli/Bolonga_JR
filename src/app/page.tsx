"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

export default function LoginPage() {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { t, dir } = useLanguage();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });

      if (response.ok) {
        router.push("/student");
      } else {
        const data = await response.json();
        setError(data.error || "Invalid code");
      }
    } catch (err) {
      setError("Connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main
      className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden bg-[#05050a]"
      dir="ltr"
    >
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-brand-primary opacity-20 blur-[100px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[10%] left-[-20%] w-[60vw] h-[60vw] rounded-full bg-indigo-600 opacity-20 blur-[130px] animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute top-[40%] right-[30%] w-[40vw] h-[40vw] rounded-full bg-emerald-500 opacity-10 blur-[120px] animate-pulse" style={{ animationDuration: '12s' }} />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-5 w-full">

        <div className="w-full max-w-[22rem] sm:max-w-sm rounded-[2.5rem] bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] p-8 sm:p-10 relative overflow-hidden group">
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-50" />

          <div className="flex flex-col items-center space-y-5 mb-10">
            <div className="w-24 h-24 sm:w-28 sm:h-28 relative rounded-full overflow-hidden shadow-2xl p-1 bg-gradient-to-b from-white/10 to-transparent border border-white/20">
              <Image
                src="/logo.png"
                alt="Bologna JR Logo"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover rounded-full"
                priority
              />
            </div>
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 tracking-tight">
                Bologna JR
              </h1>
              <p className="text-xs sm:text-sm text-white/40 mt-1.5 font-medium tracking-wide">
                {t('smart_portal')}
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <div className="relative group/input">
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={t('enter_code_placeholder')}
                className="w-full h-16 bg-black/30 border border-white/10 rounded-2xl px-6 text-0.5xl text-center text-white placeholder:text-white/20 focus:outline-none focus:bg-white/5 focus:border-brand-primary/50 transition-all font-bold tracking-[0.2em] shadow-inner backdrop-blur-sm " style={{ direction: 'ltr' }}
                required
                autoComplete="off"
              />
              <div className="absolute bottom-[-1px] left-1/2 -translate-x-1/2 w-0 h-[2px] bg-brand-primary group-focus-within/input:w-3/4 transition-all duration-300 ease-out shadow-[0_0_10px_#00E5FF]" />
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center font-bold animate-pulse -mt-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="relative w-full h-16 bg-white hover:bg-brand-primary text-black font-extrabold text-lg sm:text-xl rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(0,229,255,0.3)] transition-all duration-300 active:scale-[0.97] flex items-center justify-center overflow-hidden disabled:opacity-50"
            >
              <span className="relative z-10 flex items-center">
                {isLoading ? (
                   <svg className="animate-spin h-6 w-6 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
                ) : (
                  <>
                    {t('login')}
                    <svg className="w-6 h-6 ml-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                  </>
                )}
              </span>
            </button>
          </form>

          <div className="mt-8 flex flex-col items-center gap-4">
            <button
              onClick={() => router.push('/admin')}
              className="text-white/30 hover:text-white/80 text-xs sm:text-sm font-medium transition-colors"
            >
              {t('admin_login')}
            </button>
          </div>
        </div>
      </div>

      <footer className="relative z-10 w-full py-8 flex flex-col items-center justify-center" dir="ltr">
        <div className="w-[40%] sm:w-[20%] h-[2px] bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full mb-5" />
        <p className="text-white/40 text-[13px] tracking-wide leading-relaxed px-4 text-center flex flex-wrap justify-center items-center gap-1.5" style={{ direction: 'ltr' }}>
          <span>&copy; {new Date().getFullYear()} Developed by</span>
          <a
            href="https://alcandarli.github.io/LinkTree/?utm_source=ig&utm_medium=social&utm_content=link_in_bio&fbclid=PAZnRzaARLXhxleHRuA2FlbQIxMQBzcnRjBmFwcF9pZA8xMjQwMjQ1NzQyODc0MTQAAad2YY5TGOwRkzT7uSFOoCDrsBje6c-6SYwYXF_7Apu6r9tKdkq0Y7I1pq2u2g_aem_2nUYIduEtbdPbbICe--iwA"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white font-extrabold hover:text-brand-primary transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]"
          >
            Çandarli Paşa
          </a>
          <span>for R.I.S.E Organization</span>
        </p>
      </footer>

    </main>
  );
}