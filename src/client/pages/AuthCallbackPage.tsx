import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { authService } from "@/services/auth";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { refreshUser } = useAuth();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const uid = params.get("uid");
    if (!uid) {
      navigate("/login?authError=authentik", { replace: true });
      return;
    }

    authService.setSsoUserId(uid);
    refreshUser()
      .then(() => navigate("/", { replace: true }))
      .catch(() => navigate("/login?authError=authentik", { replace: true }));
  }, [params, navigate, refreshUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#051D3C] via-[#082B58] to-[#1d4ed8] p-4">
      <div className="flex items-center gap-3 text-white">
        <Loader2 className="h-5 w-5 animate-spin" />
        Entrando...
      </div>
    </div>
  );
}
