"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useAuth, UserButton, SignInButton, SignUpButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";

const navigation = [
  { name: "Home", href: "/" },
  { name: "Dashboard", href: "/dashboard" },
  { name: "Locations", href: "/locations" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isSignedIn } = useAuth();
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-[#ebebeb] bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/assets/icon.png"
              alt="RainGuard"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="text-[15px] font-semibold tracking-tight text-[#171717]">RainGuard</span>
          </Link>
          <div className="hidden md:flex md:items-center md:gap-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`rounded-full px-3 py-1.5 text-[14px] font-medium transition-colors ${
                    isActive
                      ? "bg-[#f2fbe2] text-[#8ab332]"
                      : "text-[#4d4d4d] hover:bg-[#f5f5f5] hover:text-[#171717]"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="hidden items-center gap-3 md:flex">
          {isSignedIn ? (
            <>
              <Link
                href="/profile"
                className="rounded-full px-3 py-1.5 text-[14px] font-medium text-[#4d4d4d] hover:bg-[#f5f5f5] hover:text-[#171717] transition-colors"
              >
                Profile
              </Link>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-7 w-7",
                  },
                }}
              />
            </>
          ) : (
            <>
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="inline-flex h-7 items-center rounded-md border border-[#ebebeb] px-3 text-[13px] font-medium text-[#171717] hover:bg-[#f5f5f5] transition-colors"
                >
                  Log In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button
                  type="button"
                  className="inline-flex h-7 items-center rounded-md bg-[#a6cf44] px-3 text-[13px] font-medium text-[#171717] hover:bg-[#8ab332] transition-colors"
                >
                  Sign Up
                </button>
              </SignUpButton>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-[#4d4d4d] hover:bg-[#f5f5f5] md:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>
      {mobileOpen && (
        <div className="border-t border-[#ebebeb] bg-white px-4 py-4 space-y-1 md:hidden">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`block rounded-md px-3 py-2 text-[14px] font-medium transition-colors ${
                  isActive ? "bg-[#f2fbe2] text-[#8ab332]" : "text-[#4d4d4d] hover:bg-[#f5f5f5]"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
          <div className="pt-2 mt-2 border-t border-[#ebebeb]">
            {isSignedIn ? (
              <div className="flex items-center gap-3 px-3 py-2">
                <UserButton
                  appearance={{
                    elements: { avatarBox: "h-7 w-7" },
                  }}
                />
                <Link
                  href="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="text-[14px] font-medium text-[#4d4d4d]"
                >
                  Profile
                </Link>
              </div>
            ) : (
              <div className="space-y-2 px-3 pt-2">
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className="w-full rounded-md border border-[#ebebeb] px-4 py-2 text-[14px] font-medium text-[#171717] hover:bg-[#f5f5f5] transition-colors"
                  >
                    Log In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button
                    type="button"
                    className="w-full rounded-md bg-[#a6cf44] px-4 py-2 text-[14px] font-medium text-[#171717] hover:bg-[#8ab332] transition-colors"
                  >
                    Sign Up
                  </button>
                </SignUpButton>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
