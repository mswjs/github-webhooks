import { ActionFunction, LoaderFunction } from 'remix'
import { githubClient } from '~/clients/github'
import { twitterClient } from '~/clients/twitter'

export const loader: LoaderFunction = () => {
  return new Response('Only "POST" requests are supported.', { status: 405 })
}

export const action: ActionFunction = async ({ request }) => {
  if (
    request.headers.get('X-GitHub-Hook-ID') !== process.env.GITHUB_WEBHOOK_ID
  ) {
    return new Response('Missing or invalid hook ID.', { status: 403 })
  }

  const { action, sponsorship } = await request.json()

  if (action !== 'created') {
    return new Response(`Unknown sponsorship action "${action}", ignoring.`, {
      status: 200,
    })
  }

  if (sponsorship.privacy_level !== 'public') {
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

  const tweetMessage = `Thank you for supporting us, ${user.login} (${userMention})!`
  const res = await twitterClient.v2.tweet(tweetMessage)
  const tweetUrl = `https://twitter.com/ApiMocking/status/${res.data.id}`

  return new Response(tweetUrl, { status: 201 })
}
