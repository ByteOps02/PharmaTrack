import { GalleryVerticalEnd } from "lucide-react";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="bg-white min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col gap-6">

        <a href="/" className="flex items-center gap-2 self-center font-medium text-black">
          <div className="bg-black text-white flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-4" />
          </div>
          MedFlow
        </a>

        <LoginForm />
      </div>
    </div>
  );
}
