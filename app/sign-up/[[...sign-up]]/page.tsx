import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
      <SignUp
        appearance={{
          elements: {
            card: "shadow-card border border-[#ebebeb] rounded-xl",
            headerTitle: "text-[20px] font-semibold text-[#171717]",
            headerSubtitle: "text-[#4d4d4d] text-[14px]",
            formButtonPrimary: "bg-[#a6cf44] hover:bg-[#8ab332] text-[#171717] rounded-md text-[14px] font-medium normal-case",
            footerActionLink: "text-[#a6cf44] hover:text-[#8ab332]",
            formFieldLabel: "text-[#4d4d4d] text-[13px] font-medium",
            formFieldInput: "border border-[#ebebeb] rounded-md text-[14px] h-10",
            socialButtonsBlockButton: "border border-[#ebebeb] hover:bg-[#fafafa] rounded-md text-[14px] font-medium",
            dividerLine: "bg-[#ebebeb]",
            dividerText: "text-[#888] text-[12px]",
          },
        }}
      />
    </div>
  );
}
