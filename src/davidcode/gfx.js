var start_time = Date.now();

var time = (Date.now() - start_time) * 0.001;

var GFX = {
  scene: null,
  context: null,
  camera:null,
  renderer: null,
  lines_mesh :null,
  cube: null,
  // context2:null,
  // canvas2D:null,

  initCanvas : function ()
  {
    // this.canvas2D = document.createElement("canvas");
    // this.context2 = this.canvas2D.getContext("2d");
    // var bteditor_cont = document.getElementById("editor-canvas-container");
    // this.canvas2D.width = bteditor_cont.clientWidth;
    // this.canvas2D.height = bteditor_cont.clientHeight;
    // this.canvas2D.id = "BTEditor"
    // bteditor_cont.appendChild(this.canvas2D);
    // this.context2.fillStyle = "#222";
    // this.context2.font = "150px Arial";
    // this.context2.textAlign = "center";
    // this.context2.fillText("BTreeEditor",750, 500 );

    this.scene = new RD.Scene();
    this.context = GL.create({width: window.innerWidth -300, height: window.innerHeight,       alpha:true,
      premultipliedAlpha: false });
    this.context.onmouse = this.onmouse.bind(this)
    this.camera = new RD.Camera();
    //pos, target, ?
    this.camera.lookAt([200,130,500],[0,70,0],[0,1,0]);
    this.camera.perspective(45, this.context.canvas.width / this.context.canvas.height, 0.1,20000);

    floor = new RD.SceneNode();
    floor.name = "floor";
    floor.mesh = "planeXZ"
    floor.texture = "tiles.jpg";
    floor.shader = "phong_texture_shadow";
    floor.position = [0,-5,0];
    floor.scaling = 10000;
    floor.uniforms.u_tiling = vec2.fromValues(20,20);
    this.scene.root.addChild(floor);

    this.renderer = new RD.Renderer( this.context, {
      assets_folder: "src/assets/",
      shaders_file: "shaders.txt",
      // autoload_assets: true //default
    });

    // declare uniforms

    this.renderer._uniforms['u_ambient_light'] = vec3.fromValues(0.5,0.5,0.5),
    this.renderer._uniforms['u_light_position'] = vec3.fromValues(100, 3000, 100);
    this.renderer._uniforms['u_light_color'] = vec3.fromValues(0.9,0.9,0.9);
    this.renderer._uniforms['u_specular'] = 0.1;
    this.renderer._uniforms['u_glossiness'] = 20;
    this.renderer._uniforms['u_fresnel'] = 0.9;

    //

    this.background_color = vec3.fromValues(1,1,1);

    this.renderer.context.captureMouse(true);
    this.renderer.context.captureKeys(true);

    CORE.Player.panel.content.appendChild(this.renderer.canvas);

    // grid = new RD.SceneNode();
    // grid.mesh = "grid";
    // grid.scaling = 300;
    // grid.color = [0.2,0.2,0.2,0.7];
    // grid.primitive = gl.LINES;
    // this.scene.root.addChild(grid);
    // GFX.createEnviroment();

    var bg_color = vec4.fromValues(54/255, 75/255, 78/255,0);
    var last = now = getTime();

    requestAnimationFrame(animate);
  	function animate()
    {
  		requestAnimationFrame( animate );

  		last = now;
  		now = getTime();
      var dt = (now - last) * 0.001;
      time = (Date.now() - start_time) * 0.001;

      // if(GFX.context2.start2D)
      //   GFX.context2.start2D();
        
  		GFX.renderer.clear([0,0,0,0.1]);
      GFX.renderer.render(GFX.scene, GFX.camera);
  		GFX.scene.update(dt);
      update(dt);

      //GFX.draw_analysis(GFX.canvas2D, GFX.context2, dt);

  	}
    this.renderer.setPointSize(4);
    this.renderer.context.captureKeys();
    this.renderer.context.captureMouse(true);
    this.renderer.context.onmousemove = function(e){
      GFX.onmouse(e);
    }
    this.renderer.context.onmousedown= function(e){
      if(creation_mode)
      {
        console.log(e);
        var x = e.canvasx;
        var y = e.canvasy;

        var position = GFX.testCollision(x, y);
        var skeleton = new Skeleton("skeleton1" + Math.random(), "assets/Walking.dae", position, false);
        var animator1 = new Animator();
        animator1.animations = animations;
        animators.push( animator1 );
        var character = new Character("Billy" + Math.random(), skeleton, animator1);
        character.state["age"] = 20;
        characters.push(character);
      }

      else if(path_mode)
      {
        console.log("Path clicking");
      }
    }
    this.renderer.context.onkeydown = function(e)
    {
      if(e.keyCode == 87)
        tgt_node_up = true;

      if(e.keyCode == 83)
        tgt_node_down = true;

      if(e.keyCode == 65)
        tgt_node_left = true;
        

      if(e.keyCode == 68)
        tgt_node_right = true;

      if(e.keyCode == 46)
      {
        console.log("hola");
      }
    }

    this.renderer.context.onkeyup = function(e){

      if(e.keyCode == 87)
        tgt_node_up = false;
      
      if(e.keyCode == 83)
        tgt_node_down = false;

      if(e.keyCode == 65)
        tgt_node_left = false;
      
        

      if(e.keyCode == 68)
        tgt_node_right = false;
      
       
    }
  },

  onmouse : function( e )
  {
      if(e.type == "mousemove" && e.dragging)
      {
        if(e.rightButton)
        {

        }
        if(e.leftButton)
        {
          GFX.camera.orbit(e.deltax * -0.005,[0,1,0]);
          GFX.camera.orbit(e.deltay * -0.005,[1,0,0],null,true);
        }
        if(e.rightButton)
        {
          var vect = vec3.fromValues(e.deltax * -0.5, e.deltay * 0.5, 0);
          GFX.camera.moveLocal(vect)
        }
      }
      else if(e.type == "wheel"){
          GFX.camera.orbitDistanceFactor( 1.0 - (e.wheel / 2000) );
      }

  },

  updateCamera: function ()
  { 
    var pos = current_skeleton.root_bone.getGlobalPosition();

    var direction = GFX.rotateVector(current_skeleton.skeleton_container.getGlobalMatrix(), [0,0,-1]);
    direction = vec3.multiply(direction, direction, [200,200,200]);

    var eye = vec3.create();
    vec3.add(eye, pos, direction);
    vec3.add(eye, eye, [0,100,0]);
    

    GFX.camera.lookAt(
      eye,
      [pos[0], 120, pos[2]],
      [0, 1, 0]);
  },

  createEnviroment: function()
  {
    var cube = new RD.SceneNode();
    cube.mesh = "cube";
    cube.shader = "phong";
    cube.color = [1,1,1,1];
    cube.scale([50, 500, 50]);
    cube.position = [700,500/2,-500];
    GFX.scene.root.addChild(cube);

  },

  rotateVector : function( matrix, v )
  {
    var mat = mat4.clone( matrix );
    mat[12] = 0.0;
    mat[13] = 0.0;
    mat[14] = 0.0;

    var result = vec3.create();
    result  = mat4.multiplyVec3( result, mat, v );
    vec3.normalize(result, result);
    return result;
  },

  orientCharacter : function( sk_container )
  {
    console.log(head);
    var vect = vec3.create();
    vect = vec3.subtract( vect, head.getGlobalPosition(), target );
    vect = vec3.normalize( vect, vect );

    var front = GFX.rotateVector(head._global_matrix, RD.BACK)

    var dot = vec3.dot( front, vect )
    var degree = 1 - dot;

    var axis = vec3.create();
    axis = vec3.cross(axis, vect, front);
    var inverse_mat = mat4.create();
    inverse_mat = mat4.invert(inverse_mat, head._global_matrix);
    axis = GFX.rotateVector(inverse_mat, axis);

    //rotate de gl-matrix es el rotateLocal
    var result_mat = mat4.create();
    result_mat = mat4.rotate(result_mat, head._global_matrix, degree, axis )

    head.fromMatrix(result_mat);
  },

  testCollision : function(x,y)
  {
    var result = vec3.create();
        var ray = GFX.camera.getRay( x, y );
        var node = GFX.scene.testRay( ray, result, undefined, 0x1, true );
        if(node)
        {
          return result;
          // console.log(node.name);
          // console.log(result);
          // var node = new RD.SceneNode();
          // node.mesh = "sphere";
          // node.position = result;
          // node.scaling = 10;
          // node.color = [1,0,0,1]; 

          // GFX.scene.root.addChild(node);
        }
  }
}
