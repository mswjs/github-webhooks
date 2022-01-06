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

  const { data: githubUser } = await githubClient.users.getByUsername({
    username: sponsorship.sponsor.login,
  })
  const twitterHandle = githubUser.twitter_username as string | undefined
  const userMention = twitterHandle ? `@${twitterHandle}` : githubUser.login

  const tweetMessage = `\
Thank you for sponsoring us on GitHub, ${userMention}!
${githubUser.html_url}\
`

  console.log('creating the main tweet...')

  // Post a gratitude tweet for the new sponsor.
  const { data: tweet } = await twitterClient.v2.tweet(tweetMessage)
  const tweetUrl = makeTweetUrl(tweet.id)

  console.log('successfully created the main tweet:', tweetUrl)

  // Reply to the gratitude tweet with the instructions
  // on how to support Mock Service Worker.
  const { data: reply } = await twitterClient.v2.tweet(
    `\
Join ${githubUser.login} to support the effort behind Mock Service Worker via GitHub Sponsors:

👉 https://github.com/sponsors/mswjs

Thank you!`,
    {
      reply: {
        in_reply_to_tweet_id: tweet.id,
      },
    }
  )

  console.log(
    'successfully created a sponsorship suggestion reply:',
    makeTweetUrl(reply.id)
  )

  // Like the gratitude tweet.
  const { data: twitterUser } = await twitterClient.currentUserV2()
  await twitterClient.v2.like(twitterUser.id, tweet.id)

  return new Response(tweetUrl, { status: 201 })
}
