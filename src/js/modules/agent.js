var AgentManager = {
    name : "AgentManager",
	properties_log : {},
    agents: new Proxy({}, {
        set: (target, property, value, receiver) => {
            target[property] = value;

            if(property == "length")
                return true;
           
			AgentManager.createGUIParams( value );

            return true; 
        }     
    }),
    
    init(){
//		CORE.GUI.menu.add("Agents/· New Agent", () => {
//
//			var btn = document.getElementById("agent-mode-btn");
//			scene_mode = AGENT_CREATION_MODE;
////            CORE.Player.disableModeButtons(this.id);
//			document.getElementById("main_canvas").style.cursor = "cell";
//		} );
        
//		CORE.GUI.menu.add("Tools/· Create/· New Agent", () => {
//
//			var btn = document.getElementById("agent-mode-btn");
//			scene_mode = AGENT_CREATION_MODE;
////            CORE.Player.disableModeButtons(this.id);
//			document.getElementById("main_canvas").style.cursor = "cell";
//		} );

//        CORE.GUI.menu.add("Agents");
    },
	addPropertiesToLog(data, type){
		if(Object.keys(this.properties_log).length == 0 )
				this.properties_log = data;
		else
		{
			if(type == 1)
				this.properties_log[Object.key(data)[0]] = Object.values(data)[0];
		}
	},
    createGUIParams( agent ){
        if(!agent.dialog){
            var dialog = agent.dialog = new LiteGUI.Dialog( { id:"Settings", title:'Agent: '+ ((agent.properties && agent.properties.name)? agent.properties.name : agent.uid), close: true, minimize: false, width: 300, height: 500, scroll: false, resizable: false, draggable: true, parent:"body"});
            agent.dialog.setPosition(10,125);
//            CORE.GUI.menu.add("Agents/" + ((agent.properties && agent.properties.name)? agent.properties.name : agent.uid), {callback: function() { 
//				
//				agent.dialog.show();  
//				agent.dialog.setSize(300, 700);
//                agent.dialog.setPosition(window.outerWidth/2, window.outerHight/2);
//            } });
            // CORE.GUI.menu.remove("Agent/+ new Agent");
            // CORE.GUI.menu.add("Agent/+ new Agent", () => new Agent() );
        }
        if(!agent.inspector){
            var inspector = agent.inspector = new LiteGUI.Inspector(),
                properties = agent.properties,
                dialog = agent.dialog,
                uid = agent.uid;
            inspector.on_refresh = function(){
				
                properties = agent.properties,
                inspector.clear();
				inspector.widgets_per_row = 3;
                for(let p in properties){
                    
                    let widget = null;
                    if(properties[p] == null) continue;

                    switch(properties[p].constructor.name){
                        case "Number" : widget = inspector.addNumber( p, properties[p], { key: p, callback: function(v){ properties[this.options.key] = v } } );    break;
                        case "String" : { 
                            widget = inspector.addString( p, properties[p], { key: p, callback: function(v){ 

                            //Updates name reference in menu
                            if(this.options.key == "name"){
                                dialog.root.querySelector(".panel-header").innerText = "Agent: "+v;
                                CORE.GUI.menu.findMenu( "Agent/"+properties[this.options.key]).name = v;
                            }
                            properties[this.options.key] = v;

                            }});    break;
                        }
                        case "Boolean":  widget = inspector.addCheckbox( p, properties[p], { key: p, callback: function(v){ properties[this.options.key] = v } } );    break;
                        case "Array":
                        case "Float32Array": 
                            // switch(properties[p].length){
                            //     case 2:  widget = inspector.addVector2(p, properties[p], { key: p, callback: function(v){ properties[this.options.key] = v; } }); break;
                            //     case 3:  widget = inspector.addVector3(p, properties[p], { key: p, callback: function(v){ properties[this.options.key] = v; } }); break;
                            //     case 4:  widget = inspector.addVector4(p, properties[p], { key: p, callback: function(v){ properties[this.options.key] = v; } }); break;
                            // }
                            break;
                        default:    
                        // debugger;   
                            // console.warn( "parameter type from parameter "+p+" in agent "+ uid + " was not recognised");
                    }



                    if(!widget) continue;
                    widget.classList.add("draggable-item");
                    widget.addEventListener("dragstart", function(a){ 

						a.dataTransfer.setData("type", "HBTProperty" );
						a.dataTransfer.setData("name", a.srcElement.children[0].title );
//                        var str = a.srcElement.children[1].children[0].children[0].classList.value;
//                        var limit = 50;
//                        if(str.includes("checkbox"))
//                            limit = null;
//                        var obj = {}
//                        if(this.children[1].children[0].children[0].classList.contains('checkbox'))
//                        {
//                            obj = {name:a.srcElement.children[0].title, property_to_compare:a.srcElement.children[0].title, bool_state:true};
//                            a.dataTransfer.setData("type", "bool");
//                        } 
//                        else
//                            obj = {name:a.srcElement.children[0].title, property_to_compare:a.srcElement.children[0].title, limit_value:limit};
//                        obj = JSON.stringify(obj);
//                        a.dataTransfer.setData("obj", obj); 
                    });
                    widget.setAttribute("draggable", true);

                }
    
				inspector.addSeparator();
				inspector.widgets_per_row = 3;

				var _k,_v;
				inspector.addString(null, "",  { width:"42%", placeHolder:"param name",  callback: v => _k = v });
				inspector.addString(null, "",  { width:"42%", placeHolder:"value",       callback: v => _v = v });
				inspector.addButton(null, "+", { width:"16%", name_width:"0%",callback: e => {
					if(!_k || !_v) 
						return;
					try{ 
						_v = JSON.parse('{ "v":'+_v+'}').v;
					}catch(e){
						//if fails it was a string, so leave it as the string it was.
					}
					properties[_k] = _v; 

					inspector.refresh(); 
				}});

				inspector.widgets_per_row = 1;
				inspector.addSeparator();
				var graphs = hbt_context.getGraphNames();

				inspector.addCombo("Graph", graphs[0], {values:graphs});


				agent.dialog.adjustSize();
            }
            agent.dialog.adjustSize();
            agent.dialog.setPosition(window.outerWidth/2, window.outerHight/2);
            agent.dialog.add(inspector);
			agent.dialog.close();
            inspector.refresh();

            CORE.Player.renderStats();
        }
    },

    save_agents()
    {   
        var agents_to_save = [];
        for(var i in this.agents)
        {
            var agent = this.agents[i];
            var agent_ = {};
            agent_.uid = agent.uid;
            agent_.path = clearPath(agent.path);
            agent_.properties = agent.properties;
            agents_to_save.push(agent_);
        }
        // console.log(agents_to_save);
        return agents_to_save;
    },

	agentsFromJSON(agents)
	{
		for(var i = 0; i < agents.length; i++)
		{
			var agent_info = agents[i];
			var agent = new Agent(agent_info);
		}
	},

	exportAgents()
	{
		var agents = [];
		for (var i in this.agents)
		{
			var agent = this.agents[i];
            var agent_ = {}; 
			agent_.uid = agent.uid;
			agent_.position = agent.initial_pos;
			agent_.num_id = agent.num_id;
			agent_.hbtgraph = agent.hbtgraph;
			agent_.properties = agent.properties;
			agent_.properties.target = null;
			agents.push(agent_);
		}

		return agents;
	},
    
    deleteAgent(uid)
    {
        var agent = AgentManager.agents[uid];
		if(agent_selected && agent.uid == agent_selected.uid)
		{
			agent_selected.scene_node.removeChild(GFX.circle_node);
			GFX.scene.root.addChild(GFX.circle_node, true);
			GFX.circle_node.visible = false;
//			GFX.scene.root.removeChild(agent_selected.scene_node);
//			CORE.GUI.menu.remove("Agents/" + agent_selected.properties.name);
			agent_selected = null;
			agent_selected_name = null;
		}
		GFX.scene.root.removeChild(agent.scene_node);
//		CORE.GUI.menu.remove("Agents/" + agent.properties.name);

		CORE.Scene.agent_inspector.refresh();

        delete AgentManager.agents[uid];
    }, 
		
	deleteProperty(property_name)
	{
		for(var i in this.agents)
		{
			delete this.agents[i].properties[property_name];
			CORE.Scene.agent_inspector.refresh();
		}
	}
}

