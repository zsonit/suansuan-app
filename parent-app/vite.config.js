import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import pkg from './package.json'

export default defineConfig({
  plugins: [uni()],
  // App 壳（Capacitor）内使用相对路径加载资源：H5_BASE=./
  base: process.env.H5_BASE || '/',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version || '1.0.0')
  }
})
