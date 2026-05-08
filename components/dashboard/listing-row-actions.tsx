"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deactivateListing, reactivateListing } from "@/app/actions/listings";

interface ListingRowActionsProps {
  listingId: string;
  status: string;
}

export function ListingRowActions({ listingId, status }: ListingRowActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function toggle() {
    setError("");
    startTransition(async () => {
      const result =
        status === "active"
          ? await deactivateListing(listingId)
          : await reactivateListing(listingId);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant={status === "active" ? "outline" : "default"}
        disabled={isPending}
        onClick={toggle}
      >
        {isPending
          ? "..."
          : status === "active"
          ? "Pausar"
          : "Reactivar"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