CORE.registerModule( AgentManager );


class Agent{
    /* A parameter is	 if we want to load an agent */
    constructor( o , pos){

        if(o)
        {
            this.configure(o, this)
            return;
        }

        this.uid = LS.generateUId('agent');  
		this.num_id = Object.keys(AgentManager.agents).length;

        this.btree = null;
        this.blackboard = blackboard;
		this.hbtgraph = "By_Default";

        this.path = null; 
		this.r_path = null;
		
        this.skeletal_animations = {};

        this.properties = {
            name: "Jim-" + guidGenerator(),
			happiness:0,
			energy:0,
			relax:0,
            age: 35,
			strength:30,
            hurry: 25,
            money:20,
            hungry:25,
            umbrella: false,
			gun:false,
			health:100,
            target: null, // this.path[0], 
            look_at_pos: [0,0,10000], 
			position: pos
        };
	
		var sk_pos = pos || [0,0,-1600];
		this.initial_pos = pos;
		this.scene_node = new RD.SceneNode();
		this.scene_node.uniforms["u_selected"] = false;
		this.scene_node.color = [1,1,1,1];
		this.scene_node.mesh = "Jim.wbin";
		this.scene_node.texture = "white";
		this.scene_node.shader = "skinning";
		this.scene_node.phase = Math.random();
		this.scene_node.id = LS.generateUId('scene_node');
		this.scene_node.phase = Math.random();
		this.scene_node.scaling = 1 + Math.random()*0.2;
		this.scene_node.position = sk_pos;
		this.scene_node.rotate(Math.random() * 360 * DEG2RAD,RD.UP);
		this.scene_node.color = [0.5 + Math.random()*0.5,0.5 + Math.random()*0.5,0.5 + Math.random()*0.5,1];
		GFX.scene.root.addChild(this.scene_node);

		this.animationBlender = new AnimationBlender();
		var anim = animation_manager.animations["walking"];
		this.animationBlender.main_skeletal_animation = anim;

		var duration = this.animationBlender.main_skeletal_animation.duration;
		this.animationBlender.current_time = this.scene_node.phase*duration;

		this.scene_node.bones = anim.skeleton.computeFinalBoneMatrices( this.scene_node.bones, gl.meshes[ this.scene_node.mesh ] );
		if(this.scene_node.bones && this.scene_node.bones.length)
			this.scene_node.uniforms.u_bones = this.scene_node.bones;

        var animation = animation_manager.animations["Walking"];
        if(animation)
        {
            var skeletal_animation = new SkeletalAnimation("Walking", animation);
            this.skeletal_animations["Walking"] = skeletal_animation; 
            this.animator.base_animation = skeletal_animation;
        }
        this.stylizer = new PoseStylizer();
        //Store agents 
        this.bt_info = {};
        AgentManager.agents[this.uid] = this;
		AgentManager.addPropertiesToLog(this.properties);

        LEvent.bind(this, "applyBehaviour", (function(e,p){
            this.animator.applyBehaviour(p);
        }).bind(this)); 

        LEvent.bind(this, "moveTo", (function(e,p){
            this.moveTo(p,global_dt);
        }).bind(this));
    }
    
