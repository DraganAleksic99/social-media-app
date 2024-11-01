import { Credentials } from './userService'
import { TComment } from '../views/post/NewsFeed'

type Params = {
  postId?: string
  userId?: string
}

const baseUrl = 'https://social-media-app-69re.onrender.com'

const listNewsFeed = async (params: Params, credentials: Credentials, signal: AbortSignal) => {
  try {
    const response = await fetch(baseUrl + '/api/posts/feed/' + params.userId, {
      method: 'GET',
      signal: signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + credentials.t
      }
    })
    
    return await response.json()
  } catch (err) {
    throw new Error("Something went wrong. Try again.")
  }
}

const loadPosts = async (params: Params, credentials: Credentials) => {
  try {
    const response = await fetch(baseUrl + '/api/post/by/' + params.userId, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + credentials.t
      }
    })

    return await response.json()
  } catch (err) {
    throw new Error("Something went wrong. Try again.")
  }
}

const createPost = async (params: Params, credentials: Credentials, post: FormData) => {
  try {
    const response = await fetch(baseUrl + '/api/posts/new/' + params.userId, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer ' + credentials.t
      },
      body: post
    })
    return await response.json()

  } catch (err) {
    throw new Error("Something went wrong. Try again.")
  }
}

const removePost = async (params: Params, credentials: Credentials) => {
  try {
    const response = await fetch(baseUrl + '/api/posts/delete/' + params.postId, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + credentials.t
      }
    })
    return await response.json()

  } catch (err) {
    throw new Error("Something went wrong. Try again.")
  }
}

const like = async (params: Params, credentials: Credentials, postId: string) => {
  try {
    const response = await fetch(baseUrl + '/api/posts/like', {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + credentials.t
      },
      body: JSON.stringify({ userId: params.userId, postId: postId })
    })

    return await response.json()
  } catch (err) {
    throw new Error("Something went wrong. Try again.")
  }
}

const unlike = async (params: Params, credentials: Credentials, postId: string) => {
  try {
    const response = await fetch(baseUrl + '/api/posts/unlike', {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + credentials.t
      },
      body: JSON.stringify({ userId: params.userId, postId: postId })
    })

    return await response.json()
  } catch (err) {
    throw new Error('Something went wrong. Try again.')
  }
}

const comment = async (
  params: Params,
  credentials: Credentials,
  postId: string,
  comment: TComment
) => {
  try {
    const response = await fetch(baseUrl + '/api/posts/comment/' + params.userId, {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + credentials.t
      },
      body: JSON.stringify({ postId: postId, comment: comment })
    })

    return await response.json()
  } catch (err) {
    throw new Error('Something went wrong. Try again.')
  }
}

const uncomment = async (
  params: Params,
  credentials: Credentials,
  postId: string,
  comment: TComment
) => {
  try {
    const response = await fetch(baseUrl + '/api/posts/uncomment', {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + credentials.t
      },
      body: JSON.stringify({ userId: params.userId, postId: postId, comment: comment })
    })

    return await response.json()
  } catch (err) {
    throw new Error('Something went wrong. Try again.')
  }
}

export { listNewsFeed, loadPosts, createPost, removePost, like, unlike, comment, uncomment }
