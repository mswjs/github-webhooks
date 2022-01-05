import { invariant } from 'outvariant'
import { TwitterApi } from 'twitter-api-v2'

const {
  TWITTER_APP_KEY,
  TWITTER_APP_SECRET,
  TWITTER_ACCESS_TOKEN,
  TWITTER_ACCESS_TOKEN_SECRET,
} = process.env

invariant(
  TWITTER_APP_KEY,
  'Failed to create a Twitter client: the "TWITTER_APP_KEY" environmental variable is not set.'
)
invariant(
  TWITTER_APP_SECRET,
  'Failed to create a Twitter client: the "TWITTER_APP_SECRET" environmental variable is not set.'
)
invariant(
  TWITTER_ACCESS_TOKEN,
  'Failed to create a Twitter client: the "TWITTER_ACCESS_TOKEN" environmental variable is not set.'
)
invariant(
  TWITTER_ACCESS_TOKEN_SECRET,
  'Failed to create a Twitter client: the "TWITTER_ACCESS_TOKEN_SECRET" environmental variable is not set.'
)

export const twitterClient = new TwitterApi({
  appKey: TWITTER_APP_KEY,
  appSecret: TWITTER_APP_SECRET,
  accessToken: TWITTER_ACCESS_TOKEN,
  accessSecret: TWITTER_ACCESS_TOKEN_SECRET,
})
