export const parseArrayEnv = (data: string = '', key?: string) => {
  try {
    const parsed = JSON.parse(data)
    if(!Array.isArray(parsed)){
      throw new Error('')
    }
    return parsed
  } catch (e) {
    console.error(`Error env ${key} is not a valid JSON array`)
    return []
  }
}
