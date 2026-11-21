export const storefrontContent = {
  product: {
    priceUsd: 22.3,
    currency: 'USD',
    billing: 'One-time access · Instant unlock',
    reviewsCount: 1302,
    rating: 4.7,
    paymentUrl: 'https://pay.blunt.cash/buy/bigger-energy',
  },
  course: {
    id: 'eggplant-method-v1',
    title: 'Viral 2 Step Big Dick Growth Method 2025',
    headline: 'SIZE DOESN’T MATTER? STOP COPING.',
    subheadline: 'The biology doesn’t lie, even if she does. The only 2-step fix based on human anatomy.',
    subtitle: 'The Simple 2-Step Method to Naturally Boost Length & Girth',
    summary:
      'Let’s cut through the noise. No pills. No surgery. No awkward gadgets. No sketchy exercises. Just a science-backed method that’s helping thousands of men in 2025 get serious results—safely and naturally.',
    socialProofClaim:
      'We’re talking about a straightforward 2-step system that’s now been tested by over 6,700 men, with real, visible growth. It’s based on human biology, not hype. 🔥',
    callToAction:
      'Get the full 11-minute video for how it all works—no fluff, no hard sell, just clear steps that deliver. Have questions or want to share your results? I’m always on Instagram. Shoot me a message—I’ll personally reply. 📩 Take the first step.',
    duration: '11-minute video',
    format: 'Private masterclass stream',
    includes: [
      'Full 11-minute un-cut video masterclass',
      'Step-by-step biological expansion regimen',
      'Instant private email delivery via encrypted token',
      'Permanent lifetime access · Zero recurring charges',
    ],
    teaserVideoUrl:
      process.env.NEXT_PUBLIC_MUX_TEASER_URL ||
      'https://player.mux.com/ac3dvpgq7mCwBZaa7eQQd7EhtvlFzc5xEY9j3c02W4DE',
    teaserPlaybackId:
      process.env.NEXT_PUBLIC_MUX_TEASER_PLAYBACK_ID ||
      'ac3dvpgq7mCwBZaa7eQQd7EhtvlFzc5xEY9j3c02W4DE',
    fullVideoPlaybackId:
      process.env.MUX_PLAYBACK_ID ||
      'tNGocfMgHTDM2201au01Q9mtKRc02qN8tkfUFcvFY01NOEo',
    teaserThumbnailUrl: '/images/teaser-thumbnail.png',
    heroImageSunset: '/images/hero-4.png',
  },
  reviews: [
    {
      id: 1,
      name: 'John.pact2',
      review:
        'Thought this was useless but had it for a week 2 and I can definitely feel and see some change. I salute ✅',
      verified: true,
      rating: 5,
      date: '2 days ago',
    },
    {
      id: 2,
      name: 'Mike_Veritas',
      review:
        'Surprised as hell... the proof is undeniably real. Followed the 2 steps strictly every morning. The tape measure does not lie.',
      verified: true,
      rating: 5,
      date: '5 days ago',
    },
    {
      id: 3,
      name: 'Marcus_T88',
      review:
        'No sketchy pills, no hospital visits, no goofy pumps. Pure anatomical mechanics that actually expand tissue density. Best $22 I ever spent in my life.',
      verified: true,
      rating: 5,
      date: '1 week ago',
    },
    {
      id: 4,
      name: 'Dave.K_FL',
      review:
        'Gained noticeable girth in the first month. The confidence shift in the bedroom is genuinely unreal. My girl noticed without me saying anything.',
      verified: true,
      rating: 5,
      date: '2 weeks ago',
    },
  ],
  creator: {
    name: 'Joshua Hiett',
    age: 32,
    location: 'Fish Lake, Tampa, Florida',
    startingLength: '3.8" fully hard',
    currentLength: '8.87"',
    currentGirth: '1.98"',
    growthTimeline: 'First 3 months',
    biography: [
      'Joshua Hiett, a 32-year-old from Fish Lake, Tampa, Florida. My journey started in 2023 after years of battling body dysmorphia, insecurity, and low self-esteem due to a size of 3.8 inches fully hard (yeah I know). This struggle led to a lot of failed relationships and quite frankly depression and reclusiveness. I tried pills, one of which caused severe stomach issues, landing me in the hospital. Exercises were ineffective, and surgery was too invasive for my conservative mindset.',
      'Desperate for a change, I got circumcised then dove into researching body, muscular, and tissue structure, as well as social, genetic, and hormonal factors. After piecing together the right regimen, I saw remarkable growth in the first 3 months and now I’m measuring 8.87 inches in length and 1.98 inches in girth, and still growing.',
      'The results transformed my life. I regained my confidence and my social life has never been better. Sharing my success with friends, I saw their lives improve too. Now, I’m putting myself out there with zero fear. My body count has been steadily increasing, with many women coming back, and some fully committed to me.',
      'I’m not bragging; I’m extremely happy and believe this method can help anyone.',
    ],
    disclosure:
      'This personal story and all health, measurement, and outcome statements are transcribed directly from creator-reported records. Results reflect individual anatomy and regimen consistency.',
    portraitUrl: null as string | null,
    instagramHandle: '@joshuahiett',
    socialUrl: 'https://instagram.com',
  },
} as const;
