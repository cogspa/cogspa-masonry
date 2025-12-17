import { useEffect, useRef, useState } from "react";
import "./styles.css";

import { auth, googleProvider } from "./firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";

import { useFeed } from "./useFeed";
import { uploadPost } from "./uploadPost";

export default function App() {
  const [user, setUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [pct, setPct] = useState(0);

  const { items, loadMore, loading, done } = useFeed(20);
  const sentinelRef = useRef(null);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  // infinite scroll sentinel
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && !done) loadMore();
      },
      { rootMargin: "1200px" }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [loadMore, loading, done]);

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!user) {
      alert("Sign in first.");
      return;
    }

    setUploading(true);
    setPct(0);

    try {
      await uploadPost({
        file,
        user,
        title: "",
        tags: ["COGSPA", "AI-mation"],
        onProgress: setPct,
      });
      // simplest refresh approach: reload page or implement realtime listener
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert(err.message || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <div className="logo">C</div>
          <div>
            <div className="brandTitle">COGSPA AI-mation Clips</div>
            <div className="brandSub">Pinterest-style film studies + AI clips</div>
          </div>
        </div>

        <div className="actions">
          <label className="btn">
            Upload
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleUpload}
              style={{ display: "none" }}
            />
          </label>

          {!user ? (
            <button className="btn ghost" onClick={() => signInWithPopup(auth, googleProvider)}>
              Sign in
            </button>
          ) : (
            <button className="btn ghost" onClick={() => signOut(auth)}>
              Sign out
            </button>
          )}
        </div>
      </header>

      <main className="wrap">
        {uploading && (
          <div className="loading">Uploading… {pct}%</div>
        )}

        <section className="masonry">
          {items.map((it) => (
            <article className="card" key={it.id}>
              <div className="media">
                {it.type === "video" ? (
                  <video src={it.publicUrl} controls preload="metadata" playsInline />
                ) : (
                  <img src={it.publicUrl} alt={it.title || "post"} loading="lazy" />
                )}
              </div>

              <div className="meta">
                <div className="title">{it.title}</div>
                <div className="tags">
                  {(it.tags || []).map((t) => (
                    <span className="tag" key={t}>#{t}</span>
                  ))}
                </div>
              </div>

              <div className="hoverBar">
                <button className="mini">Save</button>
                <button className="mini ghost">Share</button>
              </div>
            </article>
          ))}
        </section>

        <div className="sentinel" ref={sentinelRef} />
        {loading && <div className="loading">Loading more…</div>}
        {done && <div className="loading">You’re all caught up.</div>}
      </main>
    </div>
  );
}
