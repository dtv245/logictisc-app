/**
 * English messages for Phase 0 shared UI primitives.
 *
 * Keeping all visible copy here lets consuming features reuse the primitives
 * without introducing untranslated fallback strings.
 */
export const enSharedMessages = {
  asyncState: {
    loading: "Loading content",
    emptyTitle: "No data",
    emptyDescription: "There is nothing to display yet.",
  },
  queryError: {
    title: "Unable to load content",
    description: "Something went wrong while loading this content.",
  },
  configError: {
    title: "Configuration required",
    description:
      "The application cannot start because its runtime configuration is incomplete or invalid.",
  },
  forbidden: {
    title: "Access denied",
    description: "You do not have permission to view this content.",
  },
  notFound: {
    title: "Page not found",
    description: "The page may have moved or may no longer exist.",
  },
  actions: {
    retry: "Try again",
    goHome: "Go to home",
    confirm: "Confirm",
    cancel: "Cancel",
  },
  confirm: {
    pendingAnnouncement: "The action is in progress.",
  },
} as const;
