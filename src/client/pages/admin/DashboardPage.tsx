import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/services/auth";
import { productService } from "@/services/products";
import { ProductForm } from "@/components/products/ProductForm";
import { CategoryManager } from "@/components/admin/CategoryManager";
import { UserForm } from "@/components/admin/UserForm";
import type { Product, User, Category } from "@/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  PlusCircle,
  Pencil,
  Trash2,
  AlertTriangle,
  X,
  UsersRound,
  Package,
  AlignLeft,
  ChevronDown,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { formatMoney } from "@/utils/format";

const PROTECTED_ADMIN_EMAIL = "ti@austercontabil.com.br";

export default function DashboardPage() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [users, setUsers] = useState<Omit<User, "password">[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInactiveProducts, setShowInactiveProducts] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<Omit<User, "password"> | null>(
    null,
  );
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(
    null,
  );
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isDeleteUsersDialogOpen, setIsDeleteUsersDialogOpen] = useState(false);
  const [isDeleteProductsDialogOpen, setIsDeleteProductsDialogOpen] =
    useState(false);

  useEffect(() => {
    loadData();
  }, [showInactiveProducts]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [userList, productList, categoryList] = await Promise.all([
        authService.getAllUsers(),
        showInactiveProducts
          ? productService.getInactiveProducts()
          : productService.getProducts(),
        productService.getCategories(),
      ]);
      setUsers(userList);
      setProducts(productList);
      setCategories(categoryList);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isProtectedUser = (user: Omit<User, "password">) =>
    user.email === PROTECTED_ADMIN_EMAIL;

  const handleProductSubmit = async (productData: any) => {
    try {
      setIsSubmitting(true);
      if (editingProduct) {
        const updated = await productService.updateProduct(
          editingProduct.id,
          productData,
        );
        setProducts(products.map((p) => (p.id === updated.id ? updated : p)));
        toast({ title: "Produto atualizado com sucesso" });
      } else {
        const created = await productService.addProduct(productData);
        setProducts([...products, created]);
        toast({ title: "Produto criado com sucesso" });
      }
      setEditingProduct(null);
      setShowProductForm(false);
      // Reload to reflect active/inactive status changes
      loadData();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao salvar produto",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (
    userId: string,
    newRole: "admin" | "user",
  ) => {
    try {
      await authService.updateUser(userId, { role: newRole });
      setUsers(
        users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
      );
      toast({ title: "Cargo atualizado" });
    } catch (error) {
      toast({
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Falha ao atualizar cargo",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await authService.deleteUser(userId);
      setUsers(users.filter((u) => u.id !== userId));
      toast({ title: "Usuário deletado com sucesso" });
    } catch (error) {
      toast({
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Erro ao deletar usuário",
        variant: "destructive",
      });
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await productService.deleteProduct(productId);
      setProducts(products.filter((p) => p.id !== productId));
      toast({ title: "Produto deletado com sucesso" });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao deletar produto",
        variant: "destructive",
      });
    } finally {
      setDeletingProductId(null);
    }
  };

  const handleUserSubmit = async (
    userData: Partial<User & { password?: string }>,
  ) => {
    try {
      setIsSubmitting(true);
      if (editingUser) {
        const updated = await authService.updateUser(editingUser.id, userData);
        if (updated) {
          setUsers(users.map((u) => (u.id === updated.id ? updated : u)));
          toast({ title: "Usuário atualizado com sucesso" });
        }
      } else {
        const created = await authService.createUser(
          userData as {
            email: string;
            password: string;
            name?: string;
            role?: string;
          },
        );
        setUsers([...users, created]);
        toast({ title: "Usuário criado com sucesso" });
      }
      setShowUserForm(false);
      setEditingUser(null);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao salvar usuário",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSelectAllUsers = (checked: boolean) => {
    setSelectedUsers(checked ? users.map((u) => u.id) : []);
  };

  const toggleSelectUser = (userId: string, checked: boolean) => {
    setSelectedUsers(
      checked
        ? [...selectedUsers, userId]
        : selectedUsers.filter((id) => id !== userId),
    );
  };

  const toggleSelectAllProducts = (checked: boolean) => {
    setSelectedProducts(checked ? products.map((p) => p.id) : []);
  };

  const toggleSelectProduct = (productId: string, checked: boolean) => {
    setSelectedProducts(
      checked
        ? [...selectedProducts, productId]
        : selectedProducts.filter((id) => id !== productId),
    );
  };

  const handleBulkDeleteUsers = async () => {
    try {
      setIsSubmitting(true);
      const toDelete = selectedUsers.filter(
        (id) => !users.find((u) => u.id === id && isProtectedUser(u)),
      );

      if (toDelete.length < selectedUsers.length) {
        toast({
          title: "Atencao",
          description:
            "O usuário protegido nao pode ser excluido e sera pulado",
        });
      }

      for (const userId of toDelete) {
        await authService.deleteUser(userId);
      }

      setUsers(users.filter((u) => !toDelete.includes(u.id)));
      toast({
        title: "Sucesso",
        description: `${toDelete.length} usuário(s) deletado(s)`,
      });
      setSelectedUsers([]);
      setIsDeleteUsersDialogOpen(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao deletar usuários",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkDeleteProducts = async () => {
    try {
      setIsSubmitting(true);
      for (const productId of selectedProducts) {
        await productService.deleteProduct(productId);
      }
      setProducts(products.filter((p) => !selectedProducts.includes(p.id)));
      toast({
        title: "Sucesso",
        description: `${selectedProducts.length} produto(s) deletado(s)`,
      });
      setSelectedProducts([]);
      setIsDeleteProductsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao deletar produtos",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAdmin) {
    return (
      <Layout>
        <div className="container mx-auto py-8 px-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-default-red">
                Nao autorizado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center">
                Voce nao tem permissao para acessar essa pagina.
              </p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Inicio</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Painel Admin</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Painel do Admin</h1>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="w-full flex overflow-x-auto justify-start">
            <TabsTrigger value="users">
              <UsersRound className="h-4 mr-1" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="products">
              <Package className="h-4 mr-1" />
              Produtos
            </TabsTrigger>
            <TabsTrigger value="categories">
              <AlignLeft className="h-4 mr-1" />
              Categorias
            </TabsTrigger>
          </TabsList>

          {/* USERS TAB */}
          <TabsContent value="users">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Gerenciar usuários</CardTitle>
                <div className="flex space-x-2">
                  {selectedUsers.length > 0 && (
                    <AlertDialog
                      open={isDeleteUsersDialogOpen}
                      onOpenChange={setIsDeleteUsersDialogOpen}
                    >
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          className="flex items-center gap-2"
                        >
                          <Trash2 size={16} />
                          Deletar selecionados ({selectedUsers.length})
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            Deletar usuários
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja deletar{" "}
                            {selectedUsers.length} usuário(s)? Essa ação é
                            irreversível.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleBulkDeleteUsers}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? "Deletando..." : "Deletar"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}

                  {selectedUsers.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => setSelectedUsers([])}
                      className="flex items-center gap-2"
                    >
                      <X size={16} />
                      Limpar
                    </Button>
                  )}

                  <Sheet
                    open={showUserForm}
                    onOpenChange={(open) => {
                      setShowUserForm(open);
                      if (!open) setEditingUser(null);
                    }}
                  >
                    <SheetTrigger asChild>
                      <Button className="flex items-center gap-2">
                        <PlusCircle size={16} />
                        Criar
                      </Button>
                    </SheetTrigger>
                    <SheetContent
                      side="right"
                      className="w-full sm:max-w-[600px] overflow-y-auto"
                    >
                      <SheetHeader className="mb-5">
                        <SheetTitle>
                          {editingUser ? "Editar usuário" : "Criar usuário"}
                        </SheetTitle>
                      </SheetHeader>
                      <div className="pr-6">
                        <UserForm
                          user={editingUser}
                          onSubmit={handleUserSubmit}
                          onCancel={() => {
                            setShowUserForm(false);
                            setEditingUser(null);
                          }}
                          isLoading={isSubmitting}
                        />
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading && users.length === 0 ? (
                  <div className="space-y-3 p-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={
                                selectedUsers.length === users.length &&
                                users.length > 0
                              }
                              onCheckedChange={(checked) =>
                                toggleSelectAllUsers(!!checked)
                              }
                            />
                          </TableHead>
                          <TableHead></TableHead>
                          <TableHead>Nome</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Cargo</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.length > 0 ? (
                          users.map((user) => (
                            <TableRow
                              key={user.id}
                              className={
                                selectedUsers.includes(user.id)
                                  ? "bg-muted"
                                  : ""
                              }
                            >
                              <TableCell>
                                {!isProtectedUser(user) && (
                                  <Checkbox
                                    checked={selectedUsers.includes(user.id)}
                                    onCheckedChange={(checked) =>
                                      toggleSelectUser(user.id, !!checked)
                                    }
                                  />
                                )}
                              </TableCell>
                              <TableCell>
                                <Avatar>
                                  <AvatarImage
                                    src={user.profilePicture}
                                    alt={user.name || user.email}
                                  />
                                  <AvatarFallback>
                                    {user.name?.[0] || user.email[0]}
                                  </AvatarFallback>
                                </Avatar>
                              </TableCell>
                              <TableCell>{user.name || "-"}</TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>
                                {isProtectedUser(user) ? (
                                  <span className="text-sm text-muted-foreground">Admin</span>
                                ) : (
                                  <Select
                                    value={user.role}
                                    onValueChange={(value) =>
                                      handleRoleChange(
                                        user.id,
                                        value as "admin" | "user",
                                      )
                                    }
                                  >
                                    <SelectTrigger className="w-32">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="user">
                                        Usuário
                                      </SelectItem>
                                      <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                  </Select>
                                )}
                              </TableCell>
                              <TableCell>
                                {!isProtectedUser(user) && (
                                  <div className="flex space-x-2">
                                    <Button
                                      className="bg-blue-400 hover:bg-blue-400/85 text-white"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setEditingUser(user);
                                        setShowUserForm(true);
                                      }}
                                    >
                                      <Pencil size={14} />
                                    </Button>
                                    <AlertDialog
                                      open={deletingUserId === user.id}
                                      onOpenChange={(isOpen) => {
                                        if (!isOpen) setDeletingUserId(null);
                                      }}
                                    >
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="destructive"
                                          size="sm"
                                          onClick={() =>
                                            setDeletingUserId(user.id)
                                          }
                                        >
                                          <Trash2 size={14} />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle className="flex items-center gap-2">
                                            <AlertTriangle className="h-5 w-5 text-destructive" />
                                            Deletar usuário
                                          </AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Tem certeza que deseja deletar este
                                            usuário? Essa ação é irreversível.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>
                                            Cancelar
                                          </AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() =>
                                              handleDeleteUser(user.id)
                                            }
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                          >
                                            Deletar
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center">
                              Usuários não encontrados
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* PRODUCTS TAB */}
          <TabsContent value="products">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Gerenciar produtos</CardTitle>
                <div className="flex space-x-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        {showInactiveProducts
                          ? "Produtos Inativos"
                          : "Produtos Ativos"}
                        <ChevronDown size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setShowInactiveProducts(false)}
                        className={!showInactiveProducts ? "bg-accent" : ""}
                      >
                        <Package className="mr-2 h-4 w-4" />
                        Produtos Ativos
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setShowInactiveProducts(true)}
                        className={showInactiveProducts ? "bg-accent" : ""}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Produtos Inativos
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {selectedProducts.length > 0 && (
                    <AlertDialog
                      open={isDeleteProductsDialogOpen}
                      onOpenChange={setIsDeleteProductsDialogOpen}
                    >
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          className="flex items-center gap-2"
                        >
                          <Trash2 size={16} />
                          Deletar selecionados ({selectedProducts.length})
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            Deletar produtos
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja deletar{" "}
                            {selectedProducts.length} produto(s)? Essa ação é
                            irreversível.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleBulkDeleteProducts}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? "Deletando..." : "Deletar"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}

                  {selectedProducts.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => setSelectedProducts([])}
                      className="flex items-center gap-2"
                    >
                      <X size={16} />
                      Limpar
                    </Button>
                  )}

                  <Sheet
                    open={showProductForm}
                    onOpenChange={(open) => {
                      setShowProductForm(open);
                      if (!open) setEditingProduct(null);
                    }}
                  >
                    <SheetTrigger asChild>
                      <Button className="flex items-center gap-2">
                        <PlusCircle size={16} />
                        Criar
                      </Button>
                    </SheetTrigger>
                    <SheetContent
                      side="right"
                      className="w-full sm:max-w-[600px] overflow-y-auto"
                    >
                      <SheetHeader className="mb-5">
                        <SheetTitle>
                          {editingProduct ? "Editar produto" : "Criar produto"}
                        </SheetTitle>
                      </SheetHeader>
                      <div className="pr-6">
                        <ProductForm
                          product={editingProduct}
                          categories={categories}
                          onSubmit={handleProductSubmit}
                          onCancel={() => {
                            setShowProductForm(false);
                            setEditingProduct(null);
                          }}
                          isLoading={isSubmitting}
                        />
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading && products.length === 0 ? (
                  <div className="space-y-3 p-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={
                                selectedProducts.length === products.length &&
                                products.length > 0
                              }
                              onCheckedChange={(checked) =>
                                toggleSelectAllProducts(!!checked)
                              }
                            />
                          </TableHead>
                          <TableHead></TableHead>
                          <TableHead>Nome</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead>Preco</TableHead>
                          <TableHead>Quantidade</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.length > 0 ? (
                          products.map((product) => (
                            <TableRow
                              key={product.id}
                              className={
                                selectedProducts.includes(product.id)
                                  ? "bg-muted"
                                  : ""
                              }
                            >
                              <TableCell>
                                <Checkbox
                                  checked={selectedProducts.includes(
                                    product.id,
                                  )}
                                  onCheckedChange={(checked) =>
                                    toggleSelectProduct(product.id, !!checked)
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="w-12 h-12 object-cover rounded"
                                />
                              </TableCell>
                              <TableCell>{product.name}</TableCell>
                              <TableCell className="capitalize">
                                {product.category}
                              </TableCell>
                              <TableCell>
                                {formatMoney(product.price)}
                              </TableCell>
                              <TableCell>{product.stock}</TableCell>
                              <TableCell className="flex space-x-2">
                                <Button
                                  className="bg-blue-400 hover:bg-blue-400/85 text-white"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingProduct(product);
                                    setShowProductForm(true);
                                  }}
                                >
                                  <Pencil size={14} />
                                </Button>
                                <AlertDialog
                                  open={deletingProductId === product.id}
                                  onOpenChange={(isOpen) => {
                                    if (!isOpen) setDeletingProductId(null);
                                  }}
                                >
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() =>
                                        setDeletingProductId(product.id)
                                      }
                                    >
                                      <Trash2 size={14} />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="flex items-center gap-2">
                                        <AlertTriangle className="h-5 w-5 text-destructive" />
                                        Deletar produto
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Tem certeza que deseja deletar "
                                        {product.name}"? Essa ação é
                                        irreversível.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Cancelar
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() =>
                                          handleDeleteProduct(product.id)
                                        }
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Deletar
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center">
                              Produtos nao encontrados
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* CATEGORIES TAB */}
          <TabsContent value="categories">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar categorias</CardTitle>
              </CardHeader>
              <CardContent>
                <CategoryManager categories={categories} onUpdate={loadData} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
