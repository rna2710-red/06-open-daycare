"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import CreatePostModal from "@/app/components/home/CreatePostModal";
import Toast from "@/app/components/shared/Toast";

interface PostComposerContextValue {
  openComposer: () => void;
}

const PostComposerContext = createContext<PostComposerContextValue | null>(null);

export function usePostComposer() {
  const ctx = useContext(PostComposerContext);
  if (!ctx) {
    throw new Error("usePostComposer must be used within PostComposerProvider");
  }
  return ctx;
}

export function PostComposerProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isToastVisible, setIsToastVisible] = useState(false);

  const openComposer = useCallback(() => setIsOpen(true), []);
  const closeModal = useCallback(() => setIsOpen(false), []);
  const handlePublish = useCallback(() => {
    setIsToastVisible(true);
    router.refresh();
  }, [router]);
  const handleToastClose = useCallback(() => setIsToastVisible(false), []);

  return (
    <PostComposerContext.Provider value={{ openComposer }}>
      {children}
      <CreatePostModal
        isOpen={isOpen}
        onClose={closeModal}
        onPublish={handlePublish}
      />
      <Toast
        message="Publicación enviada"
        isVisible={isToastVisible}
        onClose={handleToastClose}
      />
    </PostComposerContext.Provider>
  );
}
