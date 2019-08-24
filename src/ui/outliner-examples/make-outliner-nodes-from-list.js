// make-outliner-nodes-from-list.js
/* eslint-disable no-console */
/* global p */

// This can be eval-ed in the outliner to make a bunch of new nodes under root on two levels

const data = `Types of information editors or viewers or content [date: 2018-01-27]
* Command line with surrounding environment
* teco / edlin -- line editor
* List
* Outliner
* Hierarchical files (kind of like outliner)
* Structured editor (XML, JSON, etc. -- like outliner but more specific)
* Text document
* Rich text document like HTML
* vi / vim / emacs / text editor (perhaps programmable)
* hex editor
* email
* 2D painting
* 2D drawing with objects
* 3D sculpting (minecraft?)
* 3D drawing with objects (CAD)
* Calendar
* Spreadsheet table
* Form (a row in a table? but might be hierarchical? a form of structured editor?)
* Text Chat (list of entries?)
* Voice / Video chat (streaming media)
* Interactive charts of various sorts (based on tables of data, but distinct)
* Generated reports of various sorts (based on tables of data and so on)
* A chooser / mover interface
-------
Context:
* Mixed-type list as linear succession of notes of different types (like Newton had)
* HyperCard Stack (like Newton list?)
* Search results (free text or tags) (a form of report?)
* Relational Database (much like a set of spreadsheet tables) (a form of IDE?)
* IDE -- hierarchical navigation and editing and commands to do things and generate things
* email client (a form of IDE?)
* Presentation maker (a form of IDE?)
* Project management (a form of IDE?)
* Smalltalk coding environment as sea of objects in an image (a form of IDE)
* Game or simulation (a form of IDE?)
* Wizard to move through forms (a type of IDE?)
* Web browser (a form of IDE?)
* Kansas / Nebraska / Second Life Virtual Worlds (a form of IDE?)`

function makeNode(contents, parentNode) {
    p.newTransaction("make-outliner-nodes-from-list")
    const node = new Node(p.uuidv4())
    node.setContents(contents)
    node.setParent(parentNode.uuid)
    parentNode.addChild(node.uuid)
    p.sendCurrentTransaction()
    return node
}

const lines = data.split("\n")
let parentNode = root
for (const line of lines) {
    if (line.startsWith("*")) {
        console.log("   " + line.substring(2))
        makeNode(line.substring(2).trim(), parentNode)
    } else {
        console.log(line)
        parentNode = root
        parentNode = makeNode(line.trim(), parentNode)
    }
}