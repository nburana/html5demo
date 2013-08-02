var Demo = Backbone.View.extend({
    events: {
        "click #animatescene": 'animateScene',
        "click #ambientlight": 'ambientLight',
        "click #directionallight": 'directionalLight',
        "click #createbakes": 'createBakes',
        "click #createbernice": 'createBernice',
        "click #createcrate": 'createCrate',
    },

    initialize: function() {
        //object cache
        this.bakes = null;
        this.bernice = null;
        this.crates = []
        this.stopAnimation = false;
        this.score = null;
        this.scoreContainer = null;
        
        this.PERSON_MASS = 9000000;
        this.BAKES_SPEED = 10;
        this.BERNICE_SPEED = 1;
        this.GENERAL_SPEED = 5;
        this.counter = 0;

        //key events
        _.bindAll(this);
        $(document).bind('keydown', this.captureKeys);

        this.initPhysics();
        this.initRenderer();
        this.initMaterials();
        this.initCamera();
        this.initScene();
        this.initTrees();
        this.initLights();

        this.render();
    },

    animate: function() {
        var self = this;

        this.animateBernice();
        this.render();
        
        if(this.counter % 2000 == 0) {
            $('#ekbaudio').load();
            $('#ekbaudio').get(0).play();
        }

        this.counter++;

        if(this.stopAnimation)
            return;

        // request new frame (like setInterval)
        requestAnimationFrame(function() {
            self.animate();
        });
    },

    animateScene: function() {
        this.stopAnimation = false;
        this.animate();
    },
    
    animateBernice: function() {
        if(!this.bakes || !this.bernice) {
            return;
        }

        if(this.bakes.position.x > this.bernice.position.x) {
            this.bernice.position.x += this.BERNICE_SPEED;
            this.bernice.__dirtyPosition = true;
        }

        if(this.bakes.position.x < this.bernice.position.x) {
            this.bernice.position.x -= this.BERNICE_SPEED;
            this.bernice.__dirtyPosition = true;
        }

        if(this.bakes.position.z > this.bernice.position.z) {
            this.bernice.position.z += this.BERNICE_SPEED;
            this.bernice.__dirtyPosition = true;
        }

        if(this.bakes.position.z < this.bernice.position.z) {
            this.bernice.position.z -= this.BERNICE_SPEED;
            this.bernice.__dirtyPosition = true;
        }
    },

    render: function() {
        this.scene.simulate(); // run physics
        this.renderer.render(this.scene, this.camera);
    },
    
    initPhysics: function() {
        Physijs.scripts.worker = '/static/physijs_worker.js';
        Physijs.scripts.ammo = '/static/ammo.js';
    },

    initRenderer: function() {
        // renderer
        this.renderer = new THREE.WebGLRenderer();

        this.renderer.setSize(this.$('#maincanvas').width(), this.$('#maincanvas').height());
        this.$('#maincanvas').append(this.renderer.domElement);
    },

    initMaterials: function() {
        var self = this;

        //materials
        this.backgroundMaterial = new THREE.MeshLambertMaterial({
                map: THREE.ImageUtils.loadTexture('/static/background.jpg', {}, function() {
                    self.render()
            })
        });

        var grassTexture = THREE.ImageUtils.loadTexture('/static/grass-texture.jpg')
        grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
        this.grassMaterial = new THREE.MeshBasicMaterial({
            map: grassTexture
        });
        
        this.treeTopMaterial = Physijs.createMaterial(
            new THREE.MeshPhongMaterial({
                color: new THREE.Color("#0B610B")
            }),
            .8,
            .3
        );

        this.treeTrunkMaterial = Physijs.createMaterial(
            new THREE.MeshPhongMaterial({
                color: new THREE.Color("#691C1C")
            }),
            .8,
            .3
        );
    },

    initScene: function() {
        var self = this;

        this.scene = new Physijs.Scene;
        this.scene.setGravity(new THREE.Vector3( 0, -100, 0 ));
       
        var back = new Physijs.BoxMesh(new THREE.PlaneGeometry(2000, 2000), this.backgroundMaterial, 0);
        back.overdraw = true;
        back.receiveShadow = true;
        back.position.y = 750;
        back.position.z = -500;
        this.scene.add(back);

        var ground = new Physijs.BoxMesh(new THREE.PlaneGeometry(2000, 2000), this.grassMaterial, 0);
        //var ground = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), this.grassMaterial);
        ground.overdraw = true;
        ground.receiveShadow = true;
        ground.position.x = 0;
        ground.position.y = 0;
        ground.position.z = 0;
        ground.rotation.x = -1.5707963267948983; 
        this.scene.add(ground);

        this.incrementScore();
    },
    
    initCamera: function() {
        // camera
        this.camera = new THREE.PerspectiveCamera(45, //wideness of the field of view
                                                  this.$('#maincanvas').width() / this.$('#maincanvas').height(), //aspect ratio
                                                  .1, //near
                                                  3000);  //far
        this.camera.position.y = 110;
        this.camera.position.z = 600;
    },

    initLights: function() {
        var ambientLight = new THREE.AmbientLight(new THREE.Color("#424242"));
        this.scene.add(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff);
        directionalLight.position.set(1, 1, 1).normalize();
        this.scene.add(directionalLight);
    },
    
    initTrees: function() {
        this.createTree(-150, -100);
        this.createTree(-400, -300);
        this.createTree(300, -380);
    },

    createBakes: function() {
        if(_.isEmpty(this.bakes)) {
            var self = this;

            var headMaterial = Physijs.createMaterial(
                new THREE.MeshPhongMaterial({
                    color: new THREE.Color("#FAAC58")
                }),
                .8,
                .01);
 
            this.bakes = new Physijs.SphereMesh(new THREE.SphereGeometry(15, 15, 15),
                                              headMaterial, 
                                              this.PERSON_MASS);

            this.bakes.name = "bakes";
            this.bakes.position.set(this.generateRandomPosition(), 60, this.generateRandomPosition());
            this.bakes.castShadow = true;
            this.bakes.receiveShadow = true;
 
            var bodyMaterial = Physijs.createMaterial(
                new THREE.MeshPhongMaterial({
                    color: new THREE.Color("#045FB4")
                }),
                .8,
                .01);
 
            var body = new Physijs.CylinderMesh(new THREE.CylinderGeometry(20, 20, 50),
                                                bodyMaterial, 
                                                this.PERSON_MASS);
            body.position.set(0, -35, 0);
            this.bakes.add(body);

            this.bakes.addEventListener( 'collision', function( other_object, relative_velocity, relative_rotation ) {
                if(other_object.name == "crate") {
                    self.incrementScore();
                    self.bakesAudio();
                }
            });

            this.scene.add(this.bakes);

            this.render();
        }
        else {
            alert("Nathan already exists");
        }
    },

    createBernice: function() {

        if(_.isEmpty(this.bernice)) {
            var self = this;

            var headMaterial = Physijs.createMaterial(
                new THREE.MeshPhongMaterial({
                    color: new THREE.Color("#8A4B08")
                }),
                .8,
                .01);
 
            this.bernice = new Physijs.SphereMesh(new THREE.SphereGeometry(20, 20, 20),
                                                  headMaterial, 
                                                  this.PERSON_MASS);

            this.bernice.name = "bernice";
            this.bernice.position.set(this.generateRandomPosition(), 130, this.generateRandomPosition());
            this.bernice.castShadow = true;
            this.bernice.receiveShadow = true;

            var dressMaterial = Physijs.createMaterial(
                new THREE.MeshPhongMaterial({
                    color: new THREE.Color("#B404AE")
                }),
                .8,
                .01);
 
            var dress = new Physijs.ConeMesh(new THREE.CylinderGeometry(50, 1, 90, 50, 50, false),
                                             dressMaterial,
                                             this.PERSON_MASS);
 
            dress.position.set(0, -35, 0);
            dress.rotation.x = this.toDegrees(180);
            this.bernice.add(dress);

            var legMaterial = Physijs.createMaterial(
                new THREE.MeshPhongMaterial({
                    color: new THREE.Color("#2E2E2E")
                }),
                .8,
                .01);
 
            var legs = new Physijs.BoxMesh(new THREE.CubeGeometry(35, 50, 35), legMaterial, this.PERSON_MASS);
            legs.position.set(0, -100, 0);
            this.bernice.add(legs);

            this.bernice.addEventListener( 'collision', function( other_object, relative_velocity, relative_rotation ) {
                if(other_object.name == "bakes") {
                    self.gameOver();
                    self.berniceAudio();
                }
            });

            this.scene.add(this.bernice);

            this.render();
        }
        else {
            alert("Bernice already exists");
        }
    },

    createCrate: function() {
        var self = this;

        var material = Physijs.createMaterial(
            new THREE.MeshLambertMaterial({
                map: THREE.ImageUtils.loadTexture('/static/crate.jpg', {}, function() {
                    self.render();
                })
            }),
            .8, //friction
            .2  //restitution (bouncyness)
        );
                
        var crate = new Physijs.BoxMesh(new THREE.CubeGeometry(30, 30, 30), material, 100);
        crate.name = "crate";
        crate.castShadow = true;
        crate.receiveShadow = true;
        crate.position.x = this.generateRandomPosition();
        crate.position.y = 300;
        crate.position.z = this.generateRandomPosition();

        this.scene.add(crate);
        this.crates.push(crate);

        return crate;
    },

    createTree: function(x, z) {
        var treeTop = new Physijs.ConeMesh(new THREE.CylinderGeometry(100, 1, 100, 100, 100, false),
                                           this.treeTopMaterial,
                                           0);
        treeTop.position.x = x;
        treeTop.position.y = 200;
        treeTop.position.z = z;
        treeTop.rotation.x = this.toDegrees(180);
        this.scene.add(treeTop);

        var treeTrunk = new Physijs.CylinderMesh(new THREE.CylinderGeometry(20, 20, 200, 5, 5, false),
                                                 this.treeTrunkMaterial,
                                                 0);
        treeTrunk.position.x = x;
        treeTrunk.position.y = 50;
        treeTrunk.position.z = z;
        this.scene.add(treeTrunk);
    },

    incrementScore: function() {
        //remove old container
        if(this.scoreContainer != null) {
            this.scene.remove(this.scoreContainer);
        }
            
        if(this.score == null) {
            this.score = "0";
        }
        else {
            this.score = (parseInt(this.score) + 1).toString();
        }
        
        var textGeom = new THREE.TextGeometry(this.score, {
            size: 40,
            height: 40,
            font: "helvetiker"
        });

        textGeom.computeBoundingBox();
        var textMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color("#FF0000")
        });

        this.scoreContainer = new THREE.Mesh(textGeom, textMaterial);
        this.scoreContainer.doubleSided = false;
        this.scoreContainer.position.x = 570;
        this.scoreContainer.position.y = 260;
        this.scoreContainer.position.z = -480;
        this.scoreContainer.lookAt(this.camera.position);

        this.scene.add(this.scoreContainer);
    },
 
    gameOver: function() {
        var textGeom = new THREE.TextGeometry("GAME OVER", {
            size: 100,
            height: 10,
            font: "helvetiker"
        });

        textGeom.computeBoundingBox();
        var textMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color("#FF0000")
        });

        this.textContainer = new THREE.Mesh(textGeom, textMaterial);
        this.textContainer.doubleSided = false;
        this.textContainer.position.x = -400;
        this.textContainer.position.y = 150;
        this.textContainer.position.z = 50;
        this.textContainer.rotation.y = 0.04426941110861904;

        this.scene.add(this.textContainer);

        this.stopAnimation = true;
    },

    bakesAudio: function() {
        $('#bakesaudio').load();
        $('#bakesaudio').get(0).play();
        this.counter++;
    },

    berniceAudio: function() {
        $('#berniceaudio').load();
        $('#berniceaudio').get(0).play();
    },

    generateRandomPosition: function() {
        var result = Math.floor(Math.random() * (400 - -400 + 1)) + -400;
        return result;
    },

    toDegrees: function(degree) {
        return degree * (Math.PI/180);
    },

    captureKeys: function(e) {
        console.log("keyCode: " + e.keyCode);
        switch(e.keyCode) {
            case 72: 
                this.camera.position.x -= this.GENERAL_SPEED;
                break;
            case 76:
                this.camera.position.x += this.GENERAL_SPEED;
                break;
            case 75:
                this.camera.position.y += this.GENERAL_SPEED;
                break;
            case 74:
                if(this.camera.position.y > 10) {
                    this.camera.position.y -= this.GENERAL_SPEED;
                }
                break;
            case 81:
                this.camera.rotation.x += this.toDegrees(1);
                break;
            case 65:
                this.camera.rotation.x -= this.toDegrees(1);
                break;
            case 73: 
                //camera forward
                this.camera.position.z -= this.GENERAL_SPEED;
                break;
            case 77: 
                //camera back
                this.camera.position.z += this.GENERAL_SPEED;
                break;
            case 37: 
                //left arrow
                this.bakes.position.x -= this.BAKES_SPEED;
                this.bakes.__dirtyPosition = true;
                break;
            case 38: 
                //up arrow
                this.bakes.position.z -= this.BAKES_SPEED;
                this.bakes.__dirtyPosition = true;
                break;
            case 39: 
                //right arrow
                this.bakes.position.x += this.BAKES_SPEED;
                this.bakes.__dirtyPosition = true;
                break;
            case 40: 
                //down arrow
                this.bakes.position.z += this.BAKES_SPEED;
                this.bakes.__dirtyPosition = true;
                break;
        }
        
        this.render();
    }
});
