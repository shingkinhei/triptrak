// src/app/manifest.ts
import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TripTrak',
    short_name: 'TripTrak',
    description: 'Your ultimate travel companion',
    start_url: '/',
    display: 'standalone', 
    background_color: '#ffffff', 
    theme_color: '#000000',      
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}