import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { productSchema, type ProductInput } from "@/schemas/product";
import { formatMoney } from "@/utils/format";
import type { Product, Category } from "@/types";

interface Props {
  product?: Product | null;
  categories: Category[];
  onSubmit: (
    data: ProductInput & { discount?: { percentOff: number; endDate: string } },
  ) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ProductForm({
  product,
  categories,
  onSubmit,
  onCancel,
  isLoading,
}: Props) {
  const [discountEnabled, setDiscountEnabled] = useState(
    !!product?.discount?.percentOff,
  );
  const [discountPercent, setDiscountPercent] = useState(
    product?.discount?.percentOff || 10,
  );
  const [discountDays, setDiscountDays] = useState(7);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || "",
      description: product?.description || "",
      price: product?.price || 0,
      image: product?.image || "",
      category: product?.category || "",
      stock: product?.stock || 0,
      featured: product?.featured || false,
      singlePurchase: product?.singlePurchase || false,
    },
  });

  const imageUrl = watch("image");

  const onFormSubmit = async (data: ProductInput) => {
    const submitData: ProductInput & {
      discount?: { percentOff: number; endDate: string } | null;
    } = { ...data };

    if (discountEnabled) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + discountDays);
      submitData.discount = {
        percentOff: discountPercent,
        endDate: endDate.toISOString(),
      };
    } else {
      // Explicitly send null to remove discount
      submitData.discount = null;
    }

    await onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" {...register("name")} />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Categoria</Label>
          <Select
            value={watch("category")}
            onValueChange={(val) => setValue("category", val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.name}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="text-sm text-red-500">{errors.category.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descricao</Label>
        <Textarea id="description" rows={3} {...register("description")} />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Preco (R$)</Label>
          <Input
            id="price"
            type="number"
            {...register("price", { valueAsNumber: true })}
          />
          {errors.price && (
            <p className="text-sm text-red-500">{errors.price.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="stock">Estoque</Label>
          <Input
            id="stock"
            type="number"
            {...register("stock", { valueAsNumber: true })}
          />
          {errors.stock && (
            <p className="text-sm text-red-500">{errors.stock.message}</p>
          )}
        </div>
      </div>

      <ImageUpload
        value={imageUrl || ""}
        onChange={(val) => setValue("image", val)}
        label="Imagem do produto"
        maxSizeMB={0.5}
        maxDimension={800}
        folder="products"
      />
      {errors.image && (
        <p className="text-sm text-red-500">{errors.image.message}</p>
      )}

      {/* Featured */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center gap-2">
          <Switch
            checked={watch("featured")}
            onCheckedChange={(checked) => setValue("featured", checked)}
          />
          <Label>Destaque</Label>
        </div>
      </div>

      {/* Single Purchase */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center gap-2">
          <Switch
            checked={watch("singlePurchase")}
            onCheckedChange={(checked) => setValue("singlePurchase", checked)}
          />
          <Label>Compra unica</Label>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Cada usuário só poderá comprar 1 unidade deste produto
        </p>
      </div>

      {/* Discount */}
      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Switch
            checked={discountEnabled}
            onCheckedChange={setDiscountEnabled}
          />
          <Label>Desconto</Label>
        </div>

        {discountEnabled && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Percentual (%)</Label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Duração (dias)</Label>
                <Input
                  type="number"
                  min={1}
                  value={discountDays}
                  onChange={(e) => setDiscountDays(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Price preview with discount */}
            {watch("price") > 0 &&
              discountPercent > 0 &&
              discountPercent <= 100 && (
                <div className="bg-muted/50 rounded-md p-3 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Preview do preco
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-green-600">
                      {formatMoney(
                        Math.round(
                          watch("price") * (1 - discountPercent / 100),
                        ),
                      )}
                    </span>
                    <span className="text-sm text-muted-foreground line-through">
                      {formatMoney(watch("price"))}
                    </span>
                    <span className="text-xs font-semibold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded">
                      -{discountPercent}%
                    </span>
                  </div>
                </div>
              )}
          </>
        )}
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Salvando..." : product ? "Atualizar" : "Criar"}
        </Button>
      </div>
    </form>
  );
}
