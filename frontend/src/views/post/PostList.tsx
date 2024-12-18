import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Box, Typography } from '@mui/material'
import Post from './Post'
import Spinner from '../../components/Spinner'
import { getBookmarksIds } from '../../services/userService'
import auth, { Session } from '../../utils/utils'
import { TPost } from '../../routes/NewsFeed'

type Props = {
  posts: TPost[]
  arePostsPending: boolean
  isOnDiscoverFeed: boolean
}

export default function PostList({ posts, arePostsPending, isOnDiscoverFeed }: Props) {
  const { user, token }: Session = auth.isAuthenticated()

  const { data } = useQuery({
    queryKey: ['ids', user, token],
    queryFn: async () => {
      return getBookmarksIds(user._id, token)
    },
    staleTime: Infinity
  })

  return (
    <div
      style={{
        minHeight: '100vh',
      }}
    >
      {arePostsPending && <Spinner />}
      {posts?.map(post => (
        <Link
          to={`/user/${post.postedBy._id}/post/${post._id}`}
          key={post._id}
          state={{ bookmarkedPostsIds: data, isFromDiscoverFeed: isOnDiscoverFeed ?? false }}
          unstable_viewTransition
        >
          <Post post={post} bookmarkedPostsIds={data} isOnDiscoverFeed={isOnDiscoverFeed} />
        </Link>
      ))}
      {!arePostsPending && posts.length !== 0 && (
        <Box
          height="15vh"
          display="flex"
          justifyContent="center"
          alignItems="center"
          sx={{ backgroundColor: '#fff' }}
        >
          <Typography variant="inherit" color="textSecondary">
            End of feed.
          </Typography>
        </Box>
      )}
    </div>
  )
}
