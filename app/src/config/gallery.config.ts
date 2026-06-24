// ============================================================
// Instagram Gallery Section -> Code Snippet Gallery
// ============================================================

export interface InstagramImage {
  id: number;
  image: string;
  likes: number;
}

export interface InstagramGalleryConfig {
  handle: string;
  handleUrl: string;
  description: string;
  followText: string;
  likesSuffix: string;
  images: InstagramImage[];
}

export const instagramGalleryConfig: InstagramGalleryConfig = {
  handle: "@techink_dev",
  handleUrl: "#",
  description: "关注我们的代码片段画廊，每日精选编程灵感",
  followText: "关注我们",
  likesSuffix: "赞",
  images: [
    { id: 1, image: "/images/gallery-1.jpg", likes: 1247 },
    { id: 2, image: "/images/gallery-2.jpg", likes: 892 },
    { id: 3, image: "/images/gallery-3.jpg", likes: 2156 },
    { id: 4, image: "/images/gallery-4.jpg", likes: 1567 },
    { id: 5, image: "/images/gallery-5.jpg", likes: 983 },
    { id: 6, image: "/images/gallery-6.jpg", likes: 1876 },
    { id: 7, image: "/images/gallery-7.jpg", likes: 743 },
    { id: 8, image: "/images/gallery-8.jpg", likes: 1324 },
    { id: 9, image: "/images/gallery-9.jpg", likes: 1654 },
    { id: 10, image: "/images/gallery-10.jpg", likes: 2109 },
  ],
};
