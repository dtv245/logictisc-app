/**
 * Keeps an immediately responsive search input while committing its URL value
 * after the shared API-search debounce interval.
 */
import {
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

export const TABLE_SEARCH_DEBOUNCE_MS = 400;

export interface UseDebouncedTableSearchOptions {
  committedSearch: string;
  onCommit: (search: string) => void;
  delayMs?: number;
}

export interface UseDebouncedTableSearchResult {
  searchInput: string;
  setSearchInput: Dispatch<SetStateAction<string>>;
}

interface TableSearchInputState {
  sourceSearch: string;
  input: string;
}

export function useDebouncedTableSearch({
  committedSearch,
  onCommit,
  delayMs = TABLE_SEARCH_DEBOUNCE_MS,
}: UseDebouncedTableSearchOptions): UseDebouncedTableSearchResult {
  // Input state changes on every keystroke, while server state remains owned by
  // the query layer and URL.
  const [inputState, setInputState] = useState<TableSearchInputState>({
    sourceSearch: committedSearch,
    input: committedSearch,
  });
  let activeInputState = inputState;

  // React permits guarded state adjustment during render when a prop is the
  // source of truth. It avoids an extra stale-input paint after browser
  // back/forward navigation and does not use an Effect for derived state.
  if (inputState.sourceSearch !== committedSearch) {
    activeInputState = {
      sourceSearch: committedSearch,
      input: committedSearch,
    };
    setInputState(activeInputState);
  }

  // Consumers commonly pass this setter directly to a controlled search
  // input, so its stable identity avoids avoidable child renders.
  const setSearchInput = useCallback<Dispatch<SetStateAction<string>>>(
    (nextInput) => {
      setInputState((current) => ({
        sourceSearch: current.sourceSearch,
        input:
          typeof nextInput === "function"
            ? nextInput(current.input)
            : nextInput,
      }));
    },
    [],
  );
  const searchInput = activeInputState.input;

  // Debouncing prevents one navigation/query per keypress. Cleanup cancels the
  // older commit when a newer value arrives or the input unmounts.
  useEffect(() => {
    if (searchInput === committedSearch) {
      return;
    }

    const timer = window.setTimeout(() => {
      onCommit(searchInput);
    }, delayMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [committedSearch, delayMs, onCommit, searchInput]);

  return {
    searchInput,
    setSearchInput,
  };
}
