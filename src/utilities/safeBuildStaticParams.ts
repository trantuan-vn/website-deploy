/** Skip pre-rendering route params when MongoDB is unreachable during docker build. */
export async function safeBuildStaticParams<T>(fn: () => Promise<T[]>): Promise<T[]> {
  try {
    return await fn()
  } catch (error) {
    console.warn('[build] MongoDB unavailable — skipping static params for this route:', error)
    return []
  }
}
