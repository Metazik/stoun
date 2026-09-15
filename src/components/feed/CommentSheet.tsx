"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Send } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import type { Comment } from "@/types";

export function CommentSheet({
  postId,
  open,
  onClose,
  onCommentAdded,
}: {
  postId: string;
  open: boolean;
  onClose: () => void;
  onCommentAdded: () => void;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`/api/posts/${postId}/comments`)
      .then((r) => r.json())
      .then((data) => setComments(data.comments ?? []))
      .finally(() => setLoading(false));
  }, [open, postId]);

  async function submit() {
    if (!draft.trim() || sending) return;
    setSending(true);
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: draft }),
    });
    setSending(false);
    if (res.ok) {
      const data = await res.json();
      setComments((c) => [...c, data.comment]);
      setDraft("");
      onCommentAdded();
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[75vh] flex-col rounded-t-3xl border-t border-border bg-surface safe-bottom"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h3 className="font-semibold">Comments</h3>
              <button onClick={onClose} aria-label="Close" className="text-muted hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-3">
              {loading && <p className="py-6 text-center text-sm text-muted">Loading…</p>}
              {!loading && comments.length === 0 && (
                <p className="py-6 text-center text-sm text-muted">Be the first to comment.</p>
              )}
              <div className="flex flex-col gap-4 pb-4">
                {comments.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <Avatar src={c.author.avatarUrl} name={c.author.displayName} size={32} />
                    <div>
                      <p className="text-sm">
                        <span className="font-medium">{c.author.displayName}</span>{" "}
                        <span className="text-foreground/90">{c.body}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 border-t border-border px-4 py-3">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="Add a comment…"
                className="flex-1 rounded-full border border-border bg-surface-raised px-4 py-2.5 text-sm outline-none focus:border-stoun-violet"
              />
              <button
                onClick={submit}
                disabled={sending || !draft.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-stoun-gradient text-white disabled:opacity-40"
                aria-label="Send comment"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
