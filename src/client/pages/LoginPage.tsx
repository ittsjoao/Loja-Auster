import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Loader2, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (user) {
    navigate("/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        navigate("/");
      } else {
        toast({
          title: "Erro ao entrar",
          description: "Email ou senha incorretos",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Erro",
        description: "Falha ao conectar com o servidor",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#051D3C] via-[#082B58] to-[#1d4ed8] animate-gradient p-4">
      <div className="w-full max-w-md">
        {/* Card glassmorphism */}
        <div className="glass rounded-2xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img src="/logo_branca.svg" alt="Loja Auster" className="h-12" />
          </div>

          {/* Titulo */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white">
              Bem-vindo de volta
            </h1>
            <p className="text-white/60 mt-2 text-sm">
              Entre com sua conta para acessar a loja
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/80 text-sm">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-light-blue focus:ring-light-blue/30"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/80 text-sm">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-light-blue focus:ring-light-blue/30"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-default-blue to-dark-blue hover:from-default-blue/90 hover:to-dark-blue/90 text-white font-semibold py-5 transition-all duration-200"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLScLTasPuLhNVhvw96hxIXo_OIS2ayGGGjKuS_IfsvCGFk6gIQ/viewform"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/50 hover:text-white/80 text-xs transition-colors"
            >
              Precisa de ajuda? Abra um chamado
            </a>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 text-white/30 text-xs">
            <span>Powered by</span>
            <a
              href="https://austercontabil.com.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-50 hover:opacity-80 transition-opacity"
            >
              <img
                src="/logo_branca.svg"
                alt="Auster"
                className="h-8"
              />
            </a>
            <a
              href="https://github.com/ittsjoao/Loja-Auster"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 text-white/30 hover:text-white/60 transition-colors"
              title="Ver no GitHub"
            >
              <Github className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
