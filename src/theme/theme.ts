import { createSystem, defaultConfig } from "@chakra-ui/react"

export const system = createSystem(defaultConfig, {
  theme: {
    tokens: {
      colors: {
        // Paleta Laranja (inspirado no Apertai)
        brand: {
          50: { value: '#FFF5E6' },
          100: { value: '#FFE8CC' },
          200: { value: '#FFD699' },
          300: { value: '#FFC166' },
          400: { value: '#FFAD33' },
          500: { value: '#FF9900' }, // Laranja principal
          600: { value: '#CC7A00' },
          700: { value: '#995C00' },
          800: { value: '#663D00' },
          900: { value: '#331F00' },
        },

        // Tons de cinza para layout clean
        gray: {
          50: { value: '#FAFAFA' },
          100: { value: '#F5F5F5' },
          200: { value: '#E5E5E5' },
          300: { value: '#D4D4D4' },
          400: { value: '#A3A3A3' },
          500: { value: '#737373' },
          600: { value: '#525252' },
          700: { value: '#404040' },
          800: { value: '#262626' },
          900: { value: '#171717' },
        },
      },
      fonts: {
        body: { value: 'system-ui, sans-serif' },
        heading: { value: 'system-ui, sans-serif' },
      },
    },
    semanticTokens: {
      colors: {
        // Background
        'bg.canvas': { value: '{colors.gray.50}' },
        'bg.surface': { value: 'white' },
        'bg.subtle': { value: '{colors.gray.100}' },

        // Texto
        'text.primary': { value: '{colors.gray.900}' },
        'text.secondary': { value: '{colors.gray.600}' },
        'text.muted': { value: '{colors.gray.500}' },

        // Brand colors
        'brand.solid': { value: '{colors.brand.500}' },
        'brand.contrast': { value: 'white' },
      },
    },
  },
})
