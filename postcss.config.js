const config = {
  plugins: {
    'postcss-preset-env': {
      features: {
        'nesting-rules': false,
        'custom-properties': false,
        'color-function': false,
        'custom-media-queries': false,
        'gap-properties': false,
        'not-pseudo-class': false
      },
      browsers: [
        'Safari >= 8',
        'iOS >= 8',
        'Chrome >= 30',
        'Firefox >= 30',
        'Explorer >= 10'
      ],
      preserve: false,
      enableClientSidePolyfills: true
    },
    'tailwindcss/nesting': {},
    tailwindcss: {},
    autoprefixer: {
      flexbox: 'no-2009',
      grid: 'autoplace',
      overrideBrowserslist: [
        'Safari >= 8',
        'iOS >= 8',
        'Chrome >= 30',
        'Firefox >= 30',
        'Explorer >= 10'
      ]
    },
    ...(process.env.NODE_ENV === 'production' ? {
      cssnano: {
        preset: ['default', {
          calc: false,
          colormin: false,
          zindex: false
        }]
      }
    } : {})
  }
}

export default config 