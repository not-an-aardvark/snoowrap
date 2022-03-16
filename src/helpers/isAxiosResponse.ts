const isAxiosResponse = (obj: any) => {
  if (
    obj.data &&
    obj.status &&
    obj.statusText &&
    obj.headers &&
    obj.config
  ) {
    return true
  }
  return false
}

export default isAxiosResponse
