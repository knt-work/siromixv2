/**
 * Navbar Template Component
 * 
 * Application header with branding, navigation, and authentication controls.
 * Updated with exact Visily specifications per contracts/pages.md
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import SiroMixLogo from '@/components/ui/SiroMixLogo';
import { Icon } from '@/components/ui/Icon';
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
    <nav className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
      <div className="px-4 lg:px-32">
        <div className="flex justify-between items-center h-16">
          {/* Left: Branding + Navigation */}
          <div className="flex items-center gap-8">
            {/* Branding */}
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <SiroMixLogo className="w-7 h-7" />
              <span className="text-xl font-semibold text-text-dark">SiroMix</span>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/tasks" className="text-sm font-medium text-text-gray hover:text-text-dark transition-colors">
                Chức năng
              </Link>
              <Link href="/guide" className="text-sm font-medium text-text-gray hover:text-text-dark transition-colors">
                Hướng dẫn
              </Link>
            </nav>
          </div>

          {/* Auth Section */}
          <div className="flex items-center gap-4">
            {user ? (
              // Authenticated: Avatar with dropdown
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  aria-expanded={isDropdownOpen}
                  aria-haspopup="true"
                >
                  <Avatar
                    src={user.avatar_url || undefined}
                    alt={user.full_name}
                    fallbackText={user.full_name}
                    size="md"
                  />
                  <span className="hidden md:block text-sm font-medium text-text-dark">
                    {user.full_name}
                  </span>
                  <Icon 
                    icon="lucide:chevron-down"
                    size={16}
                    className={`text-text-gray transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsDropdownOpen(false)}
                    />
                    
                    {/* Menu */}
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-sm border border-border py-1 z-20">
                      <div className="px-4 py-2 border-b border-border/40">
                        <p className="text-sm font-medium text-text-dark">{user.full_name}</p>
                        <p className="text-xs text-text-gray truncate">{user.email}</p>
                      </div>
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          onLogout?.();
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-text-dark hover:bg-background-gray transition-colors flex items-center gap-2"
                      >
                        <Icon icon="lucide:log-out" size={16} className="text-text-gray" />
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
        </div>
      </div>
    </nav>
  );
};
