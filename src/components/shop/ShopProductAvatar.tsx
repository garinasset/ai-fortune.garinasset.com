"use client";

import SpiritPetMediaAvatar from "@/components/SpiritPetMediaAvatar";
import { ShopEmojiDisplay } from "@/components/icons/SpiritGourdIcon";
import { getProductBySku, type ShopProduct } from "@/lib/shop/catalog";
import type { ShopOrderItem } from "@/lib/shop/order-store";
import { cn } from "@/lib/utils";

type AvatarProduct = Pick<ShopProduct, "emoji" | "imageUrl" | "petBreedId" | "name">;

interface ShopProductAvatarProps {
  product: AvatarProduct;
  className?: string;
  iconClassName?: string;
  /** SpiritPetMediaAvatar 尺寸 */
  mediaSize?: "xs" | "sm" | "md" | "lg";
  preferVideo?: boolean;
}

export default function ShopProductAvatar({
  product,
  className,
  iconClassName = "h-8 w-8 text-app-gold",
  mediaSize = "md",
  preferVideo = true,
}: ShopProductAvatarProps) {
  if (product.imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={product.imageUrl}
        alt={product.name}
        className={cn("h-full w-full object-cover", className)}
      />
    );
  }

  if (product.petBreedId) {
    return (
      <SpiritPetMediaAvatar
        breedId={product.petBreedId}
        emoji={product.emoji}
        size={mediaSize}
        preferVideo={preferVideo}
        className={cn("!h-full !w-full !rounded-[inherit]", className)}
      />
    );
  }

  return <ShopEmojiDisplay emoji={product.emoji} iconClassName={iconClassName} />;
}

export function ShopOrderItemAvatar({
  item,
  className,
  iconClassName = "h-7 w-7 text-app-gold",
  mediaSize = "sm",
}: {
  item: ShopOrderItem;
  className?: string;
  iconClassName?: string;
  mediaSize?: "xs" | "sm" | "md" | "lg";
}) {
  const product = getProductBySku(item.sku);
  return (
    <ShopProductAvatar
      product={product ?? { emoji: item.emoji, name: item.name }}
      className={className}
      iconClassName={iconClassName}
      mediaSize={mediaSize}
    />
  );
}
