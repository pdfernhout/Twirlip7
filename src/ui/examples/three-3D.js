// 3D display -- derived from three.js example: https://www.npmjs.com/package/three

requirejs(["vendor/three"], function(three) {
    /* global THREE */
    
    var scene, camera, renderer
    var geometry, material, mesh
    
    function init(width, height) {
     
        scene = new THREE.Scene()
     
        camera = new THREE.PerspectiveCamera( 75, width / height, 1, 10000 )
        camera.position.z = 1000
     
        geometry = new THREE.BoxGeometry( 200, 200, 200 )
        material = new THREE.MeshBasicMaterial( { color: 0xff0000, wireframe: true } )
     
        mesh = new THREE.Mesh( geometry, material )
        scene.add( mesh )
     
        renderer = new THREE.WebGLRenderer()
        renderer.setSize( width, height )
     
        return renderer.domElement
    }
    
    let animating = false
    
    function animate() {
        if (!animating) { return }
        
        requestAnimationFrame( animate )
        
        mesh.rotation.x += 0.01
        mesh.rotation.y += 0.02
        
        renderer.render( scene, camera )
    }
    
    function animateStart() {
        animating = true
        animate()
    }
    
    function animateStop() {
        animating = false
    }
    
    Twirlip7.show(() => {
        return m("div", {
            id: "test",
            style: {
                width: "25rem",
                height: "25rem",
            },
            oncreate(vnode) {
                vnode.dom.appendChild(init(vnode.dom.offsetWidth, vnode.dom.offsetHeight))
                animateStart()
            },
            onremove(vnode) {
                animateStop()
            }
        })
    }, ".bg-green.br4")
})
