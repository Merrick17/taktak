"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function useWishlist() {
  const queryClient = useQueryClient()
  const { customer } = useAuth()
  const { toast } = useToast()

  const { data: wishlist = [] } = useQuery({
    queryKey: ["wishlist"],
    queryFn: async () => {
      const stored = localStorage.getItem("wishlist")
      return stored ? JSON.parse(stored) : []
    },
    enabled: !!customer,
  })

  const toggleWishlistMutation = useMutation({
    mutationFn: async (productId: string) => {
      const current = [...wishlist]
      const index = current.indexOf(productId)
      if (index > -1) {
        current.splice(index, 1)
      } else {
        current.push(productId)
      }
      localStorage.setItem("wishlist", JSON.stringify(current))
      return current
    },
    onSuccess: (updatedWishlist) => {
      queryClient.setQueryData(["wishlist"], updatedWishlist)
      toast({
        title: "قائمة الأمنيات",
        description: "تم تحديث قائمة الأمنيات بنجاح.",
      })
    },
  })

  return {
    wishlist,
    toggleWishlist: toggleWishlistMutation.mutate,
    isWishing: toggleWishlistMutation.isPending,
    isWishlisted: (productId: string) => wishlist.includes(productId),
  }
}

export function WishlistButton({ productId }: { productId: string }) {
  const { toggleWishlist, isWishlisted, isWishing } = useWishlist()
  const wishlisted = isWishlisted(productId)

  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-full"
      onClick={() => toggleWishlist(productId)}
      disabled={isWishing}
    >
      <Heart
        className={`w-5 h-5 transition-colors ${wishlisted ? "fill-red-500 text-red-500" : "text-muted-foreground"}`}
      />
    </Button>
  )
}
