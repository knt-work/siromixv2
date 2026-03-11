/**
 * Login Page
 * 
 * Simulated Google OAuth login flow.
 * Exact 1:1 implementation from html/SiroMix - Login Screen/src/App.tsx
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui/Spinner';
import { useAuthStore } from '@/lib/state/auth-store';
import { simulateGoogleOAuth } from '@/lib/simulation/oauth';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, redirectPath, setRedirectPath } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const destination = redirectPath || '/';
      setRedirectPath(null);
      router.push(destination);
    }
  }, [isAuthenticated, redirectPath, router, setRedirectPath]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate Google OAuth flow (1-2 second delay)
      const user = await simulateGoogleOAuth();
      
      // Update auth store with Trieu Kiem data
      login(user);
      
      // Redirect will happen via useEffect above
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-white">
      <div className="w-full max-w-[560px] bg-white border border-[#dee1e6]/60 rounded-lg shadow-[0px_2px_5px_0px_#171a1f17,_0px_0px_2px_0px_#171a1f1f] p-8 md:p-[33px_33px_0_33px] flex flex-col items-center">
        <h1 className="text-[28px] leading-[39px] font-bold tracking-[-0.7px] text-center mb-3 text-[#171a1f]">
          Đăng nhập vào SiroMix
        </h1>
        
        <p className="text-base leading-6 text-[#565d6d] text-center max-w-[426px] mb-10">
          Đăng nhập bằng tài khoản Google của bạn để kết nối với SiroMix và quản lý các đề thi.
        </p>

        <button 
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full h-14 bg-[#9a94de] hover:bg-[#8a84ce] disabled:bg-[#9a94de]/50 text-white rounded-md shadow-[0px_2px_5px_0px_#171a1f17,_0px_0px_2px_0px_#171a1f1f] flex items-center justify-center relative transition-all active:scale-[0.99] disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Spinner size="md" variant="white" />
          ) : (
            <>
              <div className="absolute left-4 w-5 h-5 flex items-center justify-center">
                <svg 
                  data-type="IMAGE" 
                  viewBox="0 0 20 20" 
                  className="w-5 h-5" 
                  data-svg-id="SVG_2"
                >
              <g transform="matrix(1 0 0 1 0 0)">
                <g style={{  }}>
                  <g transform="matrix(1 0 0 1 10 10)">
                    <g style={{  }}>
                      <g transform="matrix(0.83 0 0 0.83 4.4 2.64)">
                        <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(255,255,255)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-17.28, -15.17)" d="M 22.56 12.25 C 22.56 11.47 22.49 10.72 22.36 10 L 12 10 L 12 14.26 L 17.92 14.26 C 17.66 15.629999999999999 16.880000000000003 16.79 15.71 17.57 L 15.71 20.34 L 19.28 20.34 C 21.36 18.42 22.560000000000002 15.6 22.560000000000002 12.25 z" strokeLinecap="round" />
                      </g>
                      <g transform="matrix(0.83 0 0 0.83 -1.06 5.46)">
                        <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(255,255,255)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-10.73, -18.55)" d="M 12 23 C 14.97 23 17.46 22.02 19.28 20.34 L 15.71 17.57 C 14.73 18.23 13.48 18.63 12 18.63 C 9.14 18.63 6.71 16.7 5.84 14.099999999999998 L 2.18 14.099999999999998 L 2.18 16.939999999999998 C 3.99 20.53 7.7 23 12 23 z" strokeLinecap="round" />
                      </g>
                      <g transform="matrix(0.83 0 0 0.83 -7.15 0)">
                        <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(255,255,255)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-3.42, -12)" d="M 5.84 14.09 C 5.62 13.43 5.49 12.73 5.49 12 C 5.49 11.27 5.62 10.57 5.84 9.91 L 5.84 7.07 L 2.18 7.07 C 1.43 8.55 1 10.22 1 12 C 1 13.78 1.43 15.45 2.1799999999999997 16.93 L 5.029999999999999 14.709999999999999 L 5.84 14.09 z" strokeLinecap="round" />
                      </g>
                      <g transform="matrix(0.83 0 0 0.83 -1.03 -5.45)">
                        <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(255,255,255)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-10.77, -5.46)" d="M 12 5.38 C 13.620000000000001 5.38 15.06 5.9399999999999995 16.21 7.02 L 19.36 3.8699999999999997 C 17.45 2.09 14.97 1 12 1 C 7.7 1 3.99 3.47 2.18 7.07 L 5.84 9.91 C 6.71 7.3100000000000005 9.14 5.38 12 5.38 z" strokeLinecap="round" />
                      </g>
                    </g>
                  </g>
                </g>
              </g>
            </svg>
              </div>
              <span className="text-sm font-semibold">Tiếp tục với Google</span>
            </>
          )}
        </button>

        {error && (
          <div className="mt-4 w-full p-3 bg-[#d3595e]/10 border border-[#d3595e]/20 rounded-md">
            <p className="text-sm text-[#d3595e] text-center">{error}</p>
          </div>
        )}

        <div className="flex items-center justify-center gap-1.5 mt-4 mb-12">
          <svg 
            data-type="ICON" 
            data-icon="Lucide_lock_Outlined" 
            className="w-3 h-3 text-[#565d6d] opacity-70" 
            width="12" 
            height="12" 
            viewBox="0 0 12 12" 
            data-svg-id="SVG_3"
          >
        <g transform="matrix(1 0 0 1 0 0)">
          <g style={{  }}>
            <g transform="matrix(0.5 0 0 0.5 6 8.25)">
              <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(86,93,109)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -16.5)" d="M 20 13 C 20 12.4477 19.5523 12 19 12 L 5 12 C 4.44772 12 4 12.4477 4 13 L 4 20 C 4 20.5523 4.44772 21 5 21 L 19 21 C 19.5523 21 20 20.5523 20 20 L 20 13 Z M 22 20 C 22 21.6569 20.6569 23 19 23 L 5 23 C 3.34315 23 2 21.6569 2 20 L 2 13 C 2 11.3431 3.34315 10 5 10 L 19 10 C 20.6569 10 22 11.3431 22 13 L 22 20 Z" strokeLinecap="round" />
            </g>
            <g transform="matrix(0.5 0 0 0.5 6 3.25)">
              <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(86,93,109)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -6.5)" d="M 16 11 L 16 7 C 16 5.93913 15.5783 4.92202 14.8281 4.17188 C 14.078 3.42173 13.0609 3 12 3 C 10.9391 3 9.92202 3.42173 9.17188 4.17188 C 8.42173 4.92202 8 5.93913 8 7 L 8 11 C 8 11.5523 7.55228 12 7 12 C 6.44772 12 6 11.5523 6 11 L 6 7 C 6 5.4087 6.63259 3.88303 7.75781 2.75781 C 8.88303 1.63259 10.4087 1 12 1 C 13.5913 1 15.117 1.63259 16.2422 2.75781 C 17.3674 3.88303 18 5.4087 18 7 L 18 11 C 18 11.5523 17.5523 12 17 12 C 16.4477 12 16 11.5523 16 11 Z" strokeLinecap="round" />
            </g>
          </g>
        </g>
      </svg>
          <span className="text-[12px] leading-4 text-[#565d6d]">
            Đăng nhập an toàn bằng Google để liên kết tài khoản với SiroMix.
          </span>
        </div>

        <div className="w-full border-t border-[#dee1e6]/40 pt-6 pb-6 text-center">
          <p className="text-sm text-[#565d6d]">
            Cần hỗ trợ? <a href="/support" className="text-[#9A94DE] font-medium hover:underline">Liên hệ đội ngũ hỗ trợ</a>
          </p>
        </div>
      </div>
    </div>
  );
}
