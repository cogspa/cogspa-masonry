import { useEffect, useRef, useState } from "react";
import "./styles.css";

import { auth, googleProvider } from "./firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";

import { useFeed } from "./useFeed";
import { uploadPost, deletePost } from "./uploadPost";

const ADMIN_EMAIL = "jmicalle@gmail.com";

export default function App() {
  const [user, setUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [pct, setPct] = useState(0);

  // Simple client-side gate for "invite code" access during this session
  const [hasInviteAccess, setHasInviteAccess] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState("");

  const { items, loadMore, loading, done } = useFeed(20);
  const sentinelRef = useRef(null);

  useEffect(() => onAuthStateChanged(auth, (u) => {
    setUser(u);
    // Reset invite access on logout
    if (!u) setHasInviteAccess(false);
  }), []);

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

  const isAdmin = user?.email === ADMIN_EMAIL;
  const canUpload = isAdmin || hasInviteAccess;

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!user) {
      alert("Sign in first.");
      return;
    }

    if (!canUpload) {
      alert("You need an invite code to upload.");
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

  async function handleDelete(post) {
    if (!confirm("Are you sure you want to delete this?")) return;
    try {
      await deletePost(post);
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Failed to delete");
    }
  }

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error(e);
    }
  };

  const handleInviteSubmit = (e) => {
    e.preventDefault();
    // Hardcoded simple invite code for now
    if (inviteCodeInput.trim() === "COGSPA2025") {
      setHasInviteAccess(true);
      setShowInviteModal(false);
    } else {
      alert("Invalid code");
    }
  };

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
          {canUpload && (
            <label className="btn">
              Upload
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleUpload}
                style={{ display: "none" }}
              />
            </label>
          )}

          {!user ? (
            <button className="btn ghost" onClick={handleSignIn}>
              Sign in
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {!canUpload && (
                <button className="btn ghost" onClick={() => setShowInviteModal(true)}>
                  Enter Invite Code
                </button>
              )}
              <button className="btn ghost" onClick={() => signOut(auth)}>
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Basic Invite Code Modal */}
      {showInviteModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', zIndex: 100,
          display: 'grid', placeItems: 'center'
        }}>
          <form onSubmit={handleInviteSubmit} style={{
            background: '#12131a', padding: '24px', borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '300px'
          }}>
            <h3>Enter Invite Code</h3>
            <input
              autoFocus
              value={inviteCodeInput}
              onChange={e => setInviteCodeInput(e.target.value)}
              placeholder="Code..."
              style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                padding: '8px', borderRadius: '8px', color: 'white', outline: 'none'
              }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button type="button" className="btn ghost" onClick={() => setShowInviteModal(false)}>Cancel</button>
              <button type="submit" className="btn">Unlock</button>
            </div>
          </form>
        </div>
      )}

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
                {canUpload && (
                  <button
                    className="mini danger"
                    onClick={(e) => { e.preventDefault(); handleDelete(it); }}
                    title="Delete"
                  >
                    ✕
                  </button>
                )}
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
