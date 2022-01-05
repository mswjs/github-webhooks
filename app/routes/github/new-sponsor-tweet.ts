import { ActionFunction, LoaderFunction } from 'remix'
import { githubClient } from '~/clients/github'
import { twitterClient } from '~/clients/twitter'

export const loader: LoaderFunction = () => {
  return new Response('Only "POST" requests are supported.', { status: 405 })
}

export const action: ActionFunction = async ({ request }) => {
  const { action, hook, sponsorship } = await request.json()

  if (hook.config.secret !== process.env.GITHUB_WEBHOOK_SECRET) {
    return new Response('Missing or invalid webhook secret.', { status: 403 })
  }

  if (action !== 'created') {
    return new Response(`Unknown sponsorship action "${action}", ignoring.`, {
      status: 200,
    })
  }

  if (sponsorship !== 'public') {
    return new Response('Ignoring a private sponsorship.')
  }

  if (sponsorship.tier.is_one_time) {
    return new Response('Only monthly sponsors get Twitter shoutouts.')
  }

  const userResponse = await githubClient.users.getByUsername({
    username: sponsorship.sponsor.login,
  })
  const { data: user } = userResponse
  const twitterUsername = user.twitter_username

  // Mention the sponsor's Twitter handle if set, otherwise use the link
  // to their GitHub profile.
  const userMention = twitterUsername ? `@${twitterUsername}` : user.html_url

  const tweetMessage = `Thank you for supporting us, ${user.login} (${userMention})! We are honored to have you as a new ${sponsorship.tier.name}!`

  const res = await twitterClient.v2.tweet(tweetMessage)
  const tweetUrl = `https://twitter.com/ApiMocking/status/${res.data.id}`

  return new Response(tweetUrl, { status: 201 })
}
