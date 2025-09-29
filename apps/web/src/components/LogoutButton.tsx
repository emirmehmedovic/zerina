"use client";

import { LogOut } from "lucide-react";
import { API_URL } from "@/lib/api";
import { useRouter } from "next/navigation";

interface LogoutButtonProps {
  className?: string;
}

export default function LogoutButton({ className = "" }: LogoutButtonProps) {
  const router = useRouter();
  
  const handleLogout = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      
      if (res.ok) {
        // Redirect to home page after successful logout
        router.push("/");
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <button 
      onClick={handleLogout}
      className={`flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors ${className}`}
    >
      <LogOut className="h-4 w-4 mr-2" />
      Logout
    </button>
  );
}
