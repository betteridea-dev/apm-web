import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// import { DM_Sans} from "next/font/google";
// const dmSane = DM_Sans({ subsets: ["latin"] });

export default function Home() {
  return (
  <>
    <main className="min-h-screen">
      <Tabs defaultValue="explore" className="w-full flex flex-col items-center p-5 md:p-10 md:px-24">
        <div className="flex flex-col items-center justify-center relative w-full">
          <div className="md:absolute left-0 p-5 md:p-0">APM (beta)</div>
          <TabsList className="bg-[#EEEEEE] w-fit rounded-full h-fit">
              <TabsTrigger value="explore" className="rounded-full p-3 px-4 data-[state=active]:bg-[#68A04E] data-[state=active]:text-white">Explore Listings</TabsTrigger>
              <TabsTrigger value="publish" className="rounded-full p-3 px-4 data-[state=active]:bg-[#68A04E] data-[state=active]:text-white">Publish Package</TabsTrigger>
              <TabsTrigger value="guide" className="rounded-full p-3 px-4 data-[state=active]:bg-[#68A04E] data-[state=active]:text-white">Guide</TabsTrigger>
          </TabsList>
        </div>
        <div className="my-20 bg-black/5 w-full h-full">
          <TabsContent value="explore">Listing</TabsContent>
          <TabsContent value="publish">Publish</TabsContent>
          <TabsContent value="guide">Docs</TabsContent>
        </div>
      </Tabs>
    </main>
      <footer className="bg-[#68A04E] p-10 text-white">
        APM
      </footer></>
  );
}
