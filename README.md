### Twirlip7 Information Organizer

Try it here: http://rawgit.com/pdfernhout/Twirlip7/master/src/ui/twirlip7.html

The Twirlip project helps you organize information you find interesting and make it accessible and useful to yourself or others you want to share with.

Right now, there are a few experimental applications to play with:

* a programmable notebook (with some examples including plugins)
* an IBIS diagramming tool for Dialogue Mapping
* a chat application

### About the notebook application

The notebook app is an IDE for playing with JavaScript and Mithril.js which stores snippets of code or text in a local notebook with a collection of items.

As an experiment, questions include how could these snippets be stored, retrieved, visualized, referenced, annotated, shared, versioned, or discussed?

The goal of the experiment is to explore such ideas as another step towards a social semantic desktop.

The notebook items are stored in local storage by default.
You can click on the "Notebook" dropdown to switch from using local storage to memory storage or server storage for new items.

And entire notebook of snippets can be exported or imported as JSON.
You can also copy and paste individual items (including their history) between Twirlip7 journals via data URLs using the clipboard.

However, all that may change as the experiment progresses in new directions.
For example, as one possibility, these snippets and content they generate might someday be distributed through the decentralized Matrix.org.

The IDE supports some functionality inspired by the Smalltalk "Workspace". You can select a section of code in the editor and then "do it" to evaluate the code, "print it" to insert the evaluation result in the editor, or "inspect it" to see the evaluation result (in the JavaScript console in this case). If you don't select anything specific, all the code in the editor is evaluated.

To test this, click "Show example log" which will put some JSON text in the editor window, and then click "Load log" to start using the log of snippets. Then use Previous and Next buttons to scroll through snippets. Click "Do it" to evaluate a snippet. Select text and then Do, Print, or Inspect just that text (e.g. "1 + 1"). Supports Import and Export of editor content to a file. You can edit snippets and click "Save" to add them to the log of snippets.

The UI uses Mithril.js, Tachyons.js, RequireJS, and the ACE editor in plain JavaScript. The UI currently expects ES6 in a modern browser.

The Server uses Node.js with Express to serve the UI files and to store and retrieve items shared by all users.
Using the server requires running "npm install" to load the supporting npm modules and then "npm start" to run the server. 
If you want to allow the server to proxy requests to avoid CORS issues when retrieving data from different sites,
you need to add a proxyKey.txt file with a proxyKey passphrase which must be supplied in proxy requests.

You don't need to install and run the server to do some simple tests.
You can just load the UI files directly into your browser (like with the rawgit example).
If you run without the server, however, you can only store data in memory or local storage;
the server storage option will be greyed out in the UI.
Also, proxy support is not available without the server, so the proxying examples won't work.

No required build step (yet).

### Startup params

See [Startup params](README-startup.md)

### License: MIT

### Screenshots

Note: The IDE screenshots here are significantly out-of-date as more features have been added since it was made.

Screenshot of Twirlip7 notebook showing a code snippet with a simple temperature convertor in Mithril (after having pressed "Do it"):

![Twirlip7 Screenshot showing F-to-C snippet in editor](screenshots/Twirlip7_Screenshot_showing_F-to-C_snippet_2017-05-19.png?raw=true "Twirlip7 Screenshot showing F-to-C snippet in editor after pressing Do it")

Screenshot showing the same code snippet opened in a new tab as a stand-alone-looking app (after having pressed "Launch it"):

![Twirlip7 Screenshot showing F-to-C snippet opened in a new tab](screenshots/Twirlip7_Screenshot_showing_F-to-C_opened_2017-05-19.png?raw=true "Twirlip7 Screenshot showing F-to-C snippet opened as an app running in a new tab after pressing Open it")
