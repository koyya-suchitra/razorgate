import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import { handleProductSearchApi } from './src/server/searchApiMiddleware.ts';
import { handlePaymentApi } from './src/server/paymentApiMiddleware.ts';

import { cloudflare } from "@cloudflare/vite-plugin";

function productSearchApiPlugin(): Plugin {
  return {
    name: 'product-search-api',
    configureServer(server) {
      server.middlewares.use('/api/products/search', (req, res, next) => {
        handleProductSearchApi(req, res, next);
      });
      server.middlewares.use('/api/product-search', (req, res, next) => {
        handleProductSearchApi(req, res, next);
      });
      server.middlewares.use('/api/payments/create-order', (req, res, next) => {
        handlePaymentApi(req, res, next);
      });
      server.middlewares.use('/api/payments/verify', (req, res, next) => {
        handlePaymentApi(req, res, next);
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/products/search', (req, res, next) => {
        handleProductSearchApi(req, res, next);
      });
      server.middlewares.use('/api/product-search', (req, res, next) => {
        handleProductSearchApi(req, res, next);
      });
      server.middlewares.use('/api/payments/create-order', (req, res, next) => {
        handlePaymentApi(req, res, next);
      });
      server.middlewares.use('/api/payments/verify', (req, res, next) => {
        handlePaymentApi(req, res, next);
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), productSearchApiPlugin(), cloudflare()],
});