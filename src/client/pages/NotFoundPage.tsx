import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center">
        <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-2">Pagina nao encontrada</h2>
        <p className="text-gray-500 mb-6">
          A pagina que voce procura nao existe ou foi removida.
        </p>
        <Button onClick={() => navigate("/")}>Voltar ao inicio</Button>
      </div>
    </Layout>
  );
}
