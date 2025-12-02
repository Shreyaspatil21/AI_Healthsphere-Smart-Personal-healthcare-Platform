"use client"
import * as Dialog from "@radix-ui/react-dialog"
import React from "react"
import Link from "next/link"
import { UserButton } from "@clerk/nextjs"

export default function AppHeader() {
  return (
    <header>
      <Dialog.Root>
        <Dialog.Trigger>Menu</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content>
            <Dialog.Title className="sr-only">Application menu</Dialog.Title>
            <div className="flex items-center gap-2">
              <Link href="/" className="text-lg font-bold">Doctor.ai</Link>
            </div>

            <nav className="flex items-center gap-4">
              {/* other nav items */}
              <UserButton />
            </nav>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </header>
  )
}