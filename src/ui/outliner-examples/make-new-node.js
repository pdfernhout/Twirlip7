// test of eval
/* eslint-disable no-console */
/* global p */

// This can be eval-ed in the outliner to make a new node under root.

console.log("p", p)
console.log("root", root)

const node = new Node(p.uuidv4())
console.log("new node", node)
const contents = "Test on Eval to Make New Node"

p.newTransaction("make-new-node")
node.setContents(contents)
node.setParent(root.uuid)
root.addChild(node.uuid)
p.sendCurrentTransaction()
