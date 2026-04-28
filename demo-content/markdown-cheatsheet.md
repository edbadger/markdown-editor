# Markdown cheatsheet

A quick tour of what renders nicely in the formatted view.

## Headings, paragraphs, emphasis

The editor renders **bold**, *italic*, ~~strikethrough~~, and `inline code` inline as you type. Switch to source view (`Cmd+/`) any time to see the raw markdown.

## Lists

Unordered:

* Make sure your reader knows the takeaway in the first 30 seconds.

* Show your work, but trim ruthlessly.

* One idea per paragraph.

Ordered:

1. Open a file from the sidebar.
2. Start typing — the formatting applies live.
3. Save happens automatically.

Nested:

* Strategy

  * Where to play

  * How to win

* Execution

  * What to ship

  * When to ship it

## Links and code

Drop a [link to your favourite resource](https://hustlebadger.com) into any paragraph. Code blocks are tinted and monospaced:

```ts
function debounce(fn: () => void, ms: number) {
  let t: ReturnType<typeof setTimeout> | null = null;
  return () => {
    if (t) clearTimeout(t);
    t = setTimeout(fn, ms);
  };
}
```

## Quotes and dividers

> "The first 90% of writing takes 10% of the time. The other 90% takes 10% of the time."

***

## Tables (GFM)

| Feature         | Shortcut       | Notes              |
| --------------- | -------------- | ------------------ |
| Mode toggle     | `Cmd+/`        | Formatted ↔ source |
| Command palette | `Cmd+K`        | Fuzzy file search  |
| Undo / redo     | `Cmd+Z` / `⇧Z` | Standard history   |

That's most of what you'll use day to day. Anything else, drop into source view and write it raw.
