import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Toaster } from "@/components/ui/sonner"

import Registry from "@/components/registry";
import Publish from "@/components/publish";
import Guide from "@/components/guide";
import Footer from "@/components/footer";
import Image from "next/image";

import Link from "next/link";
import { Button } from "@/components/ui/button";

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
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input";
import { useLocalStorage } from "usehooks-ts"
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function Home() {
  const [cuUrlInput, setCuUrlInput] = useState("")
  const [cuUrl, setCuUrl] = useLocalStorage("apm-cu-url", "https://cu.arnode.asia", { initializeWithValue: true })

  useEffect(() => {
    setCuUrlInput(cuUrl)
  }, [cuUrl])

  return (
    <>
      <main className="min-h-screen !bg-white">
        <div className="max-w-6xl mx-auto w-full">
          <Tabs defaultValue="explore" className="w-full flex flex-col p-5 md:p-10">
            <div className="flex flex-row items-center justify-between relative w-full">
              <Link href="/" className="p-5 md:p-0 flex gap-3 items-center text-xl"><Image alt="logo" src={"/icon.svg"} width={35} height={35} /> APM</Link>
              <TabsList className="bg-[#EEEEEE] w-fit rounded-full h-fit hidden md:flex">
                <TabsTrigger value="explore" className="rounded-full p-3 px-4 data-[state=active]:bg-[#68A04E] data-[state=active]:text-white">Registry</TabsTrigger>
                <TabsTrigger value="publish" className="rounded-full p-3 px-4 data-[state=active]:bg-[#68A04E] data-[state=active]:text-white">Publish Package</TabsTrigger>
                <TabsTrigger value="guide" className="rounded-full p-3 px-4 data-[state=active]:bg-[#68A04E] data-[state=active]:text-white">Guide</TabsTrigger>
              </TabsList>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full p-0 text-xl">⚙️</Button>

                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>CU URL</AlertDialogTitle>
                    <AlertDialogDescription>
                      Which CU do you want to use for computation?<br />
                      <span className="text-xs text-gray-500">default: https://cu.arnode.asia</span>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <Input type="text" placeholder="https://cu.arnode.asia" value={cuUrlInput} onChange={(e) => setCuUrlInput(e.target.value)} />
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => {
                      setCuUrl(cuUrlInput)
                      toast.success("CU URL saved")
                    }}>Save</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            {/* these appear on mobile */}
            <TabsList className="bg-[#EEEEEE] w-fit mx-auto rounded-full h-fit flex md:hidden">
              <TabsTrigger value="explore" className="rounded-full p-3 px-4 data-[state=active]:bg-[#68A04E] data-[state=active]:text-white">Registry</TabsTrigger>
              <TabsTrigger value="publish" className="rounded-full p-3 px-4 data-[state=active]:bg-[#68A04E] data-[state=active]:text-white">Publish Package</TabsTrigger>
              <TabsTrigger value="guide" className="rounded-full p-3 px-4 data-[state=active]:bg-[#68A04E] data-[state=active]:text-white">Guide</TabsTrigger>
            </TabsList>
            <div className="my-10 w-full h-full">
              <TabsContent value="explore"><Registry /></TabsContent>
              <TabsContent value="publish"><Publish /></TabsContent>
              <TabsContent value="guide"><Guide /></TabsContent>
            </div>
          </Tabs>
        </div>
      </main>
      <Footer />
    </>
  );
}