    configure( o, agent )
    {
        // console.log(o);
        agent.uid = o.uid;
        agent.btree = null;
        agent.blackboard = blackboard;
		agent.hbtgraph = o.graph || "By_Default";

        agent.path = null;//[{id:1,pos:[2800,0,-2500],visited:false},{id:2,pos: [1900,0,1000],visited:false} ,{id:3,pos: [1300,0,1800],visited:false}, {id:4,pos: [-1500,0,1800],visited:false}, {id:5,pos: [-1300,0,0],visited:false}, {id:6,pos: [0,0,-750],visited:false}, {id:7,pos: [1500,0,-1050],visited:false}, {id:8,pos: [2500,0,-2500],visited:false}];
//        agent.current_waypoint = agent.path[0];
        agent.properties = o.properties;
        agent.properties.target = null; //agent.path[0];
        this.skeletal_animations = {};

        var sk_pos = o.position || [0,0,-1600];
		this.initial_pos = sk_pos;

		agent.scene_node = new RD.SceneNode();
		agent.scene_node.uniforms["u_selected"] = false;
		agent.scene_node.color = [1,1,1,1];
		agent.scene_node.mesh = "Jim.wbin";
		agent.scene_node.texture = "white";
		agent.scene_node.shader = "skinning";
		agent.scene_node.id = LS.generateUId('scene_node');
		agent.scene_node.phase = Math.random();
		agent.scene_node.scaling = 1 + Math.random()*0.2;
		agent.scene_node.position = sk_pos;
		agent.scene_node.rotate(Math.random() * 360 * DEG2RAD,RD.UP);
		agent.scene_node.color = [0.5 + Math.random()*0.5,0.5 + Math.random()*0.5,0.5 + Math.random()*0.5,1];
		GFX.scene.root.addChild(agent.scene_node);

        agent.animator = new Animator();
		agent.animationBlender = new AnimationBlender();
		var anim = animation_manager.animations["walking"];
		agent.animationBlender.main_skeletal_animation = anim;

		var duration = this.animationBlender.main_skeletal_animation.duration;
		this.animationBlender.current_time = this.scene_node.phase*duration;

		agent.scene_node.bones = anim.skeleton.computeFinalBoneMatrices( agent.scene_node.bones, gl.meshes[ agent.scene_node.mesh ] );
		if(agent.scene_node.bones && agent.scene_node.bones.length)
			agent.scene_node.uniforms.u_bones = agent.scene_node.bones;
//		this.animationBlender.addLayer(anim2, 1.0);

        agent.animator.agent_id = agent.uid;
		agent.stylizer = new PoseStylizer();
        var animation = animation_manager.animations["Walking"];
        if(animation)
        {
            var skeletal_animation = new SkeletalAnimation("Walking", animation);
            agent.skeletal_animations["Walking"] = skeletal_animation; 
            agent.animator.base_animation = skeletal_animation;
        }
        // this.animator.animations = animations; //toremove
        // this.head_node = this.getHeadNode(this.skeleton.name);
        // console.log(this.head_node);

        //Store agents 
        agent.bt_info = {};
        AgentManager.agents[agent.uid] = agent;
		AgentManager.addPropertiesToLog(agent.properties);

        LEvent.bind(agent, "applyBehaviour", (function(e,p){
            agent.animator.applyBehaviour(p);
        }).bind(agent)); 

        LEvent.bind(agent, "moveTo", (function(e,p){
            agent.moveTo(p,global_dt);
        }).bind(agent));
        agent.inspector.refresh();
    }
    visualizePath()
    {
        var vertices = [];
        // var path = new LS.Path();
        // path.closed = true;
        // path.type = LS.Path.LINE;

        for(var i = 0; i <this.path.length; ++i)
        {
            var waypoint_pos = this.path[i];
            vertices.push(waypoint_pos.pos[0], waypoint_pos.pos[1], waypoint_pos.pos[2] );
//            var node = new RD.SceneNode();
//            node.mesh = "sphere";
//            node.name = "path_waypoint"
//            node.position = waypoint_pos.pos;
//            node.color = [255/255,156/255,50/255,1];
//            node.scaling = 4;
//            node.render_priority = 1;
//            GFX.scene.root.addChild(node);
        }
        
        var path_mesh = "path_mesh";
        var lines_mesh = GL.Mesh.load({ vertices: vertices });
        
        GFX.renderer.meshes[path_mesh] = lines_mesh;
        var linea = new RD.SceneNode();
        linea.name = "Path";
        linea.flags.ignore_collisions = true;
        linea.primitive = gl.LINE_STRIP;
        linea.mesh = path_mesh;
        this.path_mesh = path_mesh;
        linea.color = [255/255,156/255,50/255,0.7]; 
//        linea.flags.depth_test = fals	e;
        GFX.scene.root.addChild(linea);
    }

