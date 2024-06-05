import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Toaster } from "@/components/ui/sonner";
import { GoogleAnalytics } from '@next/third-parties/google'

declare global {
  interface Window {
    arweaveWallet: {
      connect: Function;
      disconnect: Function;
      getActiveAddress: Function;
    };
  }
}

export default function App({ Component, pageProps }: AppProps) {
  return <><GoogleAnalytics gaId="G-0JW938P8EW" /><Toaster richColors /><Component {...pageProps} /></>;
}
