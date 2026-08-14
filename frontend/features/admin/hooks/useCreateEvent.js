"use client";

import { useCallback, useState } from "react";

import { createEvent } from "../services/adminService";

// Ephemeral submit state for the create-event form: single-form flags, not
// cross-cutting app state, so they stay local to this hook rather than in the
// admin zustand store.
export function useCreateEvent({ onCreated } = {}) {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const submit = useCallback(
    async (values) => {
      setSubmitError(null);
      setSubmitting(true);
      const result = await createEvent(values);
      setSubmitting(false);
      if (result.ok) {
        onCreated?.();
        return true;
      }
      setSubmitError(result.error.detail);
      return false;
    },
    [onCreated],
  );

  return { submit, submitting, submitError };
}
