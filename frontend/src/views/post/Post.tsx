import { baseUrl } from '../../config/config'

import { SyntheticEvent, useEffect, useState } from 'react'
import { Link, useMatch, useLocation } from 'react-router-dom'
import { useQueryClient, useMutation, UseMutateFunction } from '@tanstack/react-query'

import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  CardMedia,
  Avatar,
  Typography,
  Button,
  IconButton,
  Collapse,
  Box,
  Snackbar,
  Dialog,
  styled
} from '@mui/material'

import {
  ChatBubbleOutline as ChatBubbleOutlineIcon,
  AssessmentOutlined as AssessmentOutlinedIcon,
  Close as CloseIcon
} from '@mui/icons-material'
import { motion, AnimatePresence } from 'framer-motion'
import Reply from '../../components/Reply'
import Comments from './Comments'
import BookmarkButton from '../../components/BookmarkButton'
import Tooltip from '../../components/Tooltip'
import LikeButton from '../../components/LikeButton'
import PostMenu from '../../components/PostMenu'

import { comment, incrementPostViews } from '../../services/postService'
import auth, { Session, createHandleFromEmail, useInView, formatDate, formatDateAndTime } from '../../utils/utils'
import { TUser } from '../../routes/Profile'
import { TFollowCallbackFn } from '../../components/FollowProfileButton'
import { TComment, TPost } from '../../routes/NewsFeed'

export const ActionButton = styled(Button)(({ theme }) => ({
  textTransform: 'none',
  color: theme.palette.text.secondary,
  borderRadius: '8px',
  paddingBlock: '3px',
  maxHeight: '34px'
}))

type Props = {
  post: TPost
  showComments?: boolean
  bookmarkedPostsIds?: string[]
  isOnDiscoverFeed: boolean
  commentMutation?: UseMutateFunction<
    {
      _id: string
      comments: TComment[]
    },
    Error,
    string,
    {
      previousPost: unknown
    }
  >
}

