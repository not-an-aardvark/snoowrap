const isAxiosResponse = (obj: any) => {
  if (
    obj &&
    typeof obj === 'object' &&
    'data' in obj &&
    'status' in obj &&
    'statusText' in obj &&
    'headers' in obj &&
    'config' in obj
  ) {
    return true
  }
  return false
}

export default isAxiosResponse
export type {AxiosResponse} from '../axiosCreate'
