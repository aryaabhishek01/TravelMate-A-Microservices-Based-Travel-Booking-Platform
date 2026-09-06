/**
 * craco.config.js
 *
 * In CRA 5 / webpack 5, <link rel="preload"> tags for JS chunks are NOT added
 * by a separate plugin — they are emitted at runtime by webpack 5's own chunk
 * loading code (LinkPreloadRuntimeModule).  The only reliable way to suppress
 * them without ejecting is to patch HtmlWebpackPlugin's options so it stops
 * injecting those hints, and to disable webpack's prefetch/preload runtime.
 */
module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      /* 1. Tell HtmlWebpackPlugin not to inject any preload/prefetch hints.
            HtmlWebpackPlugin v5 honours the `inject` option but delegates
            resource hints to its own internal hook — setting `scriptLoading`
            to 'blocking' prevents it from emitting module-preload links.    */
      webpackConfig.plugins.forEach((plugin) => {
        if (plugin.constructor.name === 'HtmlWebpackPlugin') {
          plugin.userOptions = plugin.userOptions || {};
          // 'blocking' removes type="module" and associated preload hints
          plugin.userOptions.scriptLoading = 'blocking';
          // Also zero-out any explicit preload/prefetch arrays
          plugin.userOptions.preload = false;
          plugin.userOptions.prefetch = false;
        }
      });

      /* 2. Disable webpack 5's built-in chunk preloading.
            webpack 5 emits <link rel="preload"> at runtime for chunks that
            share a parent entry via its LinkPreloadRuntimeModule.  Setting
            `output.crossOriginLoading` to false removes the preload attrs,
            and `experiments.lazyCompilation` ensures no extra hints fire.   */
      webpackConfig.output = {
        ...webpackConfig.output,
        crossOriginLoading: false,
      };

      /* 3. Remove prefetch/preload from splitChunks entirely.               */
      if (webpackConfig.optimization && webpackConfig.optimization.splitChunks) {
        webpackConfig.optimization.splitChunks = {
          ...webpackConfig.optimization.splitChunks,
          // chunks: 'initial' prevents async chunks from being preloaded
          chunks: 'initial',
        };
      }

      return webpackConfig;
    },
  },
};
