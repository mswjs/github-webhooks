import { ActionFunction } from 'remix'
import { githubClient } from '~/clients/github'
import { twitterClient } from '~/clients/twitter'

export const action: ActionFunction = async ({ request }) => {
  const { action, sponsorship } = await request.json()

  // This webhook reacts only to new sponsors.
  if (action.toLowerCase() !== 'created') {
    return new Response(null, { status: 405 })
  }

  const userResponse = await githubClient.users.getByUsername({
    username: sponsorship.sponsor.login,
  })
  const { data: user } = userResponse

  const twitterUsername = user.twitter_username
  const userMention = twitterUsername ? `@${twitterUsername}` : user.html_url

  const tweetMessage = `Thank you for sponsoring us, ${user.login} (${userMention})!`
  const res = await twitterClient.v2.tweet(tweetMessage)
  const tweetUrl = `https://twitter.com/ApiMocking/status/${res.data.id}`

  return new Response(tweetUrl, { status: 201 })
}
