## Startup options for Notebook

### Launching a saved item

You can "Launch" items saved to local storage using the "Launch" button. You can then reload the launched page from the resulting URL with" launch" in it.

If you have saved the Currency Converter example to local storage, you could launch it with this localhost URL (the id needs to be an exact SHA256 of the conents):
http://localhost:8080/notebook.html#launch=1368f0dff083303e1c2d02a2a0f5409b639dce9d48dbafadc4f741ba94e77ffc

### Controlling notebook startup to edit or run examples

You can edit a simple example canvas app here: https://rawgit.com/pdfernhout/Twirlip7/master/src/ui/notebook.html#edit=examples/canvas-example.js

You can run the simple example canvas application here: http://rawgit.com/pdfernhout/Twirlip7/master/src/ui/notebook.html#eval=examples/canvas-example.js

You can edit a complex example IBIS app -- written using Twirlip7 -- here: https://rawgit.com/pdfernhout/Twirlip7/master/src/ui/notebook.html#edit=examples/ibis_application.js

You can run the complex example IBIS application: http://rawgit.com/pdfernhout/Twirlip7/master/src/ui/notebook.html#eval=examples/ibis_icons.js|examples/ibis_application.js

### Using the notebook to edit and run any JavaScript on GitHub

This edit and run functionality is mostly for demo purposes, but you can also edit or run any JavaScript on GitHub with relative path navigation on rawgit.
For example: https://rawgit.com/pdfernhout/Twirlip7/master/src/ui/notebook.html#edit=../../../../../MithrilJS/mithril.js/next/examples/todomvc/todomvc.js

You can even get that code to run (sort-of) by adding these extra three line of code just before the m.route line to create a needed div the app's HTML file otherwise supplies.
```
var div = document.createElement("div")  
div.id = "todoapp"  
document.body.appendChild(div)  
```

Click "Do it" to get that Mithril todomvc demo to sort-of work under Twirlip7.
The app will not have CSS styling so it will look odd. You could add Tachyons inline CSS to fix that.
Using the Mithril router in an app is also problematical if other apps you run in the same editor use routing too.
