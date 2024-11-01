import { signout } from './apiAuth'
import { TUser } from '../views/Profile'

export type Jwt = {
  token: string
  user: TUser
}

function authenticate(jwt: Jwt, cb: () => void) {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('jwt', JSON.stringify(jwt))
  }
  cb()
}

function isAuthenticated() {
  if (typeof window == 'undefined') return false
  if (sessionStorage.getItem('jwt')) return JSON.parse(sessionStorage.getItem('jwt'))
  else return false
}

function clearJWT(cb) {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('jwt')
  }
  cb()
  signout().then(() => {
    document.cookie = 't=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
  })
}

export default { authenticate, isAuthenticated, clearJWT }
