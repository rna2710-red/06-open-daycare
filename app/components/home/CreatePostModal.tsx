"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { postTypes, type PostCategory } from "@/lib/mock/feed";
import {
  createPost,
  getPostOptions,
  type PostComposerOptions,
} from "@/app/actions/posts";
import { useUser } from "@/app/providers";
import { createClient } from "@/utils/supabase/client";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: () => void;
}

const MAX_PHOTOS = 10;
const MAX_PHOTO_BYTES = 4 * 1024 * 1024;
const ACCEPTED_PHOTO_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const AVATAR_COLORS = [
  { bg: "#A9D9E8", text: "#1F7A93" },
  { bg: "#F4B8CC", text: "#C44A7A" },
  { bg: "#B9DEC4", text: "#3E8B62" },
  { bg: "#F5D5A8", text: "#9A7B1E" },
  { bg: "#C9B6E8", text: "#7B5FC0" },
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

type Audience =
  | { kind: "children"; childIds: string[] }
  | { kind: "all-room" }
  | { kind: "all-daycare" }
  | null;

interface PhotoPreview {
  file: File;
  previewUrl: string;
}

export default function CreatePostModal({
  isOpen,
  onClose,
  onPublish,
}: CreatePostModalProps) {
  const { profile, loading: profileLoading } = useUser();
  const [options, setOptions] = useState<PostComposerOptions | null>(null);
  const [optionsLoaded, setOptionsLoaded] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [audience, setAudience] = useState<Audience>(null);
  const [selectedType, setSelectedType] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [error, setError] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const audienceLabelId = useId();
  const roomLabelId = useId();
  const typeLabelId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  const resetForm = useCallback(() => {
    setSelectedRoomId("");
    setAudience(null);
    setSelectedType("");
    setDescription("");
    setPhotos([]);
    setError("");
  }, []);

  const handleClose = useCallback(() => {
    if (isPublishing) return;
    resetForm();
    onClose();
  }, [isPublishing, onClose, resetForm]);

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
  }, [isOpen, handleClose]);

  useEffect(() => {
    if (!isOpen || optionsLoaded) return;

    getPostOptions().then((result) => {
      setOptions(result);
      setOptionsLoaded(true);
    });
  }, [isOpen, optionsLoaded]);

  useEffect(() => {
    return () => {
      photos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
    };
  }, [photos]);

  if (!isOpen) return null;

  const isAnnouncement = selectedType === "announcement";
  const isWholeRoom = audience?.kind === "all-room";
  const isWholeDaycare = audience?.kind === "all-daycare";
  const roomChildren = (options?.children ?? []).filter(
    (child) => child.roomId === selectedRoomId
  );

  const toggleChild = (childId: string) => {
    setError("");
    setAudience((prev) => {
      const currentIds =
        prev?.kind === "children" ? prev.childIds : ([] as string[]);
      const nextIds = currentIds.includes(childId)
        ? currentIds.filter((id) => id !== childId)
        : [...currentIds, childId];
      return nextIds.length > 0 ? { kind: "children", childIds: nextIds } : null;
    });
  };

  const toggleAllRoom = () => {
    setError("");
    setAudience((prev) => (prev?.kind === "all-room" ? null : { kind: "all-room" }));
  };

  const selectWholeDaycare = () => {
    setError("");
    setSelectedRoomId("");
    setAudience((prev) =>
      prev?.kind === "all-daycare" ? null : { kind: "all-daycare" }
    );
  };

  const handleRoomChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setError("");
    setSelectedRoomId(event.target.value);
    setAudience((prev) => (prev?.kind === "all-daycare" ? null : prev));
  };

  const handleTypeToggle = (typeId: PostCategory) => {
    setError("");
    setSelectedType((prev) => (prev === typeId ? "" : typeId));
  };

  const handlePhotoInput = (event: ChangeEvent<HTMLInputElement>) => {
    setError("");
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    const accepted: PhotoPreview[] = [];
    let rejectionMessage = "";

    for (const file of files) {
      if (photos.length + accepted.length >= MAX_PHOTOS) {
        rejectionMessage = `Podés subir hasta ${MAX_PHOTOS} fotos.`;
        break;
      }
      if (!ACCEPTED_PHOTO_TYPES.has(file.type)) {
        rejectionMessage = `"${file.name}" no es un formato soportado (JPG, PNG, WebP o GIF).`;
        continue;
      }
      if (file.size > MAX_PHOTO_BYTES) {
        rejectionMessage = `"${file.name}" pesa más de 4 MB.`;
        continue;
      }
      accepted.push({ file, previewUrl: URL.createObjectURL(file) });
    }

    if (accepted.length > 0) {
      setPhotos((prev) => [...prev, ...accepted]);
    }
    if (rejectionMessage) {
      setError(rejectionMessage);
    }
  };

  const removePhoto = (index: number) => {
    setError("");
    setPhotos((prev) => {
      const photo = prev[index];
      if (photo) URL.revokeObjectURL(photo.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handlePublish = async () => {
    if (isPublishing) return;
    setError("");

    if (!selectedType) {
      setError("Elegí un tipo de publicación.");
      return;
    }
    if (!description.trim()) {
      setError("Escribí una descripción para la publicación.");
      return;
    }
    if (!audience) {
      setError(
        "Elegí una sala o al menos un niño para la publicación, o marcá toda la guardería."
      );
      return;
    }
    if (!profile?.daycare_id) {
      setError("Esperá a que cargue tu perfil para publicar.");
      return;
    }

    setIsPublishing(true);

    try {
      const uploadedPaths: { path: string }[] = [];

      for (const photo of photos) {
        const extension =
          photo.file.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const path = `${profile.daycare_id}/${crypto.randomUUID()}.${extension}`;
        const supabase = createClient();
        const { error: uploadError } = await supabase.storage
          .from("post-photos")
          .upload(path, photo.file, { contentType: photo.file.type });

        if (uploadError) {
          setError(
            `No se pudo subir la foto "${photo.file.name}". Probá de nuevo.`
          );
          return;
        }
        uploadedPaths.push({ path });
      }

      const isWholeRoomAudience = audience.kind === "all-room";
      const childIds =
        audience.kind === "children" ? audience.childIds : undefined;
      const roomId =
        audience.kind === "all-daycare"
          ? undefined
          : isWholeRoomAudience
            ? selectedRoomId ||
              options?.children.find((c) => childIds?.includes(c.id))?.roomId
            : undefined;

      const result = await createPost({
        type: selectedType as PostCategory,
        body: description.trim(),
        roomId: roomId || undefined,
        childIds:
          audience.kind === "children" && childIds ? childIds : undefined,
        photos: uploadedPaths,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      onPublish();
      resetForm();
      onClose();
    } catch {
      setError("No se pudo crear la publicación. Probá de nuevo.");
    } finally {
      setIsPublishing(false);
    }
  };

  const selectedChildrenIds =
    audience?.kind === "children" ? audience.childIds : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-6 pt-10"
      style={{ backgroundColor: "rgba(0,0,0,.4)" }}
      onClick={handleClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="my-10 w-full"
        style={{
          maxWidth: 580,
          backgroundColor: "#FBF4EC",
          border: "1px solid #ECE0D0",
          borderRadius: 24,
          boxShadow: "0 20px 50px -24px rgba(63,54,46,.35)",
          outline: "none",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between"
          style={{ padding: "20px 26px", borderBottom: "1px solid #ECE0D0" }}
        >
          <button
            type="button"
            onClick={handleClose}
            disabled={isPublishing}
            style={{ color: "#94887B", fontWeight: 700, fontSize: 15 }}
          >
            Cancelar
          </button>
          <span
            id={titleId}
            style={{
              fontFamily: "'Fredoka', sans-serif",
              fontWeight: 600,
              fontSize: 18,
              color: "#3F362E",
            }}
          >
            Nueva publicación
          </span>
          <button
            type="button"
            onClick={handlePublish}
            disabled={isPublishing}
            style={{
              color: "#D9583C",
              fontWeight: 800,
              fontSize: 15,
              opacity: isPublishing ? 0.6 : 1,
              cursor: isPublishing ? "default" : "pointer",
            }}
          >
            {isPublishing ? "Publicando…" : "Publicar"}
          </button>
        </div>
        <div style={{ padding: "24px 26px" }}>
          <label
            htmlFor="post-room"
            className="block"
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 0.7,
              color: "#94887B",
              marginBottom: 10,
            }}
          >
            SALA
          </label>
          <select
            id="post-room"
            value={selectedRoomId}
            onChange={handleRoomChange}
            disabled={isPublishing || !options}
            className="w-full"
            style={{
              padding: "12px 14px",
              borderRadius: 14,
              border: "1.5px solid #EADFD0",
              backgroundColor: "#fff",
              fontSize: 15,
              color: "#3F362E",
              marginBottom: 22,
              appearance: "none",
            }}
          >
            <option value="">
              {options ? "Elegí una sala…" : "Cargando salas…"}
            </option>
            {(options?.rooms ?? []).map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>

          {(selectedRoomId || isAnnouncement) && (
            <>
              <div
                id={audienceLabelId}
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: 0.7,
                  color: "#94887B",
                  marginBottom: 10,
                }}
              >
                PARA
              </div>
              <div
                role="group"
                aria-labelledby={audienceLabelId}
                className="flex flex-wrap"
                style={{ gap: 9, marginBottom: 22 }}
              >
                {isWholeDaycare ? (
                  <button
                    type="button"
                    aria-pressed={true}
                    onClick={selectWholeDaycare}
                    style={{
                      padding: "6px 16px",
                      borderRadius: 999,
                      border: "1.5px solid #3F362E",
                      backgroundColor: "#3F362E",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: "pointer",
                    }}
                  >
                    Toda la guardería
                  </button>
                ) : (
                  <>
                    {selectedRoomId &&
                      roomChildren.map((child) => {
                        const isSelected = selectedChildrenIds.includes(child.id);
                        const avatar = getAvatarColor(child.fullName);
                        return (
                          <button
                            key={child.id}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => toggleChild(child.id)}
                            disabled={isWholeRoom}
                            className="flex items-center"
                            style={{
                              gap: 8,
                              padding: "6px 14px 6px 6px",
                              borderRadius: 999,
                              border: `1.5px solid ${isSelected ? "#3F362E" : "#ECE0D0"}`,
                              backgroundColor: isSelected ? "#3F362E" : "#FFFDF9",
                              color: isSelected ? "#fff" : "#6E6359",
                              fontWeight: 700,
                              fontSize: 14,
                              cursor: "pointer",
                              opacity: isWholeRoom ? 0.5 : 1,
                            }}
                          >
                            <span
                              className="flex items-center justify-center"
                              style={{
                                width: 26,
                                height: 26,
                                borderRadius: "50%",
                                backgroundColor: avatar.bg,
                                color: avatar.text,
                                fontFamily: "'Fredoka', sans-serif",
                                fontWeight: 600,
                                fontSize: 13,
                              }}
                            >
                              {child.fullName.charAt(0).toUpperCase()}
                            </span>
                            <span className="truncate">
                              {child.fullName.split(" ")[0]}
                            </span>
                          </button>
                        );
                      })}
                    {selectedRoomId && (
                      <button
                        type="button"
                        aria-pressed={isWholeRoom}
                        onClick={toggleAllRoom}
                        style={{
                          padding: "6px 16px",
                          borderRadius: 999,
                          border: `1.5px solid ${isWholeRoom ? "#3F362E" : "#ECE0D0"}`,
                          backgroundColor: isWholeRoom ? "#3F362E" : "#FFFDF9",
                          color: isWholeRoom ? "#fff" : "#6E6359",
                          fontWeight: 700,
                          fontSize: 14,
                          cursor: "pointer",
                        }}
                      >
                        Toda la sala
                      </button>
                    )}
                    {isAnnouncement && (
                      <button
                        type="button"
                        aria-pressed={false}
                        onClick={selectWholeDaycare}
                        style={{
                          padding: "6px 16px",
                          borderRadius: 999,
                          border: "1.5px solid #ECE0D0",
                          backgroundColor: "#FFFDF9",
                          color: "#6E6359",
                          fontWeight: 700,
                          fontSize: 14,
                          cursor: "pointer",
                        }}
                      >
                        Toda la guardería
                      </button>
                    )}
                  </>
                )}
              </div>
            </>
          )}

          <div
            id={typeLabelId}
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 0.7,
              color: "#94887B",
              marginBottom: 10,
            }}
          >
            TIPO
          </div>
          <div
            role="group"
            aria-labelledby={typeLabelId}
            className="flex flex-wrap"
            style={{ gap: 9, marginBottom: 22 }}
          >
            {postTypes.map((type) => {
              const isSelected = selectedType === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => handleTypeToggle(type.id)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 999,
                    border: "none",
                    backgroundColor: isSelected ? type.bgColor : `${type.bgColor}33`,
                    color: type.textColor,
                    fontWeight: 800,
                    fontSize: 13.5,
                    cursor: "pointer",
                  }}
                >
                  {type.label}
                </button>
              );
            })}
          </div>

          <label
            htmlFor={descriptionId}
            className="block"
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 0.7,
              color: "#94887B",
              marginBottom: 10,
            }}
          >
            DESCRIPCIÓN
          </label>
          <textarea
            id={descriptionId}
            placeholder="Contá cómo le fue hoy…"
            value={description}
            onChange={(e) => {
              setError("");
              setDescription(e.target.value);
            }}
            disabled={isPublishing}
            className="w-full resize-y"
            style={{
              minHeight: 120,
              padding: "14px 16px",
              borderRadius: 14,
              border: "1.5px solid #EADFD0",
              backgroundColor: "#fff",
              fontSize: 15,
              color: "#3F362E",
              lineHeight: 1.5,
              marginBottom: 22,
            }}
          />
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 0.7,
              color: "#94887B",
              marginBottom: 10,
            }}
          >
            FOTOS {photos.length > 0 && `(${photos.length}/${MAX_PHOTOS})`}
          </div>
          <div className="flex flex-wrap" style={{ gap: 12 }}>
            {photos.map((photo, index) => (
              <div
                key={photo.previewUrl}
                className="relative"
                style={{ width: 96, height: 96 }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.previewUrl}
                  alt={`Vista previa de ${photo.file.name}`}
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: 14,
                    objectFit: "cover",
                    border: "1px solid #ECE0D0",
                  }}
                />
                <button
                  type="button"
                  aria-label={`Quitar foto ${index + 1}`}
                  onClick={() => removePhoto(index)}
                  className="absolute flex items-center justify-center"
                  style={{
                    top: -6,
                    right: -6,
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    backgroundColor: "#3F362E",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: "pointer",
                    border: "none",
                  }}
                >
                  ×
                </button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <button
                type="button"
                aria-label="Agregar foto"
                onClick={() => fileInputRef.current?.click()}
                disabled={isPublishing}
                className="flex flex-col items-center justify-center"
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 14,
                  border: "1.5px dashed #DBCDBA",
                  backgroundColor: "#F4ECE1",
                  color: "#B0A290",
                  cursor: "pointer",
                  gap: 6,
                }}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#C5503A"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span style={{ fontSize: 12 }}>Agregar</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handlePhotoInput}
              className="hidden"
              tabIndex={-1}
            />
          </div>

          {error && (
            <p
              role="alert"
              style={{
                marginTop: 16,
                padding: "10px 14px",
                borderRadius: 12,
                backgroundColor: "#FBE3D8",
                color: "#C5503A",
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              {error}
            </p>
          )}

          {profileLoading && (
            <p style={{ marginTop: 12, fontSize: 13, color: "#A89A8B" }}>
              Cargando tu perfil…
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
