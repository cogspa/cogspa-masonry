import { useCallback, useEffect, useRef, useState } from "react";
import {
    collection,
    getDocs,
    limit,
    orderBy,
    query,
    startAfter,
} from "firebase/firestore";
import { db } from "./firebase";

export function useFeed(pageSize = 20) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const lastDocRef = useRef(null);

    const loadMore = useCallback(async () => {
        if (loading || done) return;
        setLoading(true);

        const base = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(pageSize));
        const q = lastDocRef.current
            ? query(collection(db, "posts"), orderBy("createdAt", "desc"), startAfter(lastDocRef.current), limit(pageSize))
            : base;

        const snap = await getDocs(q);
        if (snap.empty) {
            setDone(true);
            setLoading(false);
            return;
        }

        lastDocRef.current = snap.docs[snap.docs.length - 1];

        const next = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        setItems((prev) => {
            const existingIds = new Set(prev.map(p => p.id));
            const uniqueNext = next.filter(n => !existingIds.has(n.id));
            return [...prev, ...uniqueNext];
        });

        if (snap.docs.length < pageSize) setDone(true);
        setLoading(false);
    }, [pageSize, loading, done]);

    useEffect(() => {
        loadMore();
    }, [loadMore]);

    return { items, loadMore, loading, done };
}
