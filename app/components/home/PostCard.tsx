import type { FeedPost, PostType } from "@/app/actions/posts";

interface PostCardProps {
  post: FeedPost;
}

const badgeByType: Record<PostType, { label: string; className: string }> = {
  meal: {
    label: "COMIDA",
    className: "bg-badge-meal-fondo text-badge-meal",
  },
  nap: {
    label: "SIESTA",
    className: "bg-badge-nap-fondo text-badge-nap",
  },
  activity: {
    label: "ACTIVIDAD",
    className: "bg-badge-actividad-fondo text-badge-actividad",
  },
  achievement: {
    label: "LOGRO",
    className: "bg-badge-logro-fondo text-badge-logro",
  },
  photo: {
    label: "FOTO",
    className: "bg-badge-photo-fondo text-badge-photo",
  },
  announcement: {
    label: "ANUNCIO",
    className: "bg-badge-anuncio-fondo text-badge-anuncio",
  },
};

const megaphoneIcon = (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m3 11 18-5v12L3 14v-3zM11.6 16.8a3 3 0 1 1-5.8-1.6" />
  </svg>
);

const heartIcon = (
  <svg
    width="19"
    height="19"
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" />
  </svg>
);

const commentIcon = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" />
  </svg>
);

export function PostCard({ post }: PostCardProps) {
  const badge = badgeByType[post.type];
  const isAnnouncement = post.type === "announcement";

  return (
    <article className="rounded-[20px] border border-borde bg-superficie px-[22px] py-5 shadow-[0_4px_16px_-12px_rgba(120,90,60,.5)]">
      <header className="mb-3.5 flex items-center gap-3">
        {isAnnouncement ? (
          <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-avatar-anuncio text-avatar-anuncio-tinta">
            {megaphoneIcon}
          </span>
        ) : (
          <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-avatar-nino font-display text-[17px] font-semibold text-avatar-nino-tinta">
            {post.authorName.charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="font-display text-[16.5px] font-semibold text-tinta">
            {isAnnouncement ? "Anuncio general" : post.authorName}
          </div>
          <div className="text-[12.5px] text-tinta-mute">
            {post.publishedByYou ? `${post.time} · publicado por vos` : post.time}
          </div>
        </div>
        <span
          className={`flex items-center gap-[7px] rounded-full px-3 py-1.5 text-xs font-extrabold tracking-[.5px] ${badge.className}`}
        >
          <span className="h-2 w-2 rounded-full bg-current" />
          {badge.label}
        </span>
      </header>

      <div className="mb-2.5 text-[12.5px] text-tinta-mute">
        Para: {post.audienceLabel}
      </div>

      <p className="text-[15.5px] leading-[1.55] text-[#4A4038]">{post.text}</p>

      {post.photoUrls.length > 0 && (
        <div
          className="mt-3.5 grid gap-2"
          style={{
            gridTemplateColumns:
              post.photoUrls.length === 1 ? "1fr" : "repeat(2, 1fr)",
          }}
        >
          {post.photoUrls.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={url}
              alt="Foto de la publicación"
              className="h-[200px] w-full rounded-2xl object-cover"
            />
          ))}
        </div>
      )}

      <footer className="mt-4 flex items-center gap-[18px] border-t border-borde-suave pt-3.5">
        <span className="flex items-center gap-[7px] text-sm font-bold text-acento-medio">
          {heartIcon}
          0
        </span>
        <span className="flex items-center gap-[7px] text-sm font-bold text-tinta-suave">
          {commentIcon}
          0
        </span>
      </footer>
    </article>
  );
}
