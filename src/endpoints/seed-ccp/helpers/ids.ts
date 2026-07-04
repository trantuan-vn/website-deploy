export function generateBlockId(): string {
  const chars = '0123456789abcdef'
  let id = ''
  for (let i = 0; i < 24; i++) {
    id += chars[Math.floor(Math.random() * chars.length)]
  }
  return id
}
