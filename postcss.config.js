module.exports = {
  plugins: {
    'postcss-preset-env': {
      features: { 'nesting-rules': false }
    },
    'tailwindcss/nesting': {},
    tailwindcss: {},
    autoprefixer: {},
    ...(process.env.NODE_ENV === 'production' ? { cssnano: {} } : {})
  }
} 