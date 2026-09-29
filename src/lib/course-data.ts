import { storefrontContent } from './course-content';

export const courses = [
  {
    id: storefrontContent.course.id,
    name: storefrontContent.course.title,

    // Public teaser asset. Replace the placeholder thumbnail before launch.
    teaserVideoUrl: 'https://www.dailymotion.com/video/k5h8UClWDwJi8tEegYu',
    teaserThumbnailUrl: 'https://picsum.photos/seed/teaser/1280/720',

    // Do not add the paid full-video URL to this client-imported module.
    // Store private media provider/asset identifiers in server-only config instead.
    fullThumbnailUrl: 'https://picsum.photos/seed/full/1280/720',
  },
];
