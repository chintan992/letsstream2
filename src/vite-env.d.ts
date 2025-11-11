/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module "*.css" {
  const content: string;
  export default content;
}

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
