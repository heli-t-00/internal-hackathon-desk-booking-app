/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_CLAUDE?: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
