import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ProductCard } from "@/components/products/ProductCard";
import { productService } from "@/services/products";
import { useUserPurchases } from "@/hooks/use-user-purchases";
import type { Product } from "@/types";

export default function HomePage() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { hasPurchased } = useUserPurchases();

  useEffect(() => {
    async function load() {
      try {
        const products = await productService.getProducts({ featured: true });
        setFeatured(
          products.length > 0
            ? products
            : (await productService.getProducts()).slice(0, 6),
        );
      } catch (error) {
        console.error("Failed to load homepage data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/bg-main.png')" }}
        />
        <div className="absolute inset-0 bg-[#051D3C]/60" />

        <div className="relative container mx-auto px-4 py-20 md:py-28">
          <div className="max-w-2xl animate-fade-in-up">
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
              Lojauster
            </h1>
            <p className="mt-4 text-lg text-white/70 max-w-lg">
              Troque suas moedas Feedz por produtos exclusivos. Explore nosso
              catálogo e resgate suas recompensas.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-default-blue to-dark-blue hover:from-default-blue/90 hover:to-dark-blue/90 text-white font-semibold"
              >
                <Link to="/products">
                  Explorar Produtos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Carousel */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold">Destaques</h2>
            <p className="text-muted-foreground mt-1">
              Produtos em destaque para você
            </p>
          </div>
          <Button variant="ghost" asChild>
            <Link to="/products" className="text-default-blue">
              Ver todos <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : featured.length > 0 ? (
          <Carousel opts={{ align: "start", loop: true }} className="w-full">
            <CarouselContent className="-ml-4">
              {featured.map((product) => (
                <CarouselItem
                  key={product.id}
                  className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
                >
                  <ProductCard product={product} alreadyPurchased={hasPurchased(product.id)} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="-left-4 hidden md:flex" />
            <CarouselNext className="-right-4 hidden md:flex" />
          </Carousel>
        ) : null}
      </section>
    </Layout>
  );
}
