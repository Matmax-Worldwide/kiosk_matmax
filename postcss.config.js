module.exports = {
  plugins: {
    'tailwindcss/nesting': {},
    tailwindcss: {},
    autoprefixer: {
      flexbox: true,
      grid: true,
      browsers: ['> 1%', 'last 2 versions', 'Safari >= 9', 'iOS >= 9']
    },
    ...(process.env.NODE_ENV === 'production' ? { cssnano: {} } : {})
  }
} 