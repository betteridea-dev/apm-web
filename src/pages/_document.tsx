import { Html, Head, Main, NextScript } from "next/document";
import { GoogleAnalytics } from '@next/third-parties/google'

export default function Document() {
  return (
    <Html lang="en">
      <Head >
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" href="/icon.svg" type="image/svg" />
        <link rel="apple-touch-icon" href="/icon.png" type="image/png" />
        <GoogleAnalytics gaId="G-0JW938P8EW" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
