import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { collection, doc, serverTimestamp, setDoc, deleteDoc } from "firebase/firestore";

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

    return new Promise((resolve, reject) => {
        task.on(
            "state_changed",
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log("Upload progress:", progress);
                if (onProgress) onProgress(Math.round(progress));
            },
            (error) => {
                console.error("Storage Error:", error);
                reject(error);
            },
            async () => {
                console.log("Upload 100% complete. Getting download URL...");
                try {
                    const publicUrl = await getDownloadURL(task.snapshot.ref);
                    console.log("Got URL:", publicUrl);

                    // postId and type are already defined outside this promise
                    // const postId = uniqueId; // Assuming uniqueId refers to the postId already generated
                    // const type = file.type.startsWith("video") ? "video" : "image"; // type is already defined

                    console.log("Saving to Firestore...");
                    await setDoc(doc(db, "posts", postId), {
                        ownerUid: user.uid,
                        type,
                        title: title?.trim() || file.name, // Use existing title logic
                        tags: (tags || []).map((t) => t.trim()).filter(Boolean), // Use existing tags logic
                        storagePath,
                        publicUrl,
                        createdAt: serverTimestamp(),
                    });
                    console.log("Firestore save complete!");

                    resolve({ postId, publicUrl, type });
                } catch (err) {
                    console.error("Firestore Error:", err);
                    reject(err);
                }
            }
        );
    });
}

export async function deletePost(post) {
    if (!post.id || !post.storagePath) throw new Error("Invalid post data");

    // 1. Delete from Firestore
    await deleteDoc(doc(db, "posts", post.id));

    // 2. Delete from Storage
    const storageRef = ref(storage, post.storagePath);
    await deleteObject(storageRef).catch((err) => {
        console.warn("Failed to delete media file (might not exist):", err);
    });
}

