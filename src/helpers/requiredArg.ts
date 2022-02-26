export default function requiredArg (argName: string): any {
  throw new TypeError(`Missing required argument ${argName}`)
}