export default function Post({
  post,
  showComments,
  bookmarkedPostsIds,
  isOnDiscoverFeed,
  commentMutation
}: Props) {
  const queryClient = useQueryClient()
  const { user, token }: Session = auth.isAuthenticated()
  const match = useMatch('/user/:userId/post/:postId')
  const { ref, hasBeenViewed } = useInView({ threshold: 0.5 })
  const [isDialogOpen, setisDialogOpen] = useState(false)
  const location = useLocation()

  const [isFollowing, setIsFollowing] = useState<boolean>()
  const [showReplyButton, setShowReplyButton] = useState(false)
  const [likesCount, setLikesCount] = useState(post.likes.length)

  const [snackbarInfo, setSnackbarInfo] = useState({
    open: false,
    message: ''
  })

  const { mutate } = useMutation({
    mutationFn: async () => {
      return incrementPostViews(post._id, token)
    }
  })

  useEffect(() => {
    if (match) return
    if (location.pathname === '/bookmarks') return

    if (hasBeenViewed) {
      mutate()
    }
  }, [hasBeenViewed, mutate, match, location])

  const addCommentMutation = useMutation({
    mutationFn: async (text: string) => {
      return comment(user._id, token, post._id, { text })
    },
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: [isOnDiscoverFeed ? 'discover' : 'newsfeed', user, token]
      })

      const previousData = queryClient.getQueryData([
        isOnDiscoverFeed ? 'discover' : 'newsfeed',
        user,
        token
      ])

      queryClient.setQueryData(
        [isOnDiscoverFeed ? 'discover' : 'newsfeed', user, token],
        (oldPosts: TPost[]) => {
          const postToUpdate = oldPosts.find(oldPost => oldPost._id === post._id)

          postToUpdate.comments.length += 1

          const postToUpdateIndex = oldPosts.findIndex(oldPost => oldPost._id === post._id)

          return [
            ...oldPosts.slice(0, postToUpdateIndex),
            postToUpdate,
            ...oldPosts.slice(postToUpdateIndex + 1)
          ]
        }
      )

      return { previousData }
    },
    onError: (_err, _newPost, context) => {
      queryClient.setQueryData(
        [isOnDiscoverFeed ? 'discover' : 'newsfeed', user, token],
        context.previousData
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ['post'],
        refetchType: 'all'
      })

      queryClient.invalidateQueries({
        queryKey: [isOnDiscoverFeed ? 'discover' : 'newsfeed'],
        refetchType: 'all'
      })

      queryClient.invalidateQueries({
        queryKey: ['posts'],
        refetchType: 'all'
      })
    }
  })

  useEffect(() => {
    checkIsFollowing(post.postedBy)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkIsFollowing = (postUser: TUser) => {
    // @ts-expect-error todo: fix on backend
    const match = postUser?.followers?.some(id => id === user._id)
    setIsFollowing(match)
  }

  const followMutation = useMutation({
    mutationFn: async ({
      callbackFn,
      postUserId
    }: {
      callbackFn: TFollowCallbackFn
      postUserId: string
    }) => {
      return callbackFn(user._id, token, postUserId)
    },
    onSettled() {
      queryClient.invalidateQueries({ queryKey: ['profile'], refetchType: 'all' })
      queryClient.invalidateQueries({ queryKey: ['usersToFollow'], refetchType: 'all' })
      queryClient.invalidateQueries({ queryKey: ['post'], refetchType: 'all' })
      queryClient.invalidateQueries({ queryKey: ['newsfeed'], refetchType: 'inactive' })
      queryClient.invalidateQueries({ queryKey: ['discover'], refetchType: 'inactive' })
    },
    onSuccess: data => {
      setIsFollowing(!isFollowing)
      setSnackbarInfo({
        open: true,
        message: `You ${isFollowing ? 'unfollowed' : 'followed'} ${data.name}`
      })
    },
    onError() {
      setIsFollowing(!isFollowing)
      setSnackbarInfo({
        open: true,
        message: `Somenthing went wrong. Please try again.`
      })
    }
  })

  const handleFollowOrUnfollow = (callbackFn: TFollowCallbackFn, postUserId: string) => {
    followMutation.mutate({ callbackFn, postUserId })
  }

  return (
    <Card
      ref={ref}
      sx={{
        borderRadius: 0,
        '&:hover': {
          backgroundColor: `${match && match.params?.postId ? '' : 'rgb(246, 247, 248)'}`,
          '& .MuiCollapse-root': {
            backgroundColor: '#fff'
          }
        },
        borderBottom: match ? '' : '1px solid #e5e7eb'
      }}
    >
      <CardHeader
        sx={{ pb: 0, pt: '12px', alignItems: 'flex-start' }}
        avatar={
          <Link to={`/profile/${post.postedBy._id}`}>
            <Avatar
              src={baseUrl + '/api/users/photo/' + post.postedBy._id}
              alt={post.postedBy.name}
            />
          </Link>
        }
        action={
          <PostMenu
            post={post}
            isFollowing={isFollowing}
            redirectAfterDelete={!!match}
            handleFollowOrUnfollow={handleFollowOrUnfollow}
            setSnackbarInfo={setSnackbarInfo}
          />
        }
        title={
          <>
            <Link to={`/profile/${post.postedBy._id}`}>
              <span className="text-underline" style={{ fontWeight: 600, fontSize: '1rem' }}>
                {post.postedBy.name}
              </span>
            </Link>
            {match && match.params?.postId ? (
              ''
            ) : (
              <>
                {' '}
                <span style={{ fontSize: '1rem' }}>
                  {createHandleFromEmail(post.postedBy.email)}
                </span>
                {' • '}
                <span>{formatDate(post.created)}</span>
              </>
            )}
          </>
        }
        subheader={
          match && match.params?.postId ? <>{createHandleFromEmail(post.postedBy.email)}</> : ''
        }
        subheaderTypographyProps={{}}
      />

      <CardContent sx={{ p: 0, marginTop: `${match && match.params?.postId ? '8px' : '-16px'}` }}>
        <Box sx={{ pl: match && match.params?.postId ? '16px' : '72px', pr: 2 }}>
          <Typography variant="body1">{post.text}</Typography>

          {post.imagePreview && (
            <CardMedia
              component="img"
              image={post.imagePreview}
              alt="Post content"
              sx={{ objectFit: 'cover', border: '1px solid #e5e7eb', borderRadius: '12px', mt: 1 }}
            />
          )}

          {post.photo && (
            <CardMedia
              loading="lazy"
              height="100%"
              width="100%"
              component="img"
              image={baseUrl + '/api/posts/photo/' + post._id}
              alt="Post content"
              sx={{ objectFit: 'cover', border: '1px solid #e5e7eb', borderRadius: '12px', mt: 1 }}
            />
          )}
        </Box>
      </CardContent>

      {match && match.params?.postId && <Box mt="10px" ml={2}>
        {formatDateAndTime(post.created)}
        </Box>}

      {match && match.params?.postId && (
        <Box
          sx={{
            py: 1,
            mx: 2,
            mt: '10px',
            borderTop: '1px solid #e5e7eb',
            borderBottom: '1px solid #e5e7eb'
          }}
        >
          <Link to={match?.pathname + '/likedBy'} className="text-underline">
            <Typography component="span" sx={{ pr: 1, fontWeight: 600 }}>
              {likesCount}
            </Typography>
            {likesCount === 1 ? 'like' : 'likes'}
          </Link>
        </Box>
      )}

      <CardActions
        sx={{
          pl: match && match.params?.postId ? '8px' : '64px',
          py: '5px',
          pr: '8px',
          display: 'flex',
          justifyContent: 'space-between'
        }}
      >
        <LikeButton post={post} onLike={setLikesCount} isOnDiscoverFeed={isOnDiscoverFeed} />
        <Tooltip title="Reply" offset={-5}>
          <ActionButton
            sx={{
              borderRadius: '30px',
              '&:hover': {
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                '& .MuiButton-startIcon': {
                  color: 'rgb(33, 150, 243)'
                },
                '&': {
                  color: 'rgb(33, 150, 243)'
                }
              }
            }}
            startIcon={<ChatBubbleOutlineIcon />}
            onClick={e => {
              e.preventDefault()
              setShowReplyButton(!showReplyButton)
            }}
          >
            <Box display="flex" alignItems="center" pt="2px">
            <AnimatePresence initial={false} mode="wait" >
            <motion.span
              key={post.comments.length}
              initial={{ y: -7 }}
              animate={{ y: 0 }}
              exit={{ y: 7 }}
              transition={{ duration: 0.1, ease: 'easeOut' }}
            >
              {post.comments.length}
            </motion.span>
          </AnimatePresence>
            </Box>
          </ActionButton>
        </Tooltip>
        <Tooltip title="View" offset={-5}>
          <ActionButton
            sx={{
              borderRadius: '30px',
              '&:hover': {
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                '& .MuiButton-startIcon': {
                  color: 'rgb(33, 150, 243)'
                },
                '&': {
                  color: 'rgb(33, 150, 243)'
                }
              }
            }}
            startIcon={<AssessmentOutlinedIcon />}
            onClick={e => {
              e.preventDefault()
              setisDialogOpen(true)
            }}
          >
            <Box display="flex" alignItems="center" pt="2px">
              {post.views ?? 0}
            </Box>
          </ActionButton>
        </Tooltip>
        <BookmarkButton
          bookmarkedPostsIds={bookmarkedPostsIds}
          post={post}
          setSnackbarInfo={setSnackbarInfo}
        />
      </CardActions>
      {showComments && (
        <>
          <Reply commentMutation={commentMutation} />
          <Box sx={{ borderTop: '1px solid #e5e7eb', borderRadius: 0 }}>
            <Comments
              postId={post._id}
              comments={post.comments}
              isFollowing={isFollowing}
              handleFollowOrUnfollow={handleFollowOrUnfollow}
              isOnDiscoverFeed={isOnDiscoverFeed}
            />
          </Box>
        </>
      )}
      {!showComments && (
        <Collapse in={showReplyButton} timeout="auto" unmountOnExit>
          <Reply commentMutation={addCommentMutation.mutate} />
        </Collapse>
      )}
      <Snackbar
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center'
        }}
        sx={{
          '& .MuiPaper-root': {
            bgcolor: '#2196F3',
            color: '#fff',
            borderRadius: '12px',
            fontSize: '1.1rem', 
          },
          width: 'fit-content'
        }}
        onClose={() => setSnackbarInfo({ open: false, message: '' })}
        open={snackbarInfo.open}
        autoHideDuration={6000}
        message={<span>{snackbarInfo.message}</span>}
      />
      <Dialog
        PaperProps={{
          style: {
            borderRadius: '12px'
          }
        }}
        open={isDialogOpen}
        onClose={(e: SyntheticEvent) => {
          e.preventDefault()
          setisDialogOpen(false)
        }}
      >
        <Box p={1} borderBottom="1px solid #e5e7eb">
          <IconButton
            sx={{
              color: 'rgb(33, 150, 243)',
              textTransform: 'none',
              fontWeight: 500,
              px: 1,
              borderRadius: '20px',
              '&:hover': {
                backgroundColor: 'rgba(33, 150, 243, 0.1)'
              }
            }}
            onClick={e => {
              e.preventDefault()
              setisDialogOpen(false)
            }}
          >
            <CloseIcon fontSize="medium" />
          </IconButton>
          <Box p={10} pt={5}>
            <Typography variant="h2" fontWeight="bold">
              Views
            </Typography>
            <Typography variant="body1">
              Times this post was seen. To learn more, visit the Help Center.
            </Typography>
            <Button
              disableRipple
              disableElevation
              variant="contained"
              sx={{
                backgroundColor: 'rgb(33, 150, 243)',
                borderRadius: '30px',
                textTransform: 'none',
                width: '100%',
                height: '50px',
                mt: 4,
                px: 2,
                fontSize: {
                  lg: '1.1rem'
                },
                fontWeight: 500
              }}
              onClick={e => {
                e.preventDefault()
                setisDialogOpen(false)
              }}
            >
              Dismiss
            </Button>
          </Box>
        </Box>
      </Dialog>
    </Card>
  )
}
