var start_time = Date.now();
var time = (Date.now() - start_time) * 0.001;

var GFX = {
	dt:null,
    scene: null,
    context: null,
    camera: null,
    renderer: null,
    lines_mesh: null,
    cube: null,
	grab_point: vec3.create(),
	gizmo:null,
	render_gizmo:false, 
	move_camera_vector : vec3.create(),

    init_time_clicked: 0,

    initCanvas: function() {

		this.scene = new RD.Scene();
		this.gizmo = new RD.Gizmo();
		this.gizmo.mode = RD.Gizmo.MOVEX | RD.Gizmo.MOVEZ| RD.Gizmo.MOVEXZ| RD.Gizmo.ROTATEY;
        this.context = GL.create({
            width: window.innerWidth*0.4,
            height: window.innerHeight,
            alpha: true,
            premultipliedAlpha: false
        });
        this.context.onmouse = this.onmouse.bind(this);
		this.context.canvas.id = "main_canvas";
		
        this.camera = new RD.Camera();
        //Eye, Center, Up
		this.camera.lookAt([-1500, 250, 3000], [0, 80, 0], [0, 1, 0]);
		//Fov, Aspect, Near, Far
        this.camera.perspective(45, this.context.canvas.width / this.context.canvas.height, 50, 200000);
		
		var on_complete = function(mesh, url)
		{
			gl.meshes["Jim.mesh"] = mesh;
			$("#loading").fadeOut();
			PBR.setHDRE("assets/environments/evening_road.hdre", function(filename)
			{
				//to access from the agent creation to setTextures()
				GFX.environment = filename;
				//set up the first blurred version to the skybox 
				skybox.texture = "evening_road.hdre";
				if(window.localStorage.getItem("medusa_recovery"))
					setProjectData();
			});
		}

		GL.Mesh.fromURL("assets/meshes/Jim.wbin", on_complete, gl);
		PBR.init();

        // scenario = new RD.SceneNode();
		// scenario.mesh = "square.WBIN";
		// scenario.name = "scenario";
		// scenario.shader = "phong_shadow";
		// scenario.flags.ignore_collisions = true;
		// scenario.color = [1.0,1.0,1.0,1.0];
		// scenario.position = [0,0,0];
		// scenario.visible = false;
		// this.scene.root.addChild(scenario);

        floor = new RD.SceneNode();
        floor.name = "floor";
		floor.mesh = "planeXZ";
		floor.texture = "floor6.jpg";
		floor.shader = "phong_texture_shadow";
        floor.position = [0, -1, 0];
        floor.scaling = 100000;
		floor.uniforms.u_tiling = vec2.fromValues(600, 600);
		this.scene.root.addChild(floor);

		skybox = new RD.SceneNode();
		skybox.mesh = "cube";
		skybox.name = "skybox";
		skybox.scaling = 100000;
		skybox.flags.ignore_collisions = true;
		skybox.position = [0, 100, 0];
		skybox.shader = "skybox";
		skybox.flags.depth_test = false;
		skybox.flags.flip_normals = true;
		skybox.render_priority = RD.PRIORITY_BACKGROUND;
		this.scene.root.addChild(skybox);

		gl.canvas.ondragover = () => {return false};
		gl.canvas.ondragend = () => {return false};
		gl.canvas.ondrop = processDrop;
		
        this.renderer = new RD.Renderer(this.context, {
            assets_folder: "assets/",
            shaders_file: "shaders.txt",
		});

        // declare uniforms
        this.background_color = vec3.fromValues(0.7, 0.7, 0.7);
        this.renderer._uniforms['u_ambient_light'] = vec3.fromValues(1.0, 1.0, 1.0),
        this.renderer._uniforms['u_light_position'] = vec3.fromValues(10, 3000, 100);
        this.renderer._uniforms['u_light_color'] = vec3.fromValues(1.0, 1.0, 1.0);
        this.renderer._uniforms['u_specular'] = 0.1;
        this.renderer._uniforms['u_glossiness'] = 20;
        this.renderer._uniforms['u_fresnel'] = 0.1;
		this.renderer._uniforms['u_background_color'] = this.background_color;
		this.renderer._uniforms['u_ambient'] = vec3.create();
		this.renderer._uniforms['u_light_color'] = RD.WHITE;
		this.renderer._uniforms['u_light_vector'] = vec3.fromValues(0.577, 0.577, 0.577);

		//circle helper for selected agent
		this.circle_vertices = this.generateCircleVertices(64, 60);
		this.createSelectionCircles(this.circle_vertices);
		this.helper_circle_vertices = this.generateCircleVertices(64, 60);
		this.createAddHelperCircles(this.helper_circle_vertices);

        this.renderer.context.captureMouse(true);
        this.renderer.context.captureKeys(true);

		//append the canvas to the DOM element
        CORE.Player.panel.content.appendChild(this.renderer.canvas);

        var last = now = getTime();
        requestAnimationFrame(animate);

        function animate() {
            requestAnimationFrame(animate);

            last = now;
            now = getTime();
			var time2 = getTime()*0.001;
            GFX.dt = (now - last) * 0.001;
            global_dt = GFX.dt;
			GFX.animateSelectionCircles( now );
			stats.begin();
			GFX.camera.move(GFX.move_camera_vector);

			if(GFX.camera.position[1] < 20)
				GFX.camera.position[1] = 20;

            GFX.renderer.clear([0, 0, 0, 0.1]);
			GFX.renderer.render(GFX.scene, GFX.camera);
			if(GFX.render_gizmo)
				GFX.renderer.render(GFX.scene, GFX.camera, [GFX.gizmo]);
			
            CORE.Labels.update();

            GFX.scene.update(GFX.dt);
            update(GFX.dt);
			GFX.scene.update(GFX.dt);

			stats.end();
		}
		
        this.renderer.setPointSize(4);
        this.renderer.context.captureKeys(true);
        this.renderer.context.captureMouse(true);
        this.renderer.context.onmousemove = function(e) {
            GFX.onmouse(e);
        }
        this.renderer.context.onmousedown = function(e) {
            if(e.which == 3) //right mouse
			{
				var coll = GFX.testRayWithFloor(e);
				if(coll)
					GFX.grab_point.set( coll );
			}
        }
		this.renderer.context.onkeydown = function(e) 
		{
			if(e.keyCode == 37)
			{
				GFX.move_camera_vector[0] = -10;
			}
			if(e.keyCode == 38)
			{
				GFX.move_camera_vector[2] = -10;
			}
			if(e.keyCode == 39)
			{
				GFX.move_camera_vector[0] = 10;
			}
			if(e.keyCode == 40)
			{
				GFX.move_camera_vector[2] = 10;
			}
			if(e.shiftKey)
			{
                if(e.keyCode == 37) {

                    if(window.tmp_graph_container)
                    	return;

                    window.tmp_graph_container = CORE.GraphManager.graphcanvas.canvas.parentNode;
                    $("#full").append( CORE.GraphManager.graphcanvas.canvas).show();
                    hbt_editor.graph_canvas.resize();
                }

                if(e.keyCode == 39) {

                    if(!window.tmp_graph_container)
                    	return;

                    $(window.tmp_graph_container).append( CORE.GraphManager.graphcanvas.canvas);
                    $("#full").hide();
                    window.tmp_graph_container = null;
                    hbt_editor.graph_canvas.resize();
				}

				if(e.keyCode == 67)
				{
					if(agent_selected)
						agent_selected.scene_node.position = [0,0,0];
					
					else
					{
							GFX.camera.target = [0,100,0];
					}
					GFX.gizmo.updateGizmo();
				}
				//Reset scene
				if(e.keyCode == 78)
				{
					CORE.GUI.openNewSceneDialog()
				}
				//Restart simulation
				if(e.keyCode == 73)
				{
					CORE.Scene.restartSimulation()
				}
				//Shift + Backspace
				if(e.keyCode == 8)
				{		
					if(agent_selected)
					{
						AgentManager.deleteAgent(agent_selected.uid);
						GFX.gizmo.setTargets([]);
					}
				}
			}
			
			if(e.keyCode === 116) // F5 
			{
				e.preventDefault();
				e.stopPropagation();
				
				window.localStorage.removeItem("medusa_recovery");

				// refresh page
				window.location = window.location;
			}

			else if(e.keyCode === 117) // F6
			{
				e.preventDefault();
				e.stopPropagation();
				var data = getProjectData();
				window.localStorage.setItem("medusa_recovery", data);

				// refresh page
				window.location = window.location;
			}
        }

        this.renderer.context.onkeyup = function(e) {
			if(e.keyCode == 37 || e.keyCode == 39)
			{
				GFX.move_camera_vector[0] = 0;
			}
			if(e.keyCode == 38 || e.keyCode == 40)
			{
				GFX.move_camera_vector[2] = 0;
			}
			//supr
            if(e.keyCode == 46){
                for(var i in hbt_editor.graph_canvas.selected_nodes)
                {
                    var node = hbt_editor.graph_canvas.selected_nodes[i];
                    hbt_editor.graph.remove(node);
                }
			}
			//Esc
			if( e.keyCode == 27 ) 
			{
				disselectCharacter();
				if(agent_selected)
				{
					agent_selected.scene_node.removeChild(GFX.circle_node);
					GFX.scene.root.addChild(GFX.circle_node, true);
					GFX.circle_node.visible = false;
				}
				
				agent_selected = null;
				agent_selected_name = null;
				CORE.GraphManager.top_inspector.refresh();
				CORE.Scene.agent_inspector.refresh();

				var btn = document.getElementById("navigate-mode-btn");
				if(!btn.classList.contains("active"))
					btn.classList.add("active");
				
				document.getElementById("main_canvas").style.cursor = "default";
				scene_mode = NAV_MODE;
				CORE.Player.disableModeButtons(btn.id);
			}
			if(e.keyCode == 71)
				GFX.render_gizmo = !GFX.render_gizmo;

        }
            
    },

    onmouse: function(e) 
	{
        if (e.type == "mousemove" && e.dragging) {
			if(GFX.gizmo && GFX.gizmo.onMouse(e))
				return;
			if (e.leftButton) 
			{
                GFX.camera.orbit(e.deltax * GFX.dt *-0.1, [0, 1, 0]);
                GFX.camera.orbit(e.deltay * GFX.dt * -0.1, [1, 0, 0], null, true);
            }
			if (e.rightButton) 
			{
				var coll = GFX.testRayWithFloor(e);
				if(coll)
				{
					var delta = vec3.sub( vec3.create(), GFX.grab_point, coll );
					if(delta[0] > 800 )
						delta[0] = 800;
					if(delta[0] < -800 )
						delta[0] = -800;
					if(delta[2] > 800)
						delta[2] = 800;
					if(delta[2] < -800)
						delta[2] = -800;
					// console.log(delta)
					vec3.scale(delta, delta, 0.06)
					GFX.camera.move( delta );
				}
            }
		} 
		
		if(e.type == "mousemove")
		{
			if(GFX.gizmo && GFX.gizmo.onMouse(e))
				return;
			
			if(scene_mode == PATH_CREATION_MODE && current_path && current_path.control_points.length)
			{
				var length = current_path.control_points.length;
				var mouse = GFX.testCollision(e.canvasx, e.canvasy);

				if(mouse === undefined)
					return;

				var points = [
					current_path.control_points[length-1].position,
					mouse
				];
				GFX.setGuidePath(points);
			}
		}

		else if (e.type == "wheel")
		{
			if(GFX.gizmo && GFX.gizmo.onMouse(e))
            	return;
            GFX.camera.orbitDistanceFactor(1.0 + (e.wheel *-0.001*GFX.getCameraDistanceToTarget()));
		}
        
        else if (e.type == "mousedown") 
        {
			if(GFX.gizmo && GFX.gizmo.onMouse(e))
            	return;
            if (e.button == GL.LEFT_MOUSE_BUTTON ) 
                GFX.init_time_clicked = Date.now();
            
            else
                GFX.init_time_clicked = null;

		}
		
        else if ( e.type == "mouseup")
        {
			if(GFX.render_gizmo)
				CORE.Scene.agent_inspector.refresh();
            if(scene_mode == NAV_MODE)
            {
                if(!GFX.init_time_clicked) 
                    return;
    
                var dif = Date.now() - GFX.init_time_clicked;
                //check if the action is drag or a fast click
                if(dif < 150)
                {
                    var x = e.canvasx;
                    var y = e.canvasy;
                    //testRay with that spheres
                    var agent = GFX.getElementFromTestCollision(x, y, 1);
                    if (!agent) 
                    {
						GFX.gizmo.setTargets([]);
                        disselectCharacter();
						if(agent_selected)
						{
							agent_selected.scene_node.removeChild(GFX.circle_node);
							GFX.scene.root.addChild(GFX.circle_node, true);
							GFX.circle_node.visible = false;
						}
						
                        agent_selected = null;
                        agent_selected_name = null;
						CORE.GraphManager.top_inspector.refresh();
						CORE.Scene.agent_inspector.refresh();

                        //try with interest points
                        var ip_info = GFX.getElementFromTestCollision(x, y, 2);
                        if(ip_info)
                            CORE.Scene.showInterestPointInfo(ip_info, x, y);
                        return;
                    }

					if(agent_selected)
					{
						agent_selected.scene_node.removeChild(GFX.circle_node);
						agent.scene_node.addChild(GFX.circle_node);
						GFX.gizmo.setTargets([agent.scene_node]);
						GFX.circle_node.position = [0,0,0];
						CORE.GraphManager.putGraphOnEditor(agent.hbtgraph);
					}

					else
					{
						GFX.scene.root.removeChild(GFX.circle_node);
						agent.scene_node.addChild(GFX.circle_node);
						GFX.gizmo.setTargets([agent.scene_node]);
						GFX.circle_node.position = [0,0,0];
//						console.log(agent.hbtgraph);
						CORE.GraphManager.putGraphOnEditor(agent.hbtgraph);
					}

					disselectCharacter();
					agent.is_selected = true;
                    agent_selected_name = agent.properties.name;
                    agent_selected = agent;
					agent.scene_node.uniforms["u_selected"] = true;
					GFX.circle_node.visible = true;    

//                    CORE.GraphManager.renderStats();
					CORE.GraphManager.top_inspector.refresh();
					CORE.Scene.agent_inspector.refresh();
                }
            }
            else if(scene_mode == IP_CREATION_MODE)
            {
                if(!GFX.init_time_clicked) 
                	return;
                
                var dif = Date.now() - GFX.init_time_clicked;
                //check if the action is drag or a fast click    
                if(dif < 100)
                {
                    var x = e.canvasx;
                    var y = e.canvasy;
                    var position = GFX.testCollision(x, y);
                    CORE.Scene.addInterestPoint(position[0], position[2]);
                }
            }

			else if(scene_mode == AGENT_CREATION_MODE)
			{
				if(!GFX.init_time_clicked) 
                	return;
                
                var dif = Date.now() - GFX.init_time_clicked;
				console.log(dif);
                //check if the action is drag or a fast click    
                if(dif < 150)
                {
                    var x = e.canvasx;
                    var y = e.canvasy;
                    var position = GFX.testCollision(x, y);
					position[1] = 0;
                    var agent = new Agent(null, position);
					if(Object.keys(path_manager._paths).length > 0)
					{
						agent.path = path_manager.getNearestPath(position);
						agent.properties.target = agent.path.control_points[0]; 
						agent.last_controlpoint_index = 0;
					}
					if(GFX.gizmo)
						GFX.gizmo.setTargets([agent.scene_node]);
                }
			}

			else if(scene_mode == POPULATE_CREATION_MODE)
			{
				if(!GFX.init_time_clicked) 
                	return;
				var dif = Date.now() - GFX.init_time_clicked;
                //check if the action is drag or a fast click    
                if(dif < 150)
                {
					var x = e.canvasx;
					var y = e.canvasy;
					var position = GFX.testCollision(x, y);
					if(position)
					{
						position[1] = 0;
						CORE.GUI.showPopulateDialog( position );
					}
					document.getElementById("main_canvas").style.cursor = "default";
					scene_mode = NAV_MODE;
                }
			}

			else if(scene_mode == RESPAWN_PATH_CREATION_MODE)
			{
				if(!GFX.init_time_clicked) 
					return;
                
                var dif = Date.now() - GFX.init_time_clicked;
                //check if the action is drag or a fast click    
                if(dif < 150)
                {
                    var x = e.canvasx;
                    var y = e.canvasy;
                    var position = GFX.testCollision(x, y);
					if(position)
					{
						if(current_respawn_path.control_points.length > 0)
						{
							current_respawn_path.connectControlPoints(current_respawn_path.control_points[current_respawn_path.control_points.length-1].position, position);
						}
						current_respawn_path.addControlPoint(position);
					}
                    
                }
			}

			else if(scene_mode == PATH_CREATION_MODE)
			{
				if(!GFX.init_time_clicked) 
					return;
                
                var dif = Date.now() - GFX.init_time_clicked;
                //check if the action is drag or a fast click    
                if(dif < 150)
                {
                    var x = e.canvasx;
                    var y = e.canvasy;
                    var position = GFX.testCollision(x, y);
					if(position)
					{
						if(current_path.control_points.length > 0)
							current_path.connectControlPoints(current_path.control_points[current_path.control_points.length-1].position, position);
						
							current_path.addControlPoint(position);
					}
                }
			}

			else if(scene_mode == AREA_CREATION_MODE)
			{
				if(!GFX.init_time_clicked) 
					return;
                
                var dif = Date.now() - GFX.init_time_clicked;
                //check if the action is drag or a fast click    
                if(dif < 150)
                {
                    var x = e.canvasx;
                    var y = e.canvasy;
                    var position = GFX.testCollision(x, y);
					if(position)
					{
						if(current_area)
							current_area.addVertex(position);
						else
						{
							current_area = new PoligonalArea("P_area");
							current_area.addVertex(position);
						}
					}
                }
			}
		}
		if(GFX.gizmo.targets && GFX.gizmo.targets.length > 0)
		{
			if(GFX.gizmo)
			GFX.gizmo.onMouse(e);
		}
    },
	getCameraDistanceToTarget()
	{
		var c = 350;
		var dist = vec3.dist( GFX.camera.position, GFX.camera.target)
		var factor = dist/2000;
		if(factor > 1)
			factor = 1;
		if(factor < 0.3)
			factor = 0.3;
		return factor;

	},
	testRayWithFloor(e)
	{
		var ray = GFX.camera.getRay( e.canvasx, e.canvasy );
		if( ray.testPlane(RD.ZERO,RD.UP) )
			return ray.collision_point;
		return null;
	},
	
	setGuidePath( points ) {
		var vertices_ = [];
		for(var i = 0; i < points.length; ++i)
			vertices_.push(points[i][0], points[i][1], points[i][2]);

		if(!current_path.guide_line){
			
			current_path.guide_line_mesh = GL.Mesh.load({ vertices: vertices_ });
			this.renderer.meshes["guide_line_path"] = current_path.guide_line_mesh;

			current_path.guide_line = new RD.SceneNode();
			current_path.guide_line.flags.ignore_collisions = true;
			current_path.guide_line.primitive = gl.LINES;
			current_path.guide_line.mesh = "guide_line_path";
			current_path.guide_line.color = [255/255, 190/255, 60/255, 0.75];
			this.scene.root.addChild(current_path.guide_line);
		}
		else{
			current_path.guide_line_mesh.getBuffer("vertices").data.set( vertices_ );
			current_path.guide_line_mesh.getBuffer("vertices").upload( GL.STREAM_DRAW );
		}
	},


    updateCamera: function(skeleton) {

		var pos = skeleton.getGlobalPosition();
		pos[1] += 100;
		
		var last = GFX.camera.target;  
		vec3.lerp(pos, pos, last, 0.9);
		GFX.camera.target = pos;
    },

	orbitCamera: function(yaw, pitch)
	{
		var camera = GFX.camera;
		var problem_angle = vec3.dot( camera.getFront(), camera.up );
		
		var center = camera._target;
		var right = camera.getLocalVector(LS.RIGHT);
		var up = camera.up;
		//var eye = window.destination_eye;

		if(window.destination_eye === undefined)
			window.destination_eye = vec3.fromValues(camera.position[0], camera.position[1], camera.position[2]);
		
		var dist = vec3.sub( vec3.create(), window.destination_eye, center );
		//yaw
		var R = quat.fromAxisAngle( up, -yaw );
		vec3.transformQuat( dist, dist, R );

		if( !(problem_angle > 0.99 && pitch > 0 || problem_angle < -0.99 && pitch < 0)) 
				quat.setAxisAngle( R, right, pitch );
		vec3.transformQuat(dist, dist, R );

		vec3.add(window.destination_eye, dist, center);
		camera._must_update_matrix = true;
	},

    rotateVector: function(matrix, v) {
        var mat = mat4.clone(matrix);
        mat[12] = 0.0;
        mat[13] = 0.0;
        mat[14] = 0.0;

        var result = vec3.create();
        result = mat4.multiplyVec3(result, mat, v);
        vec3.normalize(result, result);
        return result;
    },

    testCollision: function(x, y) {
        var result = vec3.create();
        var ray = GFX.camera.getRay(x, y);
        var node = GFX.scene.testRay(ray, result, undefined, 0x1, true);
        if (node) 
            return result;
    },

    getElementFromTestCollision: function(x, y, type) {
        var result = vec3.create();
        var ray = GFX.camera.getRay(x, y);
        return GFX.testRayWithSpheres(ray, 60, type);
    },

    testRayWithSpheres: function(ray, radius, type) {

        if(type == 1)
        {
            var agents = CORE.AgentManager.agents;
			for (var i in agents) 
			{
                var agent = agents[i];
                var center = agent.scene_node.getGlobalPosition();
                center[1] = 112;
                var collision = ray.testSphere(center, radius, 10000);
    
                if (collision) 
                    return agent;

            }
        }
        else if(type == 2)
        {
            var interest_points = CORE.Scene.properties.interest_points;

            for(var i in interest_points)
            {   
                var type_ = i;
                var type_list = interest_points[i];
                for(var j in type_list) 
                {
                    var ip = type_list[j];
                    var position = ip.position;
                    var collision = ray.testSphere(position, 40, 10000);
                    if(collision)
                        return {ip:ip,ip_type:type_};
                    
                }
            }
        }
    },

	generateCircleVertices : function(num_vertices, radius)
	{
		var vertices = [];
		var points = [];
		var segmentWidth = Math.PI * 2 / num_vertices;
		var angle = 0;
		var x = 0;
		var y = 1;
		var z = 0;
		var init_pos = vec3.create();
		var end_pos = vec3.create();

		for(var i = 0; i < num_vertices; ++i)
		{
			x = Math.cos(angle)*radius;
			z = Math.sin(angle)*radius;

			end_pos  = vec3.fromValues(x, y, z);
			angle -= segmentWidth;
			
			points.push(end_pos);

			if(i == num_vertices-1)
			{
				var initpos = points[0];
				points.push(initpos);
			}
		}

		for(var j = 0; j < (points.length); ++j)
			vertices.push(points[j][0], points[j][1], points[j][2]);

		return vertices;
	}, 

	createSelectionCircles:function(vertices_)
	{
		this.helper_mesh = GL.Mesh.load({ vertices: vertices_ });
		GFX.renderer.meshes["circle_"] = this.helper_mesh;

		this.circle_node = new RD.SceneNode();
		this.circle_node.mesh = "circle_";
		this.circle_node.name = "circle";
		this.circle_node.color = [255/255, 255/255, 255/255,0.9];
		this.circle_node.primitive = GL.LINE_STRIP;
		this.circle_node.visible = false;
		this.scene.root.addChild(this.circle_node);

		this.circle_node2 = new RD.SceneNode();
		this.circle_node2.mesh = "circle_";
		this.circle_node2.name = "circle2";
		this.circle_node2.color = [255/255, 255/255, 255/255,0.9];
		this.circle_node2.primitive = GL.LINE_STRIP;
		this.circle_node.addChild(this.circle_node2);
	}, 

	createAddHelperCircles:function(vertices_)
	{
		this.helper_mesh = GL.Mesh.load({ vertices: vertices_ });
		GFX.renderer.meshes["circle"] = this.helper_mesh;

		this.pointer_helper = new RD.SceneNode();
		this.pointer_helper.mesh = "circle";
		this.pointer_helper.name = "helper_pointer";
		this.pointer_helper.color = [255/255, 255/255, 255/255,0.9];
		this.pointer_helper.primitive = GL.LINE_STRIP;
		this.pointer_helper.visible = false;
		this.pointer_helper.position = [0,0,0];
		this.scene.root.addChild(this.pointer_helper);
	}, 
	
	animateSelectionCircles : function( now )
	{
		GFX.circle_node.scaling = 0.9 + Math.sin(now*0.003)*0.1;
		GFX.circle_node2.scaling = 1.11 + Math.sin(now*0.003)*0.08;
	}
}
