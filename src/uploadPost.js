import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db, storage } from "./firebase";

export async function uploadPost({ file, user, title, tags, onProgress }) {
    if (!user) throw new Error("Not signed in");
    if (!file) throw new Error("No file");

    const postId = crypto.randomUUID();
    const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
    const isVideo = file.type.startsWith("video/");
    const type = isVideo ? "video" : "image";

    const storagePath = `posts/${user.uid}/${postId}/media.${ext}`;
    const storageRef = ref(storage, storagePath);

    const task = uploadBytesResumable(storageRef, file, {
        contentType: file.type,
    });

    await new Promise((resolve, reject) => {
        task.on(
            "state_changed",
            (snap) => {
                const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
                onProgress?.(pct);
            },
            reject,
            resolve
        );
    });

    const publicUrl = await getDownloadURL(storageRef);

    const postDocRef = doc(collection(db, "posts"), postId);
    await setDoc(postDocRef, {
        ownerUid: user.uid,
        type,
        title: title?.trim() || file.name,
        tags: (tags || []).map((t) => t.trim()).filter(Boolean),
        storagePath,
        publicUrl,
        createdAt: serverTimestamp(),
    });

    return { postId, publicUrl, type };
}
