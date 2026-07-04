import 'dotenv/config'

import { createLocalReq, getPayload } from 'payload'
import config from '@payload-config'
import { seedCcp } from '../src/endpoints/seed-ccp/index.ts'

const payload = await getPayload({ config })

const { docs } = await payload.find({ collection: 'users', limit: 1 })
let user = docs[0]

if (!user) {
  user = await payload.create({
    collection: 'users',
    data: {
      email: 'seed-runner@local.test',
      password: 'password',
      name: 'Seed Runner',
    },
  })
  console.log('Created temp user for seed run')
}

const req = await createLocalReq({ user }, payload)
await seedCcp({ payload, req })

const [pages, posts] = await Promise.all([
  payload.find({ collection: 'pages', limit: 1 }),
  payload.find({ collection: 'posts', limit: 1 }),
])

console.log(`Done — pages: ${pages.totalDocs}, posts: ${posts.totalDocs}`)
process.exit(0)
