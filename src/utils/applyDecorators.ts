export default function applyDecorators(decorators: any[], fn: any) {
  let result = fn
  for (const decorator of decorators.reverse()) {
    result = decorator(result)
  }
  return result
}
