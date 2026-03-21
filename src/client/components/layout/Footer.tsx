import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="bg-[#051D3C] text-white/70">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h2 className="font-semibold text-white mb-3 text-sm">Lojauster</h2>
            <p className="text-sm text-white/60">
              Loja de recompensas para colaboradores Auster Contabilidade.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <h4 className="font-semibold text-white mb-1 text-sm">Ajuda</h4>
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLScLTasPuLhNVhvw96hxIXo_OIS2ayGGGjKuS_IfsvCGFk6gIQ/viewform"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm hover:text-white transition-colors"
            >
              Contate o T&I
            </a>
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLScLTasPuLhNVhvw96hxIXo_OIS2ayGGGjKuS_IfsvCGFk6gIQ/viewform"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm hover:text-white transition-colors"
            >
              Contate o RH
            </a>
            <a
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-white/60"
            >
              Não oferecemos reembolsos :p
            </a>
          </div>

          <div>
            <img src="/logo_branca.svg" alt="Auster" className="h-20" />
          </div>
        </div>

        <Separator className="my-8 bg-white/10" />

        <p className="text-center text-xs text-white/40">
          &copy; {new Date().getFullYear()} Auster Contabilidade. Todos os
          direitos reservados.
        </p>
      </div>
    </footer>
  );
}