    moveTo(target, dt)
    {
        if(this.animationBlender.motion_speed < 0.1)
            return;
        if(target.constructor == Array)
            target = target;
        else if(target.constructor == Float32Array)
            target = target;
        else    
            target = target.position;

        var motion_to_apply = this.animationBlender.motion_speed * (dt/0.0169);
        this.orientCharacter(this.scene_node, target, dt);
        var direction = GFX.rotateVector(this.scene_node.getGlobalMatrix(), [0,0,1]);
        direction = vec3.multiply(direction, direction, [this.animationBlender.playback_speed*motion_to_apply, this.animationBlender.playback_speed*motion_to_apply, this.animationBlender.playback_speed*motion_to_apply]);
        vec3.add(this.scene_node.position, this.scene_node.position, direction);
        this.scene_node.updateMatrices();
    }

    orientCharacter( skeleton, target )
    {         
        var tmpMat4 = mat4.create(), tmpQuat = quat.create();
        mat4.lookAt(tmpMat4, target, skeleton.getGlobalPosition(), [0,1,0]);
        quat.fromMat4(tmpQuat, tmpMat4);
        quat.slerp(tmpQuat, tmpQuat, skeleton.rotation, 0.975);
        skeleton._rotation = tmpQuat;
        skeleton.updateMatrices();
    }

