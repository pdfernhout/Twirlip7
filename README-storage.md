There are currently four class-like things used for storage by the client-side UI code:

* NotebookBackend
* Pointrel20190820
* StoreUsingLocalStorage
* StoreUsingServer

The notebook was the first application written for Twirlip7. The notebook app defined how storage works (in NotebookBackend) as an ordered set of JSON objects called items. NotebookBackend stores everything in memory. An optional Store can be used with a NotebookBackend when it is created to store data either in local storage or on a server. 

This ordered set of JSON objects is often referred to as a "stream", especially on the server-side -- where each stream on the server is stored in a different file associated with a "streamId". 

Like NotebookBackend, Pointrel20190820 wraps a Store (always StoreUsingServer). But unlike NotebookBackend, Pointrel20190820 interprets the JSON objects in a stream as transactions of triples and presents a triplestore interface with an API including addTriple(a, b, c) and findC(a, b).

The method "addItem" is called on a Store (or NotebookBackend) to add "items" to a stream with a specific streamId.

For StoreUsingServer, addItem works by by wrapping items in another object called a "message" which has a userId, timestamp, the item, and a command -- in this case, the "insert" command. The message is then sent to the server. 

Here is the core code from StoreUsingServer -- which essentially defines the format of most of what is in a stream file on the server:
> sendMessage({command: "insert", streamId: alternateStreamId || streamId, item: item, userId: userId, timestamp: new Date().toISOString()})
    
A callback named "onAddItem" is used to receive "items" from a stream by the application (via a "responder") as new ones become available possibly from other applications using the same stream. The onAddItem callback will also be called for items that the application itself added to the stream. This means that applications which cache items before adding them to a stream must be tolerant of receiving a notification back from the store the same item they previously added (usually just moments ago).

The responder generally is a special object with just an onAddItem and an optional onLoaded fields. The responder then interacts with an application or library. A responder could also be any application with just an "addItem" method. The function "onLoaded" is called on a responder (if onLoaded is defined) when all the items in a stream have been sent.

The notebook is the only application that uses the NotebookBackend (either with a persistent Store or not).

Some other applications (chat, ibis, intercom, monitor, synchronizer) use the Store objects directly -- all using only the StoreUsingServer. 

Other applications (filer, organizer, outliner, sketcher, tables) use Pointrel20190820 which in turn uses StoreUsingServer.

Items in a local copy of a persistent server-side stream may not be in the exact same order as ones on the server -- due to caching of locally-created items before sending them to the server. Streams on different servers that are "synchronized" may also not have the same order of items as items from a stream on one server are added after items in a stream already on the other server. This reordering could cause a change in how the application displays data if the application was reloaded and the items are now in a different order. In theory, Twirlip applications should be written in a way that the ordering of items in a stream should not matter much. Applications can do this by creating an item-content-dependent ordering using timestamps, a vector clock, sequence numbers, or some other approach to define an order of items across a multi-user multi-server application. Or applications (and users) can just be tolerant of ordering changes.
