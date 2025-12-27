import { MongoClient } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-website-builder'

interface GlobalMongo {
  client: MongoClient | null
  promise: Promise<MongoClient> | null
}

declare global {
  var mongoClient: GlobalMongo | undefined
}

let cached = global.mongoClient

if (!cached) {
  cached = global.mongoClient = { client: null, promise: null }
}

async function getClient(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('Please define the MONGODB_URI environment variable')
  }

  if (cached!.client) {
    return cached!.client
  }

  if (!cached!.promise) {
    const client = new MongoClient(uri)
    cached!.promise = client.connect()
  }

  cached!.client = await cached!.promise
  return cached!.client
}

// Export as a promise-like object for compatibility
const clientPromise = {
  then: (resolve: (client: MongoClient) => void) => getClient().then(resolve),
  db: async (name?: string) => {
    const client = await getClient()
    return client.db(name)
  },
}

export default clientPromise
export { getClient }
