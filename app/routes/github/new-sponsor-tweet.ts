import { ActionFunction, LoaderFunction } from 'remix'
import { githubClient } from '~/clients/github'
import { twitterClient } from '~/clients/twitter'

export const loader: LoaderFunction = () => {
  return new Response('Only "POST" requests are supported.', { status: 405 })
}

export const action: ActionFunction = async ({ request }) => {
  const { hook, sender } = await request.json()

  if (hook.type !== '???') {
    return new Response(`Unknown hook type "${hook.type}", doing nothing.`, {
      status: 200,
    })
  }

  if (hook.config.secret !== process.env.GITHUB_WEBHOOK_SECRET) {
    return new Response('Missing or invalid webhook secret.', { status: 403 })
  }

  const userResponse = await githubClient.users.getByUsername({
    username: sender.login,
  })
  const { data: user } = userResponse

  const twitterUsername = user.twitter_username
  const userMention = twitterUsername ? `@${twitterUsername}` : user.html_url

  const tweetMessage = `Thank you for sponsoring us, ${user.login} (${userMention})!`
  const res = await twitterClient.v2.tweet(tweetMessage)
  const tweetUrl = `https://twitter.com/ApiMocking/status/${res.data.id}`

  return new Response(tweetUrl, { status: 201 })
}
