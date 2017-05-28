// Example of using markdown library included in base distribution

requirejs(["vendor/marked"], function(marked) {

    const markdownString = `
Examples of using __markdown__.

\`console.log("hello");\`

### THINK

Before you speak:

* T - is it *true*?
* H - is it *helpful*?
* I - is it *inspiring*?
* N - is it *necessary*?
* K - is it *kind*?

### Quotes

> "The biggest challenge of the 21st century is the irony of technologies of abundance in the hands of those still thinking in terms of scarcity."<br>(Paul D. Fernhout)

> "For the scientific method can teach us nothing else beyond how facts are related to, and conditioned by, each other.
> The aspiration toward such objective knowledge belongs to the highest of which man is capable, 
> and you will certainly not suspect me of wishing to belittle the achievements and the heroic efforts of man in this sphere.
> Yet it is equally clear that knowledge of what is does not open the door directly to what should be.
> One can have the clearest and most complete knowledge of what is, 
> and yet not be able to deduce from that what should be the goal of our human aspirations.
> Objective knowledge provides us with powerful instruments for the achievements of certain ends,
> but the ultimate goal itself and the longing to reach it must come from another source.
> And it is hardly necessary to argue for the view that our existence and our activity acquire meaning
> only by the setting up of such a goal and of corresponding values.
> The knowledge of truth as such is wonderful, but it is so little capable of acting as a guide that
> it cannot prove even the justification and the value of the aspiration toward that very knowledge of truth.
> Here we face, therefore, the limits of the purely rational conception of our existence." 
> (Albert Einstein, from [an address at Princeton Theological Seminary, May 19, 1939](http://www.sacred-texts.com/aor/einstein/einsci.htm))

> "Indeed, one must resist the temptation to make hierarchies into villains and meshworks into heroes, 
> not only because, as I said, they are constantly turning into one another, but because in real life we find only mixtures and hybrids, 
> and the properties of these cannot be established through theory alone but demand concrete experimentation. ...
> But even if we managed to promote not only heterogeneity, but diversity articulated into a meshwork, that still would not be a perfect solution. 
> After all, meshworks grow by drift and they may drift to places where we do not want to go.
> The goal-directedness of hierarchies is the kind of property that we may desire to keep at least for certain institutions.
> Hence, demonizing centralization and glorifying decentralization as the solution to all our problems would be wrong."
> (Manuel De Landa, from ["Meshworks, Hierarchies, and Interfaces"](http://www.t0.or.at/delanda/meshwork.htm))

> "Some problems are so complex that you have to be highly intelligent and well informed just to be undecided about them." (Laurence J. Peter)<br>
> [Quoted by Jeff Conklin in ["Wicked Problems and Social Complexity"](http://cognexus.org/wpf/wickedproblems.pdf),
> cited on the [High Performance Organizations Reading List](https://github.com/pdfernhout/High-Performance-Organizations-Reading-List)]

### HTML

<div class="comment">
  <em>Shuhari</em> (or <span class="special-text">守破離</span> in Japanese) <a href="https://en.wikipedia.org/wiki/Shuhari">roughly</a>
  translates to "first learn, then detach, and finally transcend."
</div>
<br>
<div class="comment">
  Aikido master Endō Seishirō shihan stated:
    <blockquote>
    "It is known that, when we learn or train in something, we pass through the stages of <em>shu</em>, <em>ha</em>, and <em>ri</em>.
    These stages are explained as follows.
    In <em>shu</em>, we repeat the forms and discipline ourselves so that our bodies absorb the forms that our forebears created.
    We remain faithful to these forms with no deviation.
    Next, in the stage of <em>ha</em>, once we have disciplined ourselves to acquire the forms and movements, we make innovations.
    In this process the forms may be broken and discarded.
    Finally, in <em>ri</em>, we completely depart from the forms, open the door to creative technique,
    and arrive in a place where we act in accordance with what our heart/mind desires, unhindered while not overstepping laws."
   </blockquote>
</div>
`

    Twirlip7.show(() => {
        return m("div", m.trust(marked(markdownString)))
    }, ".bg-green.br4")
})
