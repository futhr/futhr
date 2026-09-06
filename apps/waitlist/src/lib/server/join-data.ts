import { error } from '@sveltejs/kit'

const maxBytes = 8192

/** Bound the form body before parsing, including requests without Content-Length. */
const joinData = async (request: Request): Promise<FormData> => {
  const { body } = request
  if (!body) {
    error(400, 'Missing form body')
  }
  const chunks: Uint8Array<ArrayBuffer>[] = []
  let size = 0
  for await (const value of body) {
    size += value.byteLength
    if (size > maxBytes) {
      error(413, 'Form body is too large')
    }
    chunks.push(new Uint8Array(value))
  }
  try {
    return await new Response(new Blob(chunks), { headers: request.headers }).formData()
  } catch {
    error(400, 'Invalid form body')
  }
}

export { joinData }
