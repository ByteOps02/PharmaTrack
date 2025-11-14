// src/pages/Signup.tsx
import React from "react";
import SignupForm from "../components/signup-form";
import { GalleryVerticalEnd } from "lucide-react";

export default function Signup() {
  return (
    <div className="min-h-screen flex">
      {/* LEFT */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-gradient-to-br from-teal-600 to-cyan-600 w-12 h-12 text-white rounded-xl flex items-center justify-center">
              <GalleryVerticalEnd />
            </div>
            <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600">
              MedFlow
            </span>
          </div>

          <h1 className="text-4xl font-bold mb-2">Create an account</h1>
          <p className="text-gray-600 mb-8">Join our community</p>

          <SignupForm />
        </div>
      </div>

      {/* RIGHT */}
      <div className="hidden lg:block lg:w-1/2 bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-600"></div>
    </div>
  );
}
