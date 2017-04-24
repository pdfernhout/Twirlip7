define([], function() {
    return [
        "alert(\"Hello, world!\")",
        "1 + 1",
        "function my_add(a, b) { return a + b }\n\nmy_add(2, 3)\n",
        "// You will have to reload the editor or use the inspector to remove this widget\nvar state = {\n    count: 0,\n    inc: function() {state.count++}\n}\n\nvar Counter = {\n    view: function() {\n        return m(\"div\", {onclick: state.inc}, state.count)\n    }\n}\n\nvar div = document.createElement(\"div\")\ndocument.body.appendChild(div)\nm.mount(div, Counter)",
        "var div = document.createElement(\"div\")\n\nvar state = {\n    count: 0,\n    inc: function() {state.count++}\n}\n\nvar Counter = {\n    view: function() {\n        return m(\"div\",\n            m(\"button\", {onclick: function () { document.body.removeChild(div) } }, \"X\"),\n            m(\"div\", {onclick: state.inc}, state.count)\n        )\n    }\n}\n\ndocument.body.appendChild(div)\nm.mount(div, Counter)",
        "var div = document.createElement(\"div\")\n\nvar state = {\n    count: 0,\n    inc: function() {state.count++}\n}\n\nvar Counter = {\n    view: function() {\n        return m(\"div.ba.ma3.pa3.bg-light-purple\",\n            m(\"button.fr\", {onclick: function () { document.body.removeChild(div) } }, \"X\"),\n            m(\"div\", {onclick: state.inc}, state.count)\n        )\n    }\n}\n\ndocument.body.appendChild(div)\nm.mount(div, Counter)",
        "let div = document.createElement(\"div\")\n \nlet counter = 0\n\nfunction testButtonClicked(increment) {\n    console.log(\"testButtonClicked\")\n    counter += increment\n}\n\nconst MyComponent = {\n  view(controller, args) {\n    return m(\"div.ba.ma3.pa3.bg-light-purple\",\n      m(\"button.fr\", {onclick: function () { document.body.removeChild(div) } }, \"X\"),\n      \"Hello world!\",\n      m(\"br\"),\n      \"counter: \" + counter,\n      m(\"button\", {onclick: testButtonClicked.bind(null, -1)}, \"-\"),\n      m(\"button\", {onclick: testButtonClicked.bind(null, 1)}, \"+\")\n    )\n  }\n}\n\ndocument.body.appendChild(div)\nm.mount(div, MyComponent)\n",
        "let div = document.createElement(\"div\")\n \nconst MyComponent = {\n  view(controller, args) {\n    return m(\"div.ba.ma3.pa3.bg-light-purple\",\n      m(\"button.fr\", {onclick: function () { document.body.removeChild(div) } }, \"X\"),\n      m(\"iframe\", {src: \"http://www.calphysics.org/haisch/Patent%207379286\", width: 800, height: 600})\n    )\n  }\n}\n\ndocument.body.appendChild(div)\nm.mount(div, MyComponent)\n"
    ]
})