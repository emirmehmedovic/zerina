"use client";

import { useState } from "react";
import { Shop } from "@/lib/types";
import CreateShopForm from "./CreateShopForm";
import ShopDetails from "./ShopDetails";

interface ShopDashboardClientProps {
  initialShop: Shop | null;
}

export default function ShopDashboardClient({ initialShop }: ShopDashboardClientProps) {
  const [shop, setShop] = useState<Shop | null>(initialShop);

  if (!shop) {
    return <CreateShopForm onShopCreated={setShop} />;
  }

  return <ShopDetails shop={shop} />;
}
