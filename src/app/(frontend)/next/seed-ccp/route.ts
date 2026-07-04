import { createLocalReq, getPayload } from 'payload'
import { revalidateTag } from 'next/cache'
import { seedCcp } from '@/endpoints/seed-ccp'
import config from '@payload-config'
import { headers } from 'next/headers'

export const maxDuration = 120

export async function POST(): Promise<Response> {
  const payload = await getPayload({ config })
  const requestHeaders = await headers()

  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user) {
    return new Response('Action forbidden.', { status: 403 })
  }

  try {
    const payloadReq = await createLocalReq({ user }, payload)
    await seedCcp({ payload, req: payloadReq })

    revalidateTag('global_header', 'max')
    revalidateTag('global_footer', 'max')

    return Response.json({ success: true })
  } catch (e) {
    payload.logger.error({ err: e, message: 'Error seeding CCP data' })
    return new Response('Error seeding CCP data.', { status: 500 })
  }
}
