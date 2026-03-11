/**
 * Homepage
 * 
 * Landing page with product introduction and call-to-action buttons.
 * Exact 1:1 implementation from html/SiroMix - Homepage/src/App.tsx
 */

'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/state/auth-store';

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
    <div className="min-h-screen bg-white font-sans selection:bg-[#9a94de]/20 selection:text-[#171a1f]">
      {/* Main Content */}
      <main className="relative pt-16 min-h-[calc(100vh-69px)]">
        {/* Background Gradient */}
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_112%_112%_at_50%_0%,_#9a94de0d_0%,_#ffffffff_50%,_#ffffffff_100%)] pointer-events-none" />

        <div className="relative z-10 max-w-[1440px] mx-auto px-4 lg:px-[120px] py-12 lg:py-[153px] flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-0">
          {/* Left Content */}
          <div className="w-full lg:max-w-[644px]">
            <h1 className="text-[40px] lg:text-[56px] leading-[1.1] font-extrabold text-[#171a1f] tracking-[-1.4px] mb-6">
              Trộn đề thi nhanh chóng bằng <span className="text-[#9a94de]">AI</span> với <span className="text-[#9a94de]">SiroMix</span>
            </h1>
            <p className="text-lg lg:text-[20px] leading-[28px] text-[#565d6d] mb-10">
              Bạn chỉ cần tải lên đề thi Word thô, phần còn lại hãy để SiroMix lo!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <button 
                onClick={handleCreateExamClick}
                className="h-14 px-8 bg-[#9a94de] text-white font-semibold rounded-md shadow-[0px_2px_5px_0px_#171a1f17,_0px_0px_2px_0px_#171a1f1f] hover:bg-[#8a84ce] transition-all active:scale-95"
              >
                Tạo đề thi mới
              </button>
              <button 
                onClick={() => router.push('/guide')}
                className="h-14 px-8 bg-white border border-[#dee1e6] text-[#171a1f] font-semibold rounded-md shadow-[0px_2px_5px_0px_#171a1f17,_0px_0px_2px_0px_#171a1f1f] hover:bg-gray-50 transition-all active:scale-95"
              >
                Xem hướng dẫn
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
              <div className="flex items-center gap-2">
                <svg data-svg-id="SVG_6" className="w-4 h-4 text-[#9a94de]" viewBox="0 0 16 16">
    <g transform="matrix(1 0 0 1 0 0)">
      <g style={{  }}>
        <g transform="matrix(0.67 0 0 0.67 8 8)">
          <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(154,148,222)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -12)" d="M 21 12 C 21 7.02944 16.9706 3 12 3 C 7.02944 3 3 7.02944 3 12 C 3 16.9706 7.02944 21 12 21 C 16.9706 21 21 16.9706 21 12 Z M 23 12 C 23 18.0751 18.0751 23 12 23 C 5.92487 23 1 18.0751 1 12 C 1 5.92487 5.92487 1 12 1 C 18.0751 1 23 5.92487 23 12 Z" strokeLinecap="round" />
        </g>
        <g transform="matrix(0.67 0 0 0.67 8 8)">
          <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(154,148,222)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -12)" d="M 14.3692 9.22462 C 14.7619 8.90427 15.3409 8.92686 15.707 9.29298 C 16.0732 9.65909 16.0958 10.2381 15.7754 10.6309 L 15.707 10.707 L 11.707 14.707 C 11.3409 15.0732 10.7619 15.0958 10.3692 14.7754 L 10.293 14.707 L 8.29298 12.707 L 8.22462 12.6309 C 7.90427 12.2381 7.92686 11.6591 8.29298 11.293 C 8.65909 10.9269 9.2381 10.9043 9.63087 11.2246 L 9.70704 11.293 L 11 12.5859 L 14.293 9.29298 L 14.3692 9.22462 Z" strokeLinecap="round" />
        </g>
      </g>
    </g>
  </svg>
                <span className="text-sm font-medium text-[#565d6d]">Hỗ trọ DOCX</span>
              </div>
              <div className="flex items-center gap-2">
                <svg data-svg-id="SVG_7" className="w-4 h-4 text-[#9a94de]" viewBox="0 0 16 16">
    <g transform="matrix(1 0 0 1 0 0)">
      <g style={{  }}>
        <g transform="matrix(0.67 0 0 0.67 8 8)">
          <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(154,148,222)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -12)" d="M 21 12 C 21 7.02944 16.9706 3 12 3 C 7.02944 3 3 7.02944 3 12 C 3 16.9706 7.02944 21 12 21 C 16.9706 21 21 16.9706 21 12 Z M 23 12 C 23 18.0751 18.0751 23 12 23 C 5.92487 23 1 18.0751 1 12 C 1 5.92487 5.92487 1 12 1 C 18.0751 1 23 5.92487 23 12 Z" strokeLinecap="round" />
        </g>
        <g transform="matrix(0.67 0 0 0.67 8 8)">
          <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(154,148,222)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -12)" d="M 14.3692 9.22462 C 14.7619 8.90427 15.3409 8.92686 15.707 9.29298 C 16.0732 9.65909 16.0958 10.2381 15.7754 10.6309 L 15.707 10.707 L 11.707 14.707 C 11.3409 15.0732 10.7619 15.0958 10.3692 14.7754 L 10.293 14.707 L 8.29298 12.707 L 8.22462 12.6309 C 7.90427 12.2381 7.92686 11.6591 8.29298 11.293 C 8.65909 10.9269 9.2381 10.9043 9.63087 11.2246 L 9.70704 11.293 L 11 12.5859 L 14.293 9.29298 L 14.3692 9.22462 Z" strokeLinecap="round" />
        </g>
      </g>
    </g>
  </svg>
                <span className="text-sm font-medium text-[#565d6d]">Phân tích thông minh</span>
              </div>
              <div className="flex items-center gap-2">
                <svg data-svg-id="SVG_8" className="w-4 h-4 text-[#9a94de]" viewBox="0 0 16 16">
    <g transform="matrix(1 0 0 1 0 0)">
      <g style={{  }}>
        <g transform="matrix(0.67 0 0 0.67 8 8)">
          <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(154,148,222)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -12)" d="M 21 12 C 21 7.02944 16.9706 3 12 3 C 7.02944 3 3 7.02944 3 12 C 3 16.9706 7.02944 21 12 21 C 16.9706 21 21 16.9706 21 12 Z M 23 12 C 23 18.0751 18.0751 23 12 23 C 5.92487 23 1 18.0751 1 12 C 1 5.92487 5.92487 1 12 1 C 18.0751 1 23 5.92487 23 12 Z" strokeLinecap="round" />
        </g>
        <g transform="matrix(0.67 0 0 0.67 8 8)">
          <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(154,148,222)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -12)" d="M 14.3692 9.22462 C 14.7619 8.90427 15.3409 8.92686 15.707 9.29298 C 16.0732 9.65909 16.0958 10.2381 15.7754 10.6309 L 15.707 10.707 L 11.707 14.707 C 11.3409 15.0732 10.7619 15.0958 10.3692 14.7754 L 10.293 14.707 L 8.29298 12.707 L 8.22462 12.6309 C 7.90427 12.2381 7.92686 11.6591 8.29298 11.293 C 8.65909 10.9269 9.2381 10.9043 9.63087 11.2246 L 9.70704 11.293 L 11 12.5859 L 14.293 9.29298 L 14.3692 9.22462 Z" strokeLinecap="round" />
        </g>
      </g>
    </g>
  </svg>
                <span className="text-sm font-medium text-[#565d6d]">Tải xuống nhanh chóng</span>
              </div>
            </div>
          </div>

          {/* Right Illustration */}
          <div className="relative w-full max-w-[460px] aspect-square bg-white rounded-[32px] shadow-[0px_8px_17px_0px_#171a1f26,_0px_0px_2px_0px_#171a1f1f] border border-[#dee1e6]/50 flex items-center justify-center overflow-hidden">
            <div className="relative w-full h-full">
              {/* Background Document */}
              <div className="absolute top-[118px] left-[134px] w-[128px] h-[160px] bg-white rounded-[10px] border border-[#dee1e6] shadow-[0px_4px_9px_0px_#171a1f1c,_0px_0px_2px_0px_#171a1f1f] p-4 flex flex-col gap-1.5">
                <div className="flex justify-center mb-4">
                  <svg data-svg-id="SVG_3" className="w-12 h-12 text-[#9a94de]/40" viewBox="0 0 48 48">
            <g transform="matrix(1 0 0 1 0 0)">
              <g style={{  }}>
                <g transform="matrix(2 0 0 2 24 24)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(154,148,222)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -12)" d="M 3 20 L 3 4 C 3 3.20435 3.3163 2.44152 3.87891 1.87891 C 4.44152 1.3163 5.20435 1 6 1 L 15 1 L 15.0986 1.00488 C 15.3276 1.02757 15.5429 1.12883 15.707 1.29297 L 20.707 6.29297 C 20.8946 6.48051 21 6.73478 21 7 L 21 20 C 21 20.7957 20.6837 21.5585 20.1211 22.1211 C 19.5585 22.6837 18.7957 23 18 23 L 6 23 C 5.20435 23 4.44152 22.6837 3.87891 22.1211 C 3.3163 21.5585 3 20.7956 3 20 Z M 5 20 C 5 20.2652 5.10543 20.5195 5.29297 20.707 C 5.48051 20.8946 5.73478 21 6 21 L 18 21 C 18.2652 21 18.5195 20.8946 18.707 20.707 C 18.8946 20.5195 19 20.2652 19 20 L 19 7.41406 L 14.5859 3 L 6 3 C 5.73478 3 5.48051 3.10543 5.29297 3.29297 C 5.10543 3.48051 5 3.73478 5 4 L 5 20 Z" strokeLinecap="round" />
                </g>
                <g transform="matrix(2 0 0 2 34 10)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(154,148,222)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-17, -5)" d="M 13 6 L 13 2 C 13 1.44772 13.4477 1 14 1 C 14.5523 1 15 1.44772 15 2 L 15 6 C 15 6.26522 15.1054 6.51949 15.293 6.70703 C 15.4805 6.89457 15.7348 7 16 7 L 20 7 C 20.5523 7 21 7.44772 21 8 C 21 8.55228 20.5523 9 20 9 L 16 9 C 15.2044 9 14.4415 8.6837 13.8789 8.12109 C 13.3163 7.55848 13 6.79565 13 6 Z" strokeLinecap="round" />
                </g>
                <g transform="matrix(2 0 0 2 18 18)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(154,148,222)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-9, -9)" d="M 10 8 C 10.5523 8 11 8.44772 11 9 C 11 9.55228 10.5523 10 10 10 L 8 10 C 7.44772 10 7 9.55228 7 9 C 7 8.44772 7.44772 8 8 8 L 10 8 Z" strokeLinecap="round" />
                </g>
                <g transform="matrix(2 0 0 2 24 26)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(154,148,222)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -13)" d="M 16 12 C 16.5523 12 17 12.4477 17 13 C 17 13.5523 16.5523 14 16 14 L 8 14 C 7.44772 14 7 13.5523 7 13 C 7 12.4477 7.44772 12 8 12 L 16 12 Z" strokeLinecap="round" />
                </g>
                <g transform="matrix(2 0 0 2 24 34)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(154,148,222)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -17)" d="M 16 16 C 16.5523 16 17 16.4477 17 17 C 17 17.5523 16.5523 18 16 18 L 8 18 C 7.44772 18 7 17.5523 7 17 C 7 16.4477 7.44772 16 8 16 L 16 16 Z" strokeLinecap="round" />
                </g>
              </g>
            </g>
          </svg>
                </div>
                <div className="w-full h-1.5 bg-[#f3f4f6] rounded-full"></div>
                <div className="w-[80%] h-1.5 bg-[#f3f4f6] rounded-full"></div>
                <div className="w-full h-1.5 bg-[#f3f4f6] rounded-full"></div>
                <div className="w-[60%] h-1.5 bg-[#f3f4f6] rounded-full"></div>
              </div>

              {/* Foreground Document */}
              <div className="absolute top-[158px] left-[174px] w-[112px] h-[144px] bg-white rounded-[10px] border border-[#dee1e6] shadow-[0px_4px_9px_0px_#171a1f1c,_0px_0px_2px_0px_#171a1f1f] p-3 flex flex-col gap-1.5 z-10">
                <div className="flex justify-between items-start mb-2">
                  <div className="px-1.5 py-0.5 bg-[#9a94de]/10 rounded-[4px]">
                    <span className="text-[10px] font-bold text-[#9a94de]">Ver. A</span>
                  </div>
                </div>
                <div className="flex justify-center mb-3">
                  <svg data-svg-id="SVG_4" className="w-8 h-8 text-[#9a94de]/60" viewBox="0 0 32 32">
            <g transform="matrix(1 0 0 1 0 0)">
              <g style={{  }}>
                <g transform="matrix(1.33 0 0 1.33 16 16)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(154,148,222)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -12)" d="M 3 20 L 3 4 C 3 3.20435 3.3163 2.44152 3.87891 1.87891 C 4.44152 1.3163 5.20435 1 6 1 L 15 1 L 15.0986 1.00488 C 15.3276 1.02757 15.5429 1.12883 15.707 1.29297 L 20.707 6.29297 C 20.8946 6.48051 21 6.73478 21 7 L 21 20 C 21 20.7957 20.6837 21.5585 20.1211 22.1211 C 19.5585 22.6837 18.7957 23 18 23 L 6 23 C 5.20435 23 4.44152 22.6837 3.87891 22.1211 C 3.3163 21.5585 3 20.7956 3 20 Z M 5 20 C 5 20.2652 5.10543 20.5195 5.29297 20.707 C 5.48051 20.8946 5.73478 21 6 21 L 18 21 C 18.2652 21 18.5195 20.8946 18.707 20.707 C 18.8946 20.5195 19 20.2652 19 20 L 19 7.41406 L 14.5859 3 L 6 3 C 5.73478 3 5.48051 3.10543 5.29297 3.29297 C 5.10543 3.48051 5 3.73478 5 4 L 5 20 Z" strokeLinecap="round" />
                </g>
                <g transform="matrix(1.33 0 0 1.33 22.67 6.67)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(154,148,222)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-17, -5)" d="M 13 6 L 13 2 C 13 1.44772 13.4477 1 14 1 C 14.5523 1 15 1.44772 15 2 L 15 6 C 15 6.26522 15.1054 6.51949 15.293 6.70703 C 15.4805 6.89457 15.7348 7 16 7 L 20 7 C 20.5523 7 21 7.44772 21 8 C 21 8.55228 20.5523 9 20 9 L 16 9 C 15.2044 9 14.4415 8.6837 13.8789 8.12109 C 13.3163 7.55848 13 6.79565 13 6 Z" strokeLinecap="round" />
                </g>
                <g transform="matrix(1.33 0 0 1.33 16 20)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(154,148,222)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -15)" d="M 14.3692 12.2246 C 14.7619 11.9043 15.3409 11.9269 15.707 12.293 C 16.0732 12.6591 16.0958 13.2381 15.7754 13.6309 L 15.707 13.707 L 11.707 17.707 C 11.3409 18.0732 10.7619 18.0958 10.3692 17.7754 L 10.293 17.707 L 8.29298 15.707 L 8.22462 15.6309 C 7.90427 15.2381 7.92686 14.6591 8.29298 14.293 C 8.65909 13.9269 9.2381 13.9043 9.63087 14.2246 L 9.70704 14.293 L 11 15.5859 L 14.293 12.293 L 14.3692 12.2246 Z" strokeLinecap="round" />
                </g>
              </g>
            </g>
          </svg>
                </div>
                <div className="w-full h-1.5 bg-[#f3f4f6] rounded-full"></div>
                <div className="w-full h-1.5 bg-[#f3f4f6] rounded-full"></div>
                <div className="w-[75%] h-1.5 bg-[#f3f4f6] rounded-full"></div>
              </div>

              {/* Action Button */}
              <div className="absolute top-[206px] left-[214px] w-16 h-16 bg-[#9a94de] rounded-full border-4 border-white shadow-[0px_8px_17px_0px_#171a1f26,_0px_0px_2px_0px_#171a1f1f] flex items-center justify-center z-20">
                <svg data-svg-id="SVG_5" className="w-[37px] h-[37px] text-white -rotate-[157.51deg]" viewBox="0 0 37 37">
            <g transform="matrix(1 0 0 1 0 0)">
              <g style={{  }}>
                <g transform="matrix(1.54 0 0 1.54 18.5 11.56)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(255,255,255)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -7.5)" d="M 2 12 C 2 9.34784 3.05335 6.80407 4.92871 4.92871 C 6.80407 3.05335 9.34784 2 12 2 L 12.0039 2 L 12.5225 2.01465 C 14.9359 2.14027 17.2373 3.07585 19.0537 4.66992 L 19.4473 5.0332 L 21.707 7.29297 L 21.7754 7.36914 C 22.0957 7.76191 22.0731 8.34092 21.707 8.70703 C 21.3409 9.07315 20.7619 9.09574 20.3691 8.77539 L 20.293 8.70703 L 18.0449 6.45898 L 17.7344 6.17285 C 16.1505 4.78301 14.1137 4.00816 11.9971 4 C 9.87639 4.00078 7.84237 4.84317 6.34277 6.34277 C 4.84248 7.84306 4 9.87827 4 12 C 4 12.5523 3.55228 13 3 13 C 2.44772 13 2 12.5523 2 12 Z" strokeLinecap="round" />
                </g>
                <g transform="matrix(1.54 0 0 1.54 28.52 8.48)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(255,255,255)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-18.5, -5.5)" d="M 20 3 C 20 2.44772 20.4477 2 21 2 C 21.5523 2 22 2.44772 22 3 L 22 8 C 22 8.55228 21.5523 9 21 9 L 16 9 C 15.4477 9 15 8.55228 15 8 C 15 7.44772 15.4477 7 16 7 L 20 7 L 20 3 Z" strokeLinecap="round" />
                </g>
                <g transform="matrix(1.54 0 0 1.54 18.5 25.44)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(255,255,255)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -16.5)" d="M 20 12 C 20 11.4477 20.4477 11 21 11 C 21.5523 11 22 11.4477 22 12 C 22 14.6522 20.9467 17.1959 19.0713 19.0713 C 17.1959 20.9467 14.6522 22 12 22 L 11.9961 22 C 9.39525 21.9902 6.89243 21.038 4.9463 19.3301 L 4.55274 18.9668 L 2.29298 16.707 L 2.22462 16.6309 C 1.90427 16.2381 1.92686 15.6591 2.29298 15.293 C 2.65909 14.9269 3.2381 14.9043 3.63087 15.2246 L 3.70704 15.293 L 5.95509 17.541 L 6.26563 17.8271 C 7.84923 19.2168 9.88572 19.9906 12.002 19.999 C 14.123 19.9985 16.1574 19.1571 17.6572 17.6572 C 19.1575 16.1569 20 14.1217 20 12 Z" strokeLinecap="round" />
                </g>
                <g transform="matrix(1.54 0 0 1.54 8.48 28.52)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(255,255,255)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-5.5, -18.5)" d="M 2 21 L 2 16 L 2.00488 15.8975 C 2.05621 15.3933 2.48232 15 3 15 L 8 15 C 8.55228 15 9 15.4477 9 16 C 9 16.5523 8.55228 17 8 17 L 4 17 L 4 21 C 4 21.5523 3.55228 22 3 22 C 2.44772 22 2 21.5523 2 21 Z" strokeLinecap="round" />
                </g>
              </g>
            </g>
          </svg>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#dee1e6]/40 px-4 lg:px-[144px] py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-sm text-[#565d6d]">© 2026 SiroMix — All rights reserved.</span>
        <div className="flex items-center gap-4 text-sm text-[#565d6d]">
          <a href="#" className="hover:text-[#171a1f] transition-colors">Terms</a>
          <span className="text-[#dee1e6]">•</span>
          <a href="#" className="hover:text-[#171a1f] transition-colors">Privacy</a>
          <span className="text-[#dee1e6]">•</span>
          <a href="#" className="hover:text-[#171a1f] transition-colors">Contact</a>
        </div>
      </footer>
    </div>
  );
}
