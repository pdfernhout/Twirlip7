2020-06-20 Challenges...

Twirlip7 is now about three years old as a project, even as its roots (including Pointrel) go back to the early 1980s.

So why am I not using this version?

Some things that hold me back:

* Data is not discoverable.
(Indexing might help with that, but not the same as a hierarchical file system or as in Smalltalk objects all connected back to a system dictionary of classes somehow...)

* The applications are limited compared to what can be used under Linux or any modern OS.

* Confusion about whether this is an document store or a triple store or just files.

* A large number of sha256 names files rapidly becomes a mess of its own sort.

* As always, do I want to trust a million received emails to it?

* Misses the power of the command line 

* No interoperation with file systems (see also command-line point above)

* Need to be able to sometimes delete data

* Need to be able to reorganize data

* Issue of embedding a context  into an object -- essentially, the location of which stream is placed into the object. Rocks on the ground or leaves on a tree do not have labels of where they are embedded in their structure. They are just somewhere. And potentially they can be moved to new locations. Embedding an initial context into an object when it is created limits the ability to easily or sensibly more the object into a new context or into nested contexts (move its context into another context).

* The power of the hierarchical file system (again).

* The use of JSON objects as stream IDs or triple A fields, while flexible in one way of endless specificity for an object, makes it hard to sort contexts (locations) or iterate through them as a tree or sorted list.

Been thinking sometimes of having a Twirlip server that can run in a git project (or any part of a file system). The server would support file operations in the subtree it was started in -- where the UI could tell the server to do most fopen commands and directory walking. Then everything Twirlip7 does with streams would be done in files named in the hierarchy (and potentially movable) at a loss of reference integrity). If desired, this system could still make a directory tree of sha256 objects in   subdirectory somewhere. But it could read and perhaps edit any files the server can access.subdirectory,

That was an impulse for the Twirlip15 experiment, going nowhere right now as harder to program these days for various reasons.

Also, as with Twirlip8 and other systems, the lack of discoverability and indexing has been nagging me.

Although, I have also realized that maybe "indexing" is best seen as a new service provided by the Twirlip server (with indexing done in the background). Versus trying to access streams. Or as I write this, maybe the server could synthesize streams that are indexed on demand, similar to ephemeral streams in a way but, say, as the server iterates over the file system of all sha256 objects and looks in them to see what the actual stream ID is for each hash?

So much good work towards applications in Twirlip7 -- yet none of them re that usable? The Notebook and Chat are maybe best ones -- but they suffer from the discoverability issue as above. hat Chat groups cna you use? WHat notebooks exist? I thought to solve that by emulating a file system -- and I did that in Twirlip2 or such to some degree with listing all saved streams -- but it was hacky and limited. And still does not address issue of interoperabilty with files.

A tension here. If go for a monolithic server, a bit solipsistic in not playing nice with the file system which most tools are organized around. The file system is essentially a place for tools to share and cooperate in. 

Also issue with monolithic sever of backing up the files. A reason for the sha256 approach vs. sticking everything in a sqlite database or in postgres. 

Hmmm....

Also, back to email and how to store it. A million emails. And then also big files like audio, video, books, etc..

From the whiteboard (sketching out over past week or two):
[Reorganized so types of data are last not first like on whiteboard]

Pointrel/Twirlip Storage

Types of files by creation/change
* Written Once
* Appended to
* Changed a few times
* Changed many times

Do different types of data get treated differently?

ONCE -- Image files, Videos, Books, etc. ()> 1 MB)
ONCE -- Transaction of Triples
ONCE (or APPEND?) -- Emails & similar (~1K to 30K)
ONCE -- Short Messages lke IRC (~100 bytes)
APPEND -- Log Files (big)
FEW -- Config Files (small)
MANY/ONCE? -- Nested Archives as Big Files or Directories
MANY -- Indexes for search by keyword or tag
MANY -- Databases (SQLite)
MANY -- Programming Files and Notes (unless rethought as versions)

I was concluding that in practice almost all files could be seen as append-only (with different apps) except for indexes which could be supplied as services. Writing something once is a special case of append-only. Modifying things a few times can be handled with appending a new version or a delta of changes at the end.

-----

One possible issue I;ve wrestled with is that once you have a million of something (emails) -- or billions or trillions of something (downloaded message archives? crawled web pages for Internet Archive?) -- then does the navigation need to change? Does a hierarchical approach break down past a few thousand items? And then you need to turn to something like search in an index? So would supporting working on files then be an intermediate state maybe that can be leaped over? But still need an indexing service of some sort (likely with a database).

What was brilliant about the original Pointrel implementation was that it potentially did just enough indexing by default to be useful. Essentially it supported finding things via tags, by finding the A's for a B-C... But, finding all the As (or triple referencing an A) would be an exhaustive search through the entire database... Unless, as I muse on it now, every time you added a new A you added it with a special tag (like "is concept"). And then you can find all the concepts... But if you have a million concepts (like one for each email) then you are back to dealing with a big unsorted mess -- unless you fetch a lot of data and do a sort or some such thing which is slow.

----

Yet still like the idea of each file (version) having an immutable sha256.

Especially so you could make resource references like:
{
    _type: "resource-reference",
    resourceReferenceId: "some-random-uuid-goes-here"
    resourceReferenceTimestamp: "2020-06-20Z01:23:45.001",
    resourceReferenceAuthor: "pdfernhout",
    resourceReferenceCopyright: "MIT",
    title: "Some sort of file with pictures of cats",
    location: "http://cats.org/someones-cats.tiff",
    fileContentType: "TIFF",
    sizeBytes: 5092456,
    sha256: "1234567...",
    resourceAuthor: "somebody",
    resourceCopyright: "Unknown",
}

Right now we use plain URLs, but having metadata with the URL would be more useful, including to find it bay SHA256 if it moved or was deleted.

That JSON object is implicitly a set of triples with an undefined A field. Which could be added as an "id" field perhaps of "some-random-uuid" (updated above)

But maybe that is a pipe dream? And git does it good enough for now?

Maybe better to make a system on top of regular files first? Then could improve if still want to? And can always use regular files to implement something.
