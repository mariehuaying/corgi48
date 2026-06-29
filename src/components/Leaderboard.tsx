import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ScoreRow {
  id: string;
  name: string;
  score: number;
  created_at: string;
}

export function LeaderboardDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [scores, setScores] = useState<ScoreRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setScores(null);
    setError(null);
    supabase
      .from("scores")
      .select("id, name, score, created_at")
      .order("score", { ascending: false })
      .limit(10)
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setScores(data ?? []);
      });
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>🏆 Leaderboard</DialogTitle>
          <DialogDescription>Top 10 highest scores</DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {!scores && !error && (
          <p className="text-sm text-muted-foreground">Loading…</p>
        )}
        {scores && scores.length === 0 && (
          <p className="text-sm text-muted-foreground">No scores yet. Be the first!</p>
        )}
        {scores && scores.length > 0 && (
          <ol className="divide-y">
            {scores.map((s, i) => (
              <li key={s.id} className="flex items-center justify-between py-2">
                <span className="flex items-center gap-3">
                  <span className="w-6 text-right font-bold text-muted-foreground">
                    {i + 1}.
                  </span>
                  <span className="font-medium">{s.name}</span>
                </span>
                <span className="font-bold tabular-nums">{s.score}</span>
              </li>
            ))}
          </ol>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function SubmitScoreDialog({
  open,
  onOpenChange,
  score,
  onSubmitted,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  score: number;
  onSubmitted: () => void;
}) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setError(null);
      setSubmitting(false);
    }
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 1 || trimmed.length > 30) {
      setError("Name must be 1–30 characters.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const { error } = await supabase
      .from("scores")
      .insert({ name: trimmed, score });
    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    onSubmitted();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Game Over!</DialogTitle>
          <DialogDescription>
            Your score: <span className="font-bold">{score}</span>. Enter your name to
            submit it to the leaderboard.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={30}
            placeholder="Your name"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Submit"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
