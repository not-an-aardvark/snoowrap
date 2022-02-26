import FormDataNode from 'form-data'
import isBrowser from './isBrowser'

const FormData: typeof FormDataNode = isBrowser ? self.FormData as any : FormDataNode
export default FormData
