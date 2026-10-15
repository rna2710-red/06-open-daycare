"use server";

import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export type PostType =
  | "meal"
  | "nap"
  | "activity"
  | "achievement"
  | "photo"
  | "announcement";

const POST_TYPES: PostType[] = [
  "meal",
  "nap",
  "activity",
  "achievement",
  "photo",
  "announcement",
];

const MAX_PHOTOS = 10;
const FEED_LIMIT = 50;
const SIGNED_URL_EXPIRES_SECONDS = 3600;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface CreatePostInput {
  type: PostType;
  body: string;
  /** Presente cuando la audiencia es "Toda la sala". */
  roomId?: string;
  /** Presente cuando la audiencia son niños específicos. */
  childIds?: string[];
  /** "Toda la guardería": type='announcement', sin roomId ni childIds. */
  photos: { path: string; width?: number; height?: number }[];
}

export type CreatePostResult =
  | { success: true; postId: string }
  | { success: false; error: string };

export interface FeedPost {
  id: string;
  type: PostType;
  authorName: string;
  publishedByYou: boolean;
  audienceLabel: string;
  text: string;
  photoUrls: string[];
  time: string; // HH:MM local
}

export interface PostComposerOptions {
  rooms: { id: string; name: string }[];
  children: { id: string; fullName: string; roomId: string }[];
}

async function getSessionProfile() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, profile: null };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, role, daycare_id, full_name")
    .eq("id", user.id)
    .maybeSingle();

  return { supabase, user, profile };
}

export async function getPostOptions(): Promise<PostComposerOptions | null> {
  const { supabase, profile } = await getSessionProfile();

  if (!profile || !profile.daycare_id) {
    return null;
  }

  const [roomsResult, childrenResult] = await Promise.all([
    supabase.from("rooms").select("id, name").order("name"),
    supabase
      .from("children")
      .select("id, full_name, room_id")
      .eq("status", "active")
      .order("full_name"),
  ]);

  if (roomsResult.error || childrenResult.error) {
    return null;
  }

  return {
    rooms: roomsResult.data ?? [],
    children: (childrenResult.data ?? []).map((child) => ({
      id: child.id,
      fullName: child.full_name,
      roomId: child.room_id,
    })),
  };
}

