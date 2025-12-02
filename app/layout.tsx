import { type Metadata } from 'next'
import {
  ClerkProvider,
} from '@clerk/nextjs'

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Provider from './provider';
<<<<<<< HEAD
=======
import Chatbot from '@/components/Chatbot';
>>>>>>> 0a74951a08b525410bbc5b77e68a3dc7761227fa

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
<<<<<<< HEAD
  title: "AI Docter Agent ",
=======
  title: "AI Docter Agent",
>>>>>>> 0a74951a08b525410bbc5b77e68a3dc7761227fa
  description: "AI Docter voice agent which can help you to get the best treatment for your health",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
<<<<<<< HEAD
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden`} suppressHydrationWarning>
          <Provider>
            {children}
=======
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden`}>
          <Provider>
            {children}
            <Chatbot />
>>>>>>> 0a74951a08b525410bbc5b77e68a3dc7761227fa
          </Provider>
        </body>
      </html>
    </ClerkProvider>
  )
}