// pages/_document.tsx
// ── Custom Document: sets initial data-theme to prevent theme flash ──

import { Html, Head, Main, NextScript } from 'next/document';

const NO_FLASH_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('pbt_theme');
    var theme = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'dark';
    var resolved = theme;
    if (theme === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', resolved);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`.trim();

export default function Document(): JSX.Element {
  return (
    <Html lang="en" data-theme="dark">
      <Head>
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.ico" />
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_SCRIPT }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}