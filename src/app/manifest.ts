import { MetadataRoute } from 'next'
export default function manifest(): MetadataRoute.Manifest {
  return {
    // ... other settings
    display: 'standalone', // This hides the browser address bar
    scope: '/',            // Ensures the entire app is covered
    start_url: '/',        
  }
}