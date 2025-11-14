// src/pages/Login.tsx
import React from "react";
import LoginForm from "../components/login-form";
import { GalleryVerticalEnd } from "lucide-react";

export default function Login() {
  return (
    <div className="min-h-screen flex">
      {/* LEFT SECTION */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white w-12 h-12 rounded-xl flex items-center justify-center">
              <GalleryVerticalEnd />
            </div>
            <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              MedFlow
            </span>
          </div>

          {/* Text */}
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome back</h1>
          <p className="text-gray-600 mb-8">Enter your credentials to continue</p>

          {/* Form */}
          <LoginForm />
        </div>
      </div>

      {/* RIGHT SECTION */}
      <div className="hidden lg:block lg:w-1/2 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600"></div>
    </div>
  );
}
