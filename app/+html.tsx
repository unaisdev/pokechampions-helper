import { ScrollViewStyleReset } from 'expo-router/html';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* Vexo web analytics — set domain to pokechampions-helper.expo.app in Vexo dashboard */}
        <script src="https://www.vexo.co/analytics.js" defer />

        {/* 
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native. 
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/*
          FOUC mitigation (web + Unistyles): hide #root until the root layout runs useLayoutEffect
          after the first commit where RN Web + Unistyles attach generated classes.
          Body colors follow prefers-color-scheme until app/_layout syncs stored theme.
        */}
        <style dangerouslySetInnerHTML={{ __html: bodyFallbackBackground }} />
        {/* Add any additional <head> elements that you want globally available on web... */}
      </head>
      <body>{children}</body>
    </html>
  );
}

/** Matches `lightColors` / `darkColors` in src/shared/theme/palettes.ts */
const bodyFallbackBackground = `
html {
  color-scheme: light dark;
}
@media (prefers-color-scheme: dark) {
  body {
    background-color: #09090b;
    color: #fafafa;
  }
}
@media (prefers-color-scheme: light) {
  body {
    background-color: #ffffff;
    color: #18181b;
  }
}
html:not(.app-bootstrapped) #root {
  visibility: hidden;
}
html.app-bootstrapped #root {
  visibility: visible;
}
`;
