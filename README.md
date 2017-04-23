h3. Yet another experiment towards a social semantic desktop

Right now, this is just a simple IDE for playing with JavaScript which can store snippets in a log.

The log is stored in local storage by default (or memory if desired).
The log of snippets can be expoerted or imported as JSON.

As an experiment, questions include how could these snippets be stored, retrieved, visualized, referenced, annotated, shared, versioned, or discussed?

To test this, copy one of the arrays in example.logs.txt into the editor and press "Load log".

Currently expects ES6 in a modern browser.

Uses Mithril.js, Tachyons, and the ACE editor.

No build step (yet).