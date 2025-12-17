import { redirect } from 'next/navigation'
import TimeBlocksClient from './TimeBlocksClient'
import { isAuthenticated } from '@/services/authService'
import { getBlocks } from '@/services/timeBlockService'

export const dynamic = 'force-dynamic'

export default async function TimeBlocksPage() {
  if (!(await isAuthenticated())) redirect('/login')
  const blocks = getBlocks()
  return (
    <main>
      <TimeBlocksClient initialBlocks={blocks} />
    </main>
  )
}
