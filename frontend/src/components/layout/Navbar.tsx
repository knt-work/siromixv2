/**
 * Navbar Template Component
 * 
 * Application header with branding, navigation, and authentication controls.
 * Exact 1:1 implementation from html/SiroMix - Homepage/src/App.tsx header
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { UI_TEXT } from '@/constants/content';
import type { User } from '@/types';

export interface NavbarProps {
  user: User | null;
  onLogin?: () => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogin,
  onLogout,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-[#dee1e6]/40 px-4 lg:px-[144px] flex items-center justify-between">
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#9a94de]/10 rounded-[10px] flex items-center justify-center">
            <svg data-svg-id="SVG_1" className="w-[17px] h-[17px] text-[#9a94de]" viewBox="0 0 17 17">
          <g transform="matrix(1 0 0 1 0 0)">
            <g style={{  }}>
              <g transform="matrix(0.71 0 0 0.71 8.51 4.96)">
                <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(154,148,222)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12.01, -7)" d="M 1.00348 6.99475 C 1.00353 6.60711 1.11606 6.22772 1.3277 5.90295 C 1.53745 5.58123 1.83572 5.32645 2.1861 5.16956 L 10.7554 1.27014 L 10.9029 1.20764 C 11.2518 1.07053 11.6237 0.99969 11.9996 0.999634 C 12.4291 0.999634 12.8539 1.09195 13.2447 1.27014 L 21.8345 5.1803 C 22.1849 5.33718 22.4822 5.59098 22.692 5.91272 C 22.9037 6.2375 23.0161 6.61682 23.0162 7.00452 C 23.0162 7.39238 22.9038 7.77237 22.692 8.09729 C 22.482 8.41928 22.1833 8.67286 21.8326 8.82971 L 21.8336 8.83069 L 13.2545 12.7291 L 13.2554 12.7301 C 12.9133 12.8861 12.545 12.9757 12.1705 12.9957 L 12.0103 13.0006 C 11.6343 13.0006 11.2617 12.9298 10.9127 12.7926 L 10.7652 12.7301 L 2.18512 8.81995 C 1.83533 8.66301 1.53718 8.40883 1.3277 8.08752 C 1.11587 7.76261 1.00348 7.38262 1.00348 6.99475 Z M 3.0152 6.99963 L 11.5943 10.9098 L 11.6949 10.9489 C 11.7964 10.9826 11.9029 11.0006 12.0103 11.0006 L 12.1168 10.9948 C 12.2232 10.9833 12.3276 10.9544 12.4254 10.9098 L 21.0064 7.0094 L 21.0162 7.00452 L 21.0054 7.00061 L 12.4156 3.09045 L 12.4146 3.08948 C 12.2845 3.03019 12.1426 2.99963 11.9996 2.99963 C 11.8925 2.99968 11.7863 3.01684 11.6851 3.05042 L 11.5855 3.08948 L 11.5845 3.09045 L 3.00348 6.99475 L 3.0152 6.99963 Z" strokeLinecap="round" />
              </g>
              <g transform="matrix(0.71 0 0 0.71 8.5 10.27)">
                <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(154,148,222)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -14.5)" d="M 21.9922 11 C 22.5098 10.996 22.9389 11.386 22.9941 11.8896 L 23 11.9922 L 22.9961 12.1367 C 22.9743 12.4742 22.867 12.8019 22.6836 13.0879 C 22.4741 13.4144 22.1741 13.6729 21.8203 13.832 L 13.2441 17.7305 L 13.2422 17.7314 C 12.8535 17.9074 12.4315 17.998 12.0049 17.998 C 11.5782 17.998 11.1563 17.9074 10.7676 17.7314 L 10.7666 17.7305 L 2.16602 13.8203 L 2.16016 13.8174 C 1.813 13.6567 1.51909 13.3997 1.31348 13.0771 C 1.10795 12.7546 0.99906 12.3795 1.00001 11.9971 L 1.00587 11.8955 C 1.05825 11.3913 1.48511 10.9987 2.00294 11 C 2.55484 11.0016 3.00011 11.4501 2.99903 12.002 L 11.5918 15.9092 L 11.5928 15.9092 C 11.7223 15.9678 11.8628 15.998 12.0049 15.998 C 12.1467 15.998 12.2868 15.9675 12.416 15.9092 L 20.9961 12.0098 L 21 12.0078 L 21.0039 11.9053 C 21.0513 11.4008 21.4745 11.0041 21.9922 11 Z" strokeLinecap="round" />
              </g>
              <g transform="matrix(0.71 0 0 0.71 8.5 13.81)">
                <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(154,148,222)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -19.5)" d="M 21.9922 16 C 22.5098 15.996 22.9389 16.386 22.9941 16.8896 L 23 16.9922 L 22.9961 17.1367 C 22.9743 17.4742 22.867 17.8019 22.6836 18.0879 C 22.4741 18.4144 22.1741 18.6729 21.8203 18.832 L 13.2441 22.7305 L 13.2422 22.7314 C 12.8535 22.9074 12.4315 22.998 12.0049 22.998 C 11.5782 22.998 11.1563 22.9074 10.7676 22.7314 L 10.7666 22.7305 L 2.16602 18.8203 L 2.16016 18.8174 C 1.813 18.6567 1.51909 18.3997 1.31348 18.0771 C 1.10795 17.7546 0.99906 17.3795 1.00001 16.9971 L 1.00587 16.8955 C 1.05825 16.3913 1.48511 15.9987 2.00294 16 C 2.55484 16.0016 3.00011 16.4501 2.99903 17.002 L 11.5918 20.9092 L 11.5928 20.9092 C 11.7223 20.9678 11.8628 20.998 12.0049 20.998 C 12.1467 20.998 12.2868 20.9675 12.416 20.9092 L 20.9961 17.0098 L 21 17.0078 L 21.0039 16.9053 C 21.0513 16.4008 21.4745 16.0041 21.9922 16 Z" strokeLinecap="round" />
              </g>
            </g>
          </g>
        </svg>
          </div>
          <span className="text-[20px] font-bold text-[#171a1f] tracking-[-0.5px]">SiroMix</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/tasks" className="text-sm font-medium text-[#565d6d] hover:text-[#171a1f] transition-colors">
            Chức năng
          </Link>
          <Link href="/guide" className="text-sm font-medium text-[#565d6d] hover:text-[#171a1f] transition-colors">
            Hướng dẫn
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {user ? (
          // Authenticated: Avatar with dropdown
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2"
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
            >
              <div className="w-10 h-10 rounded-full overflow-hidden shadow-[0px_2px_5px_0px_#171a1f17,_0px_0px_2px_0px_#171a1f1f]">
                <Avatar
                  src={user.avatar_url ?? undefined}
                  alt={user.full_name}
                  size="md"
                  fallbackText={user.full_name}
                />
              </div>
              <span className="hidden sm:block text-sm font-medium text-[#171a1f]">
                {user.full_name}
              </span>
              <svg data-svg-id="SVG_2" className="w-4 h-4 text-[#565d6d]" viewBox="0 0 16 16">
        <g transform="matrix(1 0 0 1 0 0)">
          <g style={{  }}>
            <g transform="matrix(0.67 0 0 0.67 8 8)">
              <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(86,93,109)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -12)" d="M 17.293 8.29302 C 17.6835 7.90249 18.3165 7.90249 18.707 8.29302 C 19.0976 8.68354 19.0976 9.31655 18.707 9.70708 L 12.707 15.7071 C 12.3165 16.0976 11.6835 16.0976 11.293 15.7071 L 5.29298 9.70708 L 5.22462 9.63091 C 4.90427 9.23813 4.92686 8.65913 5.29298 8.29302 C 5.65909 7.9269 6.2381 7.90431 6.63087 8.22466 L 6.70704 8.29302 L 12 13.586 L 17.293 8.29302 Z" strokeLinecap="round" />
            </g>
          </g>
        </g>
      </svg>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsDropdownOpen(false)}
                  onKeyDown={(e) => e.key === 'Escape' && setIsDropdownOpen(false)}
                  role="button"
                  tabIndex={0}
                  aria-label="Đóng menu"
                />
                
                {/* Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-[0px_2px_5px_0px_#171a1f17,_0px_0px_2px_0px_#171a1f1f] border border-[#dee1e6] py-1 z-20">
                  <div className="px-4 py-2 border-b border-[#dee1e6]/40">
                    <p className="text-sm font-medium text-[#171a1f]">{user.full_name}</p>
                    <p className="text-xs text-[#565d6d] truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onLogout?.();
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-[#171a1f] hover:bg-[#f3f4f6] transition-colors flex items-center gap-2"
                  >
                    <svg data-svg-id="SVG_LOGOUT" className="w-4 h-4 text-[#565d6d]" viewBox="0 0 16 16">
        <g transform="matrix(1 0 0 1 0 0)">
          <g>
            <g transform="matrix(0.67 0 0 0.67 8 8)">
              <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(86,93,109)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -12)" d="M 5 4 C 5 3.44772 5.44772 3 6 3 L 12 3 C 13.5913 3 14.9174 4.01892 15.3929 5.42859 C 15.7141 6.40631 16 7.77283 16 9 C 16 10.2272 15.7141 11.5937 15.3929 12.5714 C 14.9174 13.9811 13.5913 15 12 15 L 6 15 C 5.44772 15 5 14.5523 5 14 C 5 13.4477 5.44772 13 6 13 L 12 13 C 12.7413 13 13.3326 12.5189 13.6071 11.7286 C 13.8609 11.0063 14 9.97283 14 9 C 14 8.02717 13.8609 6.99369 13.6071 6.27141 C 13.3326 5.48108 12.7413 5 12 5 L 6 5 C 5.44772 5 5 4.55228 5 4 Z M 8.70711 7.29289 C 9.09763 7.68342 9.09763 8.31658 8.70711 8.70711 L 8.41421 9 L 14 9 C 14.5523 9 15 9.44771 15 10 C 15 10.5523 14.5523 11 14 11 L 8.41421 11 L 8.70711 11.2929 C 9.09763 11.6834 9.09763 12.3166 8.70711 12.7071 C 8.31658 13.0976 7.68342 13.0976 7.29289 12.7071 L 4.29289 9.70711 C 3.90237 9.31658 3.90237 8.68342 4.29289 8.29289 L 7.29289 5.29289 C 7.68342 4.90237 8.31658 4.90237 8.70711 5.29289 C 9.09763 5.68342 9.09763 6.31658 8.70711 6.70711 L 8.41421 7 L 14 7 C 14.5523 7 15 7.44772 15 8 C 15 8.55228 14.5523 9 14 9 L 8.41421 9 L 8.70711 8.70711 C 9.09763 8.31658 9.09763 7.68342 8.70711 7.29289 Z" strokeLinecap="round" />
            </g>
          </g>
        </g>
      </svg>
                    {UI_TEXT.buttons.logout}
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          // Not authenticated: Login button (Vietnamese)
          <Button
            variant="primary"
            size="sm"
            onClick={onLogin}
          >
            {UI_TEXT.buttons.login}
          </Button>
        )}
      </div>
    </header>
  );
};