    lookAt( target, dt)
    {
        //significa que se debe poner mirando al horizonte
        if(!target)
        {
            var direction = GFX.rotateVector(this.skeleton.skeleton_container.getGlobalMatrix(), [0,0,1]);
            direction = vec3.multiply(direction, direction, [10000, 10000, 10000]);
            this.orientHead(this.head_node, direction);
        }
        //han seteado el look at externamente 
        else{
            this.orientHead(this.head_node, target);
        }
    }

    orientHead( head, target)
    {
        //pasar el target a coordenadas locales del padre del head!!! Y luego hacer el resto
        var head_parent = head._parent;
        var global_parent = head_parent._global_matrix;
        var mat = mat4.create();
        var local_target = vec3.create();
        mat4.invert(mat, global_parent); //inverse head-parent-bone model
        vec3.transformMat4(local_target, target, mat);

        var tmpMat4 = mat4.create(), tmpQuat = quat.create();
        mat4.lookAt(tmpMat4, local_target, [0,0,0], RD.UP);
        quat.fromMat4(tmpQuat, tmpMat4);
        quat.slerp(tmpQuat, tmpQuat, head.rotation, 0.95);
        head._rotation = tmpQuat;
        head.updateMatrices();
    }

    getHeadNode(name)
    {
        return GFX.scene._nodes_by_id[name + "/mixamorig_Head"]
    }

    inTarget( target, threshold)
    {
		if(!threshold)
			var threshold = 100;

        if(!target)
			return false;
		var current_pos = []; 
		current_pos[0] = this.scene_node.getGlobalPosition()[0];
		current_pos[1] = this.scene_node.getGlobalPosition()[2];

		var a = vec2.fromValues(current_pos[0],current_pos[1]);
		var b = vec2.fromValues(target.position[0],target.position[2]);
		
		var dist = vec2.distance(a,b);
		// console.log("dist", dist);

		if(dist < threshold)
		{
			for(var i  in this.path)
				if(this.path[i] && this.path[i].id == target.id)
					this .path[i].visited = true;
			
			return true;
		} 
		return false;
    }

