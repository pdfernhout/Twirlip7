### Yet another experiment towards a social semantic desktop

Right now, this is just a simple IDE for playing with JavaScript which can store snippets in a log.

As an experiment, questions include how could these snippets be stored, retrieved, visualized, referenced, annotated, shared, versioned, or discussed? The goal of the experiment is to explore such ideas as another step towards a social semantic desktop.

The log is stored in local storage by default (or memory if desired).
The log of snippets can be exported or imported as JSON.
However, all that may change as the experiment progresses in new directions.

The IDE supports some functionality inspired by the Smalltalk "Workspace". You can select a section of code in the editor and then "do it" to evaluate the code, "print it" to insert the evaluation result in the editor, or "inspect it" to see the evaluation result (in the JavaScript console in this case). If you don't select anything specific, all the code in the editor is evaluated.

To test this, click "Show example log" which will put some JSON text in the editor window, and then click "Load log" to start using the log of snippets. Then use Previous and Next buttons to scroll through snippets. Click "Do it" to evaluate a snippet. Select text and then Do, Print, or Inspect just that text (e.g. "1 + 1"). Supports Import and Export of editor content to a file. You can edit snippets and click "Save" to add them to the log of snippets. You can click on the top button labelled "Archive: local storage" to switch from using local storage to memory storage and then back again; the two storages maintain different logs.

The UI uses Mithril.js, Tachyons.js, RequireJS, and the ACE editor in plain JavaScript. The UI currently expects ES6 in a modern browser.

The Server uses Node.js with Express to server the UI files. Eventually the server may do something more than just serving files. Using the server requires running "npm install" to load the supporting npm modules and then "npm run server" to run the server. However you don't actually need to install and run the server yet as you can just load the files directly into your browser -- including from this test link:  
http://rawgit.com/pdfernhout/Twirlip7/master/src/ui/index.html

No build step (yet).

### License: MIT

![Twirlip7 Screenshot showing F-to-C snippet](screenshots/Twirlip7_Screenshot_showing_F-to-C_snippet_2017-05-19.png?raw=true "Twirlip7 Screenshot showing F-to-C snippet")
