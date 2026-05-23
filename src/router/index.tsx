import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { HomePage } from '@/pages/HomePage'
import { RunPage } from '@/pages/RunPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { SharePage } from '@/pages/SharePage'

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/run/:id', element: <RunPage /> },
      { path: '/settings', element: <SettingsPage /> },
    ],
  },
  { path: '/share', element: <SharePage /> },
])
