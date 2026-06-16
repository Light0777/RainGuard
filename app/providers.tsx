"use client";

import { ClerkProvider } from "@clerk/nextjs";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#a6cf44",
          borderRadius: "8px",
        },
        elements: {
          formButtonPrimary: "bg-[#a6cf44] hover:bg-[#8ab332] text-[#171717] rounded-md shadow-none",
          card: "w-full",
          headerTitle: "text-[#171717] text-[20px] font-semibold",
          headerSubtitle: "text-[#4d4d4d]",
          socialButtonsBlockButton: "border border-[#ebebeb] hover:bg-[#fafafa] text-[#171717] rounded-md",
          formFieldLabel: "text-[#4d4d4d] text-[13px] font-medium",
          formFieldInput: "border border-[#ebebeb] rounded-md text-[14px] text-[#171717] h-10",
          dividerLine: "bg-[#ebebeb]",
          dividerText: "text-[#888]",
          footerActionLink: "text-[#a6cf44] hover:text-[#8ab332]",
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
