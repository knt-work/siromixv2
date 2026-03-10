/**
 * Homepage
 * 
 * Landing page with product introduction and call-to-action buttons.
 * Updated to match exact Visily reference layout with 2-column design
 */

'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { useAuthStore } from '@/lib/state/auth-store';
import { UI_TEXT } from '@/constants/content';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, setRedirectPath } = useAuthStore();

  const handleCreateExamClick = () => {
    if (!isAuthenticated) {
      setRedirectPath('/exams/create');
      router.push('/login');
    } else {
      router.push('/exams/create');
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Main Content */}
      <main className="relative flex-1 overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_112%_112%_at_50%_0%,rgba(154,148,222,0.05)_0%,rgba(255,255,255,1)_50%,rgba(255,255,255,1)_100%)] pointer-events-none" />

        <div className="relative z-10 max-w-[1440px] mx-auto px-4 lg:px-[120px] h-full flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-16">
          {/* Left Content */}
          <div className="w-full lg:max-w-[644px]">
            <h1 className="text-[40px] lg:text-[56px] leading-[1.1] font-extrabold text-text-dark tracking-[-1.4px] mb-6">
              {UI_TEXT.hero.headline.split('SiroMix')[0]}
              <span className="text-brand-primary">SiroMix</span>
            </h1>
            <p className="text-lg lg:text-[20px] leading-[28px] text-text-gray mb-10">
              {UI_TEXT.hero.subheadline}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Button
                variant="primary"
                size="lg"
                onClick={handleCreateExamClick}
                className="h-14 px-8"
              >
                Tạo đề thi mới
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push('/guide')}
                className="h-14 px-8"
              >
                Xem hướng dẫn
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
              {UI_TEXT.hero.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Icon 
                    icon="lucide:check-circle" 
                    size={16} 
                    className="text-brand-primary" 
                  />
                  <span className="text-sm font-medium text-text-gray">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Illustration */}
          <div className="relative w-full max-w-[460px] aspect-square bg-white rounded-[32px] shadow-[0px_8px_17px_0px_rgba(23,26,31,0.15),0px_0px_2px_0px_rgba(23,26,31,0.12)] border border-border/50 flex items-center justify-center overflow-hidden">
            <div className="relative w-full h-full">
              {/* Background Document */}
              <div className="absolute top-[118px] left-[134px] w-[128px] h-[160px] bg-white rounded-[10px] border border-border shadow-[0px_4px_9px_0px_rgba(23,26,31,0.11),0px_0px_2px_0px_rgba(23,26,31,0.12)] p-4 flex flex-col gap-1.5">
                <div className="flex justify-center mb-4">
                  <Icon icon="lucide:file-text" size={48} className="text-brand-primary/40" />
                </div>
                <div className="w-full h-1.5 bg-background-gray rounded-full"></div>
                <div className="w-[80%] h-1.5 bg-background-gray rounded-full"></div>
                <div className="w-full h-1.5 bg-background-gray rounded-full"></div>
                <div className="w-[60%] h-1.5 bg-background-gray rounded-full"></div>
              </div>

              {/* Foreground Document */}
              <div className="absolute top-[158px] left-[174px] w-[112px] h-[144px] bg-white rounded-[10px] border border-border shadow-[0px_4px_9px_0px_rgba(23,26,31,0.11),0px_0px_2px_0px_rgba(23,26,31,0.12)] p-3 flex flex-col gap-1.5 z-10">
                <div className="flex justify-between items-start mb-2">
                  <div className="px-1.5 py-0.5 bg-brand-light rounded-[4px]">
                    <span className="text-[10px] font-bold text-brand-primary">Ver. A</span>
                  </div>
                </div>
                <div className="flex justify-center mb-3">
                  <Icon icon="lucide:file-check" size={32} className="text-brand-primary/60" />
                </div>
                <div className="w-full h-1.5 bg-background-gray rounded-full"></div>
                <div className="w-full h-1.5 bg-background-gray rounded-full"></div>
                <div className="w-[75%] h-1.5 bg-background-gray rounded-full"></div>
              </div>

              {/* Action Button */}
              <div className="absolute top-[206px] left-[214px] w-16 h-16 bg-brand-primary rounded-full border-4 border-white shadow-[0px_8px_17px_0px_rgba(23,26,31,0.15),0px_0px_2px_0px_rgba(23,26,31,0.12)] flex items-center justify-center z-20">
                <Icon icon="lucide:refresh-cw" size={24} className="text-white -rotate-[157deg]" />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-border/40 px-4 lg:px-[144px] py-4 flex flex-col sm:flex-row items-center justify-between gap-4 flex-shrink-0">
        <span className="text-sm text-text-gray">© 2026 SiroMix — All rights reserved.</span>
        <div className="flex items-center gap-4 text-sm text-text-gray">
          <a href="#" className="hover:text-text-dark transition-colors">Terms</a>
          <span className="text-border">•</span>
          <a href="#" className="hover:text-text-dark transition-colors">Privacy</a>
          <span className="text-border">•</span>
          <a href="#" className="hover:text-text-dark transition-colors">Contact</a>
        </div>
      </footer>
    </div>
  );
}
