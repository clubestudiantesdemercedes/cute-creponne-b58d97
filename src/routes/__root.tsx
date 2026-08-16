import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

import '../styles.css'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Natatorio — Club Atlético Estudiantes' },
      {
        name: 'description',
        content: 'Sistema de gestión de la temporada de pileta del Club Atlético Estudiantes de Mercedes.',
      },
    ],
    links: [{ rel: 'icon', href: '/favicon.ico' }],
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
        <Scripts />
      </body>
    </html>
  )
}
