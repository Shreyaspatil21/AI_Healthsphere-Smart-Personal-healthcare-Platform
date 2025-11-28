"use client"
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
}
