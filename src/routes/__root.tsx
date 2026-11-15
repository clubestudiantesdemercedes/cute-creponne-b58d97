import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

import { PwaManager } from '../components/PwaManager'
import '../styles.css'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      { title: 'Natatorio — Club Atlético Estudiantes' },
      {
        name: 'description',
        content: 'Sistema de gestión de la temporada de pileta del Club Atlético Estudiantes de Mercedes.',
      },
      { name: 'theme-color', content: '#0c2b5b' },
      { name: 'mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      { name: 'apple-mobile-web-app-title', content: 'Natatorio CAE' },
    ],
    links: [
      { rel: 'icon', href: '/favicon.ico' },
      { rel: 'manifest', href: '/manifest.webmanifest' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
      <head>
        <HeadContent />
      </head>
      <body className="bg-slate-50 text-slate-900">
        {children}
        <PwaManager />
        <Scripts />
      </body>
    </html>
  )
}
