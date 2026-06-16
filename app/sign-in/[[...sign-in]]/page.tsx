import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
      <SignIn
        appearance={{
          elements: {
            card: "shadow-md border border-gray-200",
            headerTitle: "text-2xl font-bold text-gray-900",
            headerSubtitle: "text-gray-500",
            formButtonPrimary:
              "bg-blue-600 hover:bg-blue-700 text-sm normal-case",
            footerActionLink: "text-blue-600 hover:text-blue-700",
          },
        }}
      />
    </div>
  );
}
