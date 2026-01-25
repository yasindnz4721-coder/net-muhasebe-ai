import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { resolve } from "node:path";
import AutoImport from "unplugin-auto-import/vite";

// Electron için base yolunu './' olarak sabitlemek dosya erişim hatalarını çözer.
const base = "./";
const isPreview = process.env.IS_PREVIEW ? true : false;

export default defineConfig({
  define: {
    __BASE_PATH__: JSON.stringify(base),
    __IS_PREVIEW__: JSON.stringify(isPreview),
    __READDY_PROJECT_ID__: JSON.stringify(process.env.PROJECT_ID || ""),
    __READDY_VERSION_ID__: JSON.stringify(process.env.VERSION_ID || ""),
    __READDY_AI_DOMAIN__: JSON.stringify(process.env.READDY_AI_DOMAIN || ""),
  },
  plugins: [
    react(),
    AutoImport({
      imports: [
        {
          react: [
            "React", "useState", "useEffect", "useContext", "useReducer",
            "useCallback", "useMemo", "useRef", "useImperativeHandle",
            "useLayoutEffect", "useDebugValue", "useDeferredValue",
            "useId", "useInsertionEffect", "useSyncExternalStore",
            "useTransition", "startTransition", "lazy", "memo",
            "forwardRef", "createContext", "createElement",
            "cloneElement", "isValidElement",
          ],
        },
        {
          "react-router-dom": [
            "useNavigate", "useLocation", "useParams",
            "useSearchParams", "Link", "NavLink",
            "Navigate", "Outlet",
          ],
        },
        {
          "react-i18next": ["useTranslation", "Trans"],
        },
      ],
      dts: true,
    }),
  ],
  // Kritik Değişiklik: ./ yaparak index.html'in yanındaki assets klasörünü doğru görmesini sağladık.
  base: base,
  build: {
    sourcemap: true,
    // Önceki ekran görüntülerinde Electron'un baktığı klasörle eşleşmesi için 'out' olarak bırakıyoruz.
    outDir: "out",
    // Asset isimlerinin sabit kalması bazen hata ayıklamayı kolaylaştırır.
    assetsDir: "assets",
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  server: {
    // main.cjs dosyasında beklediğin port ile uyumlu (3000)
    port: 3000,
    host: "0.0.0.0",
  },
});