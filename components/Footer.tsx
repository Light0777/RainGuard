import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="border-t border-[#ebebeb] bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2.5">
            <Image
              src="/assets/icon.png"
              alt="RainGuard"
              width={28}
              height={28}
              className="rounded-md"
            />
            <span className="text-sm font-semibold text-[#171717]">RainGuard</span>
          </div>
          <div className="flex gap-6">
            <Link href="/" className="text-sm text-[#4d4d4d] hover:text-[#171717] transition-colors">
              Home
            </Link>
            <Link href="/dashboard" className="text-sm text-[#4d4d4d] hover:text-[#171717] transition-colors">
              Dashboard
            </Link>
            <Link href="/locations" className="text-sm text-[#4d4d4d] hover:text-[#171717] transition-colors">
              Locations
            </Link>
          </div>
          <p className="text-xs text-[#888]">
            &copy; {new Date().getFullYear()} RainGuard.
          </p>
        </div>
      </div>
    </footer>
  );
}
