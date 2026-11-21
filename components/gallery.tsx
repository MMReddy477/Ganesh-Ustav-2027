"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Film, Music, X } from "lucide-react";
import { useEffect, useState } from "react";

type GalleryImage = { id: string; src: string; alt: string; title: string; category: string };
type PublishedImage = { id: string; title: string; description: string | null; image_url: string; category: string; alt_text: string };
type PublishedVideo = { id: string; title: string; description: string | null; video_url: string; poster_url: string | null; category: string };
type PublishedAudio = { id: string; title: string; description: string | null; audio_url: string; category: string };

export function Gallery({ publishedImages = [], publishedVideos = [], publishedAudios = [] }: { publishedImages?: PublishedImage[]; publishedVideos?: PublishedVideo[]; publishedAudios?: PublishedAudio[] }) {
  const [category, setCategory] = useState("All moments");
  const [selected, setSelected] = useState<GalleryImage | null>(null);
  const images: GalleryImage[] = publishedImages.map((image) => ({
    id: image.id,
    src: image.image_url,
    alt: image.alt_text || image.title,
    title: image.title || image.alt_text,
    category: image.category || "Other",
  }));
  const filters = ["All moments", ...new Set(images.map((image) => image.category))];
  const visibleImages = category === "All moments" ? images : images.filter((image) => image.category === category);

  useEffect(() => {
    if (!selected) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected]);

  return (
    <>
      {images.length > 0 && (
        <div className="gallery-controls" role="group" aria-label="Filter gallery">
          {filters.map((filter) => (
            <button key={filter} type="button" className={`gallery-filter${category === filter ? " active" : ""}`} aria-pressed={category === filter} onClick={() => setCategory(filter)}>{filter}</button>
          ))}
        </div>
      )}
      <div className="gallery-grid">
        <AnimatePresence mode="popLayout">
          {visibleImages.map((image, index) => (
            <motion.button
              type="button"
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.22, delay: index * 0.025 }}
              className="gallery-tile"
              key={image.id}
              onClick={() => setSelected(image)}
              aria-label={`View image: ${image.alt}`}
            >
              <Image src={image.src} alt={image.alt} fill unoptimized sizes="(max-width: 760px) 50vw, 33vw" />
              <span>{image.title}</span>
            </motion.button>
          ))}
        </AnimatePresence>
        {images.length === 0 && <p className="gallery-empty">Published photos from Admin → Gallery will appear here.</p>}
      </div>
      {publishedVideos.length > 0 && (
        <div className="public-media-library">
          <div className="public-media-heading"><Film size={17} /><span>Festival videos</span></div>
          <div className="public-video-grid">
            {publishedVideos.map((video) => (
              <article className="public-video-card" key={video.id}>
                {video.poster_url ? <Image src={video.poster_url} alt={video.title} width={640} height={360} unoptimized /> : <video src={video.video_url} controls preload="metadata" />}
                <div><strong>{video.title}</strong><small>{video.category}</small></div>
                <a href={video.video_url} download aria-label={`Download ${video.title}`}><Download size={15} /> Download</a>
              </article>
            ))}
          </div>
        </div>
      )}
      {publishedAudios.length > 0 && (
        <div className="public-media-library">
          <div className="public-media-heading"><Music size={17} /><span>Bhajans & audio</span></div>
          <div className="public-audio-grid">
            {publishedAudios.map((audio) => (
              <article className="public-audio-card" key={audio.id}>
                <div className="public-audio-icon"><Music size={20} /></div>
                <div><strong>{audio.title}</strong><small>{audio.category}</small><audio src={audio.audio_url} controls preload="metadata" /></div>
                <a href={audio.audio_url} download aria-label={`Download ${audio.title}`}><Download size={15} /> Download</a>
              </article>
            ))}
          </div>
        </div>
      )}
      <AnimatePresence>
        {selected && (
          <motion.div className="gallery-viewer" role="dialog" aria-modal="true" aria-label={selected.alt} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelected(null)}>
            <button type="button" aria-label="Close image preview" onClick={() => setSelected(null)}><X size={23} /></button>
            <Image src={selected.src} alt={selected.alt} width={1200} height={900} unoptimized onClick={(event) => event.stopPropagation()} />
            <p>{selected.alt}</p>
            <a className="gallery-download" href={selected.src} download aria-label={`Download ${selected.alt}`} onClick={(event) => event.stopPropagation()}><Download size={16} /> Download image</a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
