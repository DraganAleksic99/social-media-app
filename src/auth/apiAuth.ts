const baseUrl = 'https://social-media-app-e2ia.onrender.com'

const signin = async user => {
  try {
    const response = await fetch(baseUrl + '/auth/signin/', {
      mode: 'no-cors',
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(user)
    })
    return await response.json()
  } catch (err) {
    console.log(err)
  }
}

const signout = async () => {
  try {
    const response = await fetch(baseUrl + '/auth/signout/', { method: 'GET' })
    return await response.json()
  } catch (err) {
    console.log(err)
  }
}

export { signin, signout }