	isInTarget (target, threshold)
	{
	    var current_pos = []; 
        current_pos[0] = this.scene_node.getGlobalPosition()[0];
		current_pos[1] = this.scene_node.getGlobalPosition()[2];

		var a = vec2.fromValues(current_pos[0],current_pos[1]);
		var b = vec2.fromValues(target.position[0],target.position[2]);
		
		var dist = vec2.distance(a,b);
        // console.log("dist", dist);

        if(dist < threshold)
        {
            for(var i  in this.r_path.control_points)
                if(this.r_path.control_points[i].id == target.id)
                    this.r_path.control_points[i].visited = true;
            
            return true;
        } 
        return false;
	}


    canSeeElement( target, limit_angle )
    {
        var target_pos = target.pos;
        var direction = GFX.rotateVector(this.skeleton.skeleton_container.getGlobalMatrix(), [0,0,1]);
        var target_v = vec3.create();
        vec3.subtract(target_v, target_pos, this.skeleton.skeleton_container.getGlobalPosition());

        vec3.normalize(direction, direction);
        vec3.normalize(target_v, target_v);
        var dot = vec3.dot(direction, target_v);
        var angle = Math.acos(dot)*RAD2DEG;


        if(Math.abs(angle) > limit_angle)   return false;

        // console.log("Angulo", Math.abs(angle))
        return true;

    }
    getNextWaypoint()
    {
        for(var i in this.path)
        {
            if(this.path[i].visited == false)
            {
                this.current_waypoint = this.path[i];
                return this.path[i];
            }
        }
    }

	getNextControlPoint()
    {
        for(var i in this.r_path.control_points)
        {
            if(this.r_path.control_points[i].visited == false)
            {
                return this.r_path.control_points[i];
                
            }
        }
    }

    restorePath()
    {
        for(var i in this.path)
            this.path[i].visited = false;
        
        this.properties.target = this.path[0];
    }

    changeColor()
    {
        if(this.is_selected)
        {
            this.skeleton.line_color = [1,0,0,1];
            this.skeleton.addLines(this.skeleton.vertices);
        }
        else
        {
            this.skeleton.line_color = [0,1,1,1];
            this.skeleton.addLines(this.skeleton.vertices);
        }
    }

    checkNextTarget(current_wp)
    {
		if(!this.path)
			return false;
		if(this.properties.target.is_path)
            this.last_controlpoint_index +=1;
        //Reset path    
		if(!this.path.control_points[this.last_controlpoint_index]) 
			this.last_controlpoint_index =0;
		this.properties.target = this.path.control_points[this.last_controlpoint_index];
		return true;

    }

    generateRandomProperties()
    {

    }

	applyBehaviour( behaviour )
	{
		var behaviour_type = behaviour.type;
		switch(behaviour_type)
		{
			case B_TYPE.moveTo: 
				this.properties.target = behaviour.data;
				break;
			case B_TYPE.lookAt:
				this.properties.look_at = behaviour.data;
				break;
			case B_TYPE.animateSimple: 
				this.animator.applyBehaviour(behaviour.data);
				break;
			case B_TYPE.wait:
				break;
			case B_TYPE.nextTarget:
				this.properties.target = this.checkNextTarget();
				break;
			case B_TYPE.setMotion:
				this.animationBlender.motion_speed = behaviour.data;
				break;
			case B_TYPE.setProperties:
				this.properties[behaviour.data.name] = behaviour.data.value; 
				break;
			case B_TYPE.succeeder:
				break;
		}		
	}

	getLocalPosition()
	{
		this.scene_node.position;
	}

	getBonesRotationMatrices()
	{
	}

}

//	moveTo:0, 
//	lookAt:1,
//	animateSimple:2, 
//	wait:3, 
//	nextTarget:4,
//	setMotion:5, 
//	setProperties:6, 
//	succeeder:7

//-------------------------------------------------------------------------------------------------------------------------------------


