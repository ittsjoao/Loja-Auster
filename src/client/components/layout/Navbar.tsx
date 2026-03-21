import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  LogOut,
  User,
  ShoppingBag,
  LayoutDashboard,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { getCoinsBalance } from "@/services/feedz";
import { SearchCommand } from "@/components/shared/SearchCommand";
import { CartPreview } from "@/components/shared/CartPreview";

// Coins cache persisted in sessionStorage to survive page reloads
const COINS_CACHE_KEY = "coins_cache";
const COINS_CACHE_MS = 5 * 60 * 1000; // 5 minutos

function loadCoinsCache(): {
  value: number | null;
  timestamp: number;
  userId: string | null;
} {
  try {
    const raw = sessionStorage.getItem(COINS_CACHE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { value: null, timestamp: 0, userId: null };
}

function saveCoinsCache(cache: {
  value: number | null;
  timestamp: number;
  userId: string | null;
}) {
  try {
    sessionStorage.setItem(COINS_CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

let _coinsCache = loadCoinsCache();

/** Call this to force-refresh the coins display (e.g. after purchase or refund) */
export function refreshCoins() {
  window.dispatchEvent(new Event("coins:refresh"));
}

export function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const navLinkClass = (path: string) => {
    const isActive =
      path === "/"
        ? location.pathname === "/"
        : location.pathname.startsWith(path);
    return `px-3 py-2 text-sm transition-colors ${isActive ? "text-white font-medium" : "text-white/60 hover:text-white"}`;
  };
  const [coins, setCoins] = useState<number | null>(_coinsCache.value);
  const [mobileOpen, setMobileOpen] = useState(false);

  const fetchCoins = useCallback(
    (force = false) => {
      if (!user?.feedzEmployeeId) return;
      const now = Date.now();
      const sameUser = _coinsCache.userId === user.id;
      if (
        !force &&
        sameUser &&
        now - _coinsCache.timestamp < COINS_CACHE_MS &&
        _coinsCache.value !== null
      )
        return;
      getCoinsBalance(Number(user.feedzEmployeeId))
        .then((val) => {
          _coinsCache = { value: val, timestamp: Date.now(), userId: user.id };
          saveCoinsCache(_coinsCache);
          setCoins(val);
        })
        .catch(() => setCoins(_coinsCache.value));
    },
    [user?.feedzEmployeeId, user?.id],
  );

  useEffect(() => {
    // On mount, immediately show cached value if same user
    if (user && _coinsCache.userId === user.id && _coinsCache.value !== null) {
      setCoins(_coinsCache.value);
    }
    fetchCoins();
  }, [fetchCoins, user]);

  // Listen for coins invalidation events (e.g. after purchase or refund)
  useEffect(() => {
    const handler = () => fetchCoins(true);
    window.addEventListener("coins:refresh", handler);
    return () => window.removeEventListener("coins:refresh", handler);
  }, [fetchCoins]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 bg-[#051D3C]/95 backdrop-blur-md border-b border-white/10">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left side: hamburger (mobile) + logo + nav (desktop) */}
        <div className="flex items-center gap-3">
          {/* Mobile hamburger — left side next to logo */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button className="md:hidden p-2 text-white/80 hover:text-white">
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-72 bg-[#051D3C] border-white/10"
            >
              <SheetHeader>
                <SheetTitle className="text-white">Menu</SheetTitle>
              </SheetHeader>
              <nav className="mt-6 space-y-1">
                {[
                  { to: "/", label: "Inicio" },
                  { to: "/products", label: "Produtos" },
                  ...(user ? [{ to: "/orders", label: "Meus Pedidos" }] : []),
                  ...(isAdmin
                    ? [
                        { to: "/admin", label: "Painel Admin" },
                        { to: "/vendas", label: "Vendas" },
                      ]
                    : []),
                ].map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={`block px-3 py-2 rounded-lg transition-colors ${
                      (
                        item.to === "/"
                          ? location.pathname === "/"
                          : location.pathname.startsWith(item.to)
                      )
                        ? "text-white bg-white/10 font-medium"
                        : "text-white/60 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
                {!user && (
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
                  >
                    Entrar
                  </Link>
                )}
                {user && (
                  <>
                    <Separator className="my-3 bg-white/10" />
                    <button
                      onClick={() => {
                        setMobileOpen(false);
                        handleLogout();
                      }}
                      className="block w-full text-left px-3 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
                    >
                      Sair
                    </button>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link to="/" className="flex items-center shrink-0">
            <img src="/logo-lojauster.svg" alt="Loja Auster" className="h-8" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild className={navLinkClass("/")}>
                    <Link to="/">Inicio</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuLink
                    asChild
                    className={navLinkClass("/products")}
                  >
                    <Link to="/products">Produtos</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>

                {user && (
                  <NavigationMenuItem>
                    <NavigationMenuLink
                      asChild
                      className={navLinkClass("/orders")}
                    >
                      <Link to="/orders">Meus Pedidos</Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                )}

                {isAdmin && (
                  <>
                    <NavigationMenuItem>
                      <NavigationMenuLink
                        asChild
                        className={navLinkClass("/admin")}
                      >
                        <Link to="/admin">Painel Admin</Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                      <NavigationMenuLink
                        asChild
                        className={navLinkClass("/vendas")}
                      >
                        <Link to="/vendas">Vendas</Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  </>
                )}
              </NavigationMenuList>
            </NavigationMenu>
          </nav>
        </div>

        {/* Right side: search, coins, cart, avatar */}
        <div className="flex items-center gap-2 shrink-0">
          <SearchCommand />

          {/* Coins — visible on all sizes */}
          {user && coins !== null && (
            <button
              onClick={() => fetchCoins(true)}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
              title="Clique para atualizar saldo"
            >
              <img src="/coins-icon.svg" alt="Moedas" className="h-4 w-4" />
              <span className="font-semibold text-xs sm:text-sm">
                {coins.toLocaleString("pt-BR")}
              </span>
            </button>
          )}

          {/* Cart */}
          <CartPreview />

          {/* User menu or login */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center">
                  <Avatar className="h-8 w-8 border border-white/20">
                    <AvatarImage src={user.profilePicture} />
                    <AvatarFallback className="bg-white/10 text-white text-xs">
                      {user.name?.[0] || user.email[0]}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">
                    {user.name || "Usuário"}
                  </p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/orders")}>
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Meus Pedidos
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/admin")}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Painel Admin
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/vendas")}>
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Vendas
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/login")}
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              Entrar
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
