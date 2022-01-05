import { ActionFunction, LoaderFunction } from 'remix'
import { githubClient } from '~/clients/github'
import { twitterClient } from '~/clients/twitter'

function makeTweetUrl(tweetId: string): string {
  return `https://twitter.com/ApiMocking/status/${tweetId}`
}

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
  const twitterUsername = user.twitter_username as string | undefined

  // Mention the sponsor's Twitter handle if set, otherwise use the link
  // to their GitHub profile.
  const userMention = twitterUsername ? `@${twitterUsername}` : user.html_url

  const tweetMessage = `Thank you for supporting us, ${user.login} (${userMention})!`

  console.log('creating the main tweet...')
  const tweetResponse = await twitterClient.v2.tweet(tweetMessage)
  const tweetId = tweetResponse.data.id
  const tweetUrl = makeTweetUrl(tweetId)

  console.log('successfully created the main tweet:', tweetUrl)

  const replyResponse = await twitterClient.v2.tweet(
    `\
Join ${user.login} to support the effort behind Mock Service Worker via GitHub Sponsors:

👉 https://github.com/sponsors/mswjs

Thank you!\
`,
    {
      reply: {
        in_reply_to_tweet_id: tweetId,
      },
    }
  )

  console.log(
    'successfully created a sponsorship suggestion reply:',
    makeTweetUrl(replyResponse.data.id)
  )

  return new Response(tweetUrl, { status: 201 })
}