export async function createPost(
  input: CreatePostInput
): Promise<CreatePostResult> {
  const body = input.body.trim();

  if (!POST_TYPES.includes(input.type)) {
    return { success: false, error: "Tipo de publicación no válido." };
  }

  if (!body) {
    return {
      success: false,
      error: "Escribí una descripción para la publicación.",
    };
  }

  if (input.photos.length > MAX_PHOTOS) {
    return {
      success: false,
      error: `Podés subir hasta ${MAX_PHOTOS} fotos.`,
    };
  }

  const hasRoom = Boolean(input.roomId);
  const childIds = (input.childIds ?? []).filter(Boolean);

  if (input.type !== "announcement" && !hasRoom && childIds.length === 0) {
    return {
      success: false,
      error: "Elegí una sala o al menos un niño para la publicación.",
    };
  }

  if (input.roomId && !UUID_REGEX.test(input.roomId)) {
    return { success: false, error: "Sala no válida." };
  }

  for (const childId of childIds) {
    if (!UUID_REGEX.test(childId)) {
      return { success: false, error: "Niño no válido." };
    }
  }

  const { supabase, user, profile } = await getSessionProfile();

  if (!user || !profile) {
    return { success: false, error: "Tu sesión expiró. Volvé a iniciar sesión." };
  }

  if (profile.role !== "staff" || !profile.daycare_id) {
    return {
      success: false,
      error: "Solo el staff de la guardería puede publicar.",
    };
  }

  if (input.roomId) {
    const { data: room } = await supabase
      .from("rooms")
      .select("id, daycare_id")
      .eq("id", input.roomId)
      .maybeSingle();

    if (!room || room.daycare_id !== profile.daycare_id) {
      return { success: false, error: "La sala seleccionada no existe." };
    }
  }

  if (childIds.length > 0) {
    const { data: children } = await supabase
      .from("children")
      .select("id, rooms(daycare_id)")
      .in("id", childIds);

    const validIds = new Set(
      (children ?? [])
        .flatMap((child) => {
          const room = Array.isArray(child.rooms)
            ? child.rooms[0]
            : child.rooms;
          return room?.daycare_id === profile.daycare_id ? [child.id] : [];
        })
    );

    if (validIds.size !== childIds.length) {
      return {
        success: false,
        error: "Alguno de los niños seleccionados no existe.",
      };
    }
  }

  const { data: post, error: postError } = await supabase
    .from("posts")
    .insert({
      author_id: user.id,
      room_id: hasRoom ? input.roomId : null,
      type: input.type,
      body,
      published_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (postError || !post) {
    return {
      success: false,
      error: "No se pudo crear la publicación. Probá de nuevo.",
    };
  }

  if (childIds.length > 0) {
    const { error: childrenError } = await supabase.from("post_children").insert(
      childIds.map((childId) => ({
        post_id: post.id,
        child_id: childId,
      }))
    );

    if (childrenError) {
      return {
        success: false,
        error: "No se pudieron etiquetar los niños. Probá de nuevo.",
      };
    }
  }

  if (input.photos.length > 0) {
    const { error: photosError } = await supabase.from("post_photos").insert(
      input.photos.map((photo, index) => ({
        post_id: post.id,
        url: photo.path,
        width: photo.width ?? null,
        height: photo.height ?? null,
        position: index,
      }))
    );

    if (photosError) {
      return {
        success: false,
        error: "No se pudieron guardar las fotos. Probá de nuevo.",
      };
    }
  }

  return { success: true, postId: post.id };
}

function buildAudienceLabel(
  post: {
    type: PostType;
    roomName: string | null;
    childNames: string[];
  }
): string {
  if (post.childNames.length === 1) {
    return `familia de ${post.childNames[0]}`;
  }

  if (post.childNames.length > 1) {
    return `familias de ${post.childNames.join(", ")}`;
  }

  if (post.roomName) {
    return "toda la sala";
  }

  return "toda la guardería";
}

export async function getFeedPosts(): Promise<FeedPost[]> {
  const { supabase, user, profile } = await getSessionProfile();

  if (!user || !profile?.daycare_id) {
    return [];
  }

  const { data: posts, error } = await supabase
    .from("posts")
    .select(
      `
      id,
      type,
      body,
      published_at,
      author_id,
      rooms(name),
      post_children(children(full_name)),
      post_photos(url, position)
    `
    )
    .order("published_at", { ascending: false })
    .limit(FEED_LIMIT);

  if (error || !posts) {
    return [];
  }

  const allPhotoPaths = posts.flatMap((post) =>
    (post.post_photos ?? [])
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((photo) => photo.url)
      .filter(Boolean)
  );

  const signedUrlByPath = new Map<string, string>();

  if (allPhotoPaths.length > 0) {
    const { data: signedUrls } = await supabase.storage
      .from("post-photos")
      .createSignedUrls(allPhotoPaths, SIGNED_URL_EXPIRES_SECONDS);

    for (const signed of signedUrls ?? []) {
      if (signed.path && signed.signedUrl) {
        signedUrlByPath.set(signed.path, signed.signedUrl);
      }
    }
  }

  const { data: authorNames } = await supabase
    .from("users")
    .select("id, full_name")
    .in(
      "id",
      posts.map((post) => post.author_id)
    );

  const authorNameById = new Map(
    (authorNames ?? []).map((author) => [author.id, author.full_name])
  );

  return posts.map((post) => {
    const room = Array.isArray(post.rooms) ? post.rooms[0] : post.rooms;
    const childNames = (post.post_children ?? [])
      .flatMap((entry) => {
        const child = Array.isArray(entry.children)
          ? entry.children[0]
          : entry.children;
        return child?.full_name ? [child.full_name] : [];
      })
      .filter((name, index, names) => names.indexOf(name) === index);

    const photoUrls = (post.post_photos ?? [])
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((photo) => signedUrlByPath.get(photo.url))
      .filter((url): url is string => Boolean(url));

    return {
      id: post.id,
      type: post.type as PostType,
      authorName: authorNameById.get(post.author_id) ?? "",
      publishedByYou: post.author_id === user.id,
      audienceLabel: buildAudienceLabel({
        type: post.type as PostType,
        roomName: room?.name ?? null,
        childNames,
      }),
      text: post.body,
      photoUrls,
      time: new Date(post.published_at).toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    };
  });
}
