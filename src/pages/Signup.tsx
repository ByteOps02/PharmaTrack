import { GalleryVerticalEnd } from "lucide-react";
import { SignupForm } from "@/components/signup-form";

export default function SignupPage() {
  return (
    <div className="bg-white flex min-h-screen flex-col items-center justify-center p-6">
      <div className="flex w-full max-w-sm flex-col gap-6">

        <a href="/" className="flex items-center gap-2 self-center font-medium text-black">
          <div className="bg-black text-white flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-4" />
          </div>
          MedFlow
        </a>

        <SignupForm />
      </div>
    </div>
  );
}
