"use client"
<<<<<<< HEAD
import { Icons } from "@/components/icons";
import { buttonVariants } from "@/components/ui/button";
import {
  Drawer as DrawerComponent,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { IoMenuSharp } from "react-icons/io5";
import { useUser } from "@clerk/nextjs";

export default function Drawer() {
  const { user } = useUser();
  return (
    <DrawerComponent>
      <DrawerTrigger>
        <IoMenuSharp className="text-2xl" />
      </DrawerTrigger>
      <DrawerContent>
        {/* Accessible title required by the underlying dialog primitives. Hidden visually. */}
        <DrawerTitle className="sr-only">Navigation Menu</DrawerTitle>
        <DrawerHeader className="px-6">
          <Link
            href={user ? "/dashboard" : "/signin"}
            className={buttonVariants({ variant: "outline" })}
          >
            {user ? "Dashboard" : "Login"}
          </Link>
          <Link
            href="/signup"
            className={cn(
              buttonVariants({ variant: "default" }),
              "w-full sm:w-auto text-background flex gap-2"
            )}
          >
            <Icons.logo className="h-6 w-6" />
            {user ? "Dashboard" : "Get Started for Free"}
          </Link>
        </DrawerHeader>
      </DrawerContent>
    </DrawerComponent>
  );
=======
import * as Dialog from "@radix-ui/react-dialog"
import React from "react"

export default function Drawer({ children }: { children?: React.ReactNode }) {
  return (
    <Dialog.Root>
      <Dialog.Trigger className="px-3 py-1">Menu</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40" />
        <Dialog.Content className="fixed right-0 top-0 h-full w-[320px] bg-white p-4 shadow-lg">
          {/* required for accessibility */}
          <Dialog.Title className="text-lg font-semibold">Application menu</Dialog.Title>

          <div className="mt-3">{children}</div>

          <Dialog.Close className="mt-4 px-3 py-1 bg-gray-200">Close</Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
>>>>>>> 0a74951a08b525410bbc5b77e68a3dc7761227fa
}
