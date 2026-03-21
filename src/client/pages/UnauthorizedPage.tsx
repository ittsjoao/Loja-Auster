import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

export default function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center">
        <ShieldAlert className="h-16 w-16 text-red-400 mb-4" />
        <h1 className="text-3xl font-bold mb-2">Acesso Negado</h1>
        <p className="text-gray-500 mb-6">
          Voce nao tem permissao para acessar esta pagina.
        </p>
        <Button onClick={() => navigate("/")}>Voltar ao inicio</Button>
      </div>
    </Layout>
  );
}
