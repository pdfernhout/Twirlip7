// Example of canonical JSON which will always have same string and so same hash
// Select each line and try "Print it" to see that it is true.

// Twirlip7 is a global variable defined by this application with some utility classes and functions.
// You can select just "Twirlip7" alone and press "Inspect it" 
// and then look in the console to see what fields it has.

// The following is so eslint does not complain about using single-quote strings here
/* eslint quotes: "off" */

JSON.stringify({b: 1, a: 2}) === '{"b":1,"a":2}'

Twirlip7.CanonicalJSON.stringify({b: 1, a: 2}) === '{"a":2,"b":1}'
