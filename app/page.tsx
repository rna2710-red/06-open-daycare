import { Sidebar } from "@/app/components/shared/Sidebar";
import { PostCard } from "@/app/components/home/PostCard";
import { classroom, posts, user } from "@/lib/mock/feed";

const cameraIcon = (
  <svg
    width="19"
    height="19"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

export default function HomePage() {
  return (
    <div className="flex h-dvh flex-col bg-fondo md:flex-row">
      <Sidebar itemActivo="feed" />
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[760px] px-5 pb-20 pt-[34px] md:px-10">
          <section className="mb-6">
            <p className="mb-1 text-[12.5px] font-extrabold tracking-[.8px] text-acento">
              GUARDERÍA · {classroom.name.toUpperCase()}
            </p>
            <h1 className="font-display text-[30px] font-semibold text-tinta">
              Buenas, {user.name.split(" ")[0]}
            </h1>
            <p className="mt-[5px] text-[14.5px] text-tinta-suave">
              {classroom.childrenCount} niños · {classroom.today}
            </p>
          </section>

          <a
            href="#"
            className="mb-6 flex items-center gap-3.5 rounded-[18px] border border-borde bg-superficie px-[18px] py-3.5 shadow-[0_4px_14px_-10px_rgba(120,90,60,.4)]"
          >
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-coral-medio font-display text-base font-semibold text-white">
              {user.initial}
            </span>
            <span className="flex-1 text-[15px] text-tinta-mute">
              Compartí un momento…
            </span>
            <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[12px] bg-acento-suave text-acento-medio">
              {cameraIcon}
            </span>
          </a>

          <div className="mb-3.5 flex items-center gap-3.5">
            <span className="text-[12.5px] font-extrabold tracking-[.8px] text-[#8A7C6D]">
              PUBLICADO HOY
            </span>
            <span className="h-px flex-1 bg-[#E7DAC8]" />
          </div>

          <div className="flex flex-col gap-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
