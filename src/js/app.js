var PLAYING = 1;
var STOP    = 2;
var state   = STOP;

var start_time  = 0;
var time        = 0;
var timer       = null;
var streaming_time 	= 0;
var streaming_fps 	= 1/30;

var updateTime = true;

var agent_selected 		= null;
var agent_selected_name = null;
var current_graph_node 	= null;
var agent_evaluated 	= null;

//stats
var stats = null;
var num_agents = 0;
var global_dt;

/*TOOL MODES */
var NAV_MODE 				= 0;
var IP_CREATION_MODE 		= 1;
var AGENT_CREATION_MODE 	= 2;
var POPULATE_CREATION_MODE 	= 3;
var PATH_CREATION_MODE 		= 4;
var RESPAWN_PATH_CREATION_MODE = 5;
var AREA_CREATION_MODE 		= 6;

var current_respawn_path = null;
var current_path = null;
var current_area = null;

var scene_mode = NAV_MODE;

var tmp = {
	vec : 	vec3.create(),
	axis : 	vec3.create(),
	axis2 : vec3.create(),
	inv_mat : mat4.create(), 
	agent_anim : null, 
	behaviour : null
}
var slerp_q = 0.95;
/*SETTINGS*/
var RENDER_PATHS 	= true;
var RENDER_SCENARIO = false;
var RENDER_FPS 		= true;

var streamer 		= null;
var scene_transfer 	= null;
var aux_bones 		= [];
var aux_bones_quat 	= [];
var bones_models 	= [];
var aux_bones_models 	= [];
var bones_quaternions 	= [];

//inside project, put agents, paths, scene properties, interest points, graph
var project 	= {};
var contexts	= {};
var hbt_graphs 	= {};
var current_graph;

var stylize = true;

function appinit()
{
	CORE.FS = new FileSystem();
	stats = new Stats();
	document.body.append( stats.dom );

	$(stats.dom).css({
		"top": LiteGUI.sizeToCSS(window.innerHeight-50),
		"left": LiteGUI.sizeToCSS(0),
	})

	
	GFX.initCanvas();
	window.onresize = resize;

	//This animation manager will manage the gets and new Animations, not Skeletal Animations
	animation_manager = new AnimationManager(); 
	loadInitialAnims(animation_manager);
	// loadTestAnim(animation_manager);
	
	
	hbt_context 	= new HBTContext();
	current_graph 	= new HBTGraph("by_default");
	current_graph.graph.context = hbt_context; //current_graph.graph -> LGraph
	hbt_graphs[current_graph.name] = current_graph;
	overrideFacade(hbt_context.facade);
	hbt_editor = new HBTEditor();
	CORE.GraphManager.top_inspector.refresh();
	path_manager = new PathManager();
	hbt_editor.init(current_graph);



	CORE.Player.renderStats();
	CORE.Scene.visualizeInterestPoints();

}
/******************************************************************************** */
function resize()
{
  GFX.context.canvas.width = GFX.context.canvas.clientWidth;
  GFX.context.canvas.height = GFX.context.canvas.clientHeight;
  GFX.context.viewport(0,0, GFX.context.canvas.width, GFX.context.canvas.height);

  console.log("resize");
  // resize sliders
	var sliders = document.querySelectorAll(".slider");

	for(var i = 0; i < sliders.length; i++) {
		sliders[i].width = CORE.GraphManager.inspector_area.root.offsetWidth;
	}

	CORE.Scene.inspector.refresh();
	CORE.Scene.agent_inspector.refresh();

  if(GFX.camera)
    GFX.camera.perspective(45, GFX.context.canvas.clientWidth / GFX.context.canvas.clientHeight, GFX.camera.near, GFX.camera.far);
}

/*********************************************************************************/
function update(dt)
{
	//Clear the path of the bt to avoid confusions when changes the path
	hbt_editor.graph.clearTriggeredSlots();
	//Clear the description to show as maybe the agent selected is changed or the path
	hbt_editor.graph.description_stack = [];

	if(agent_selected)
		GFX.updateCamera(agent_selected.scene_node);

	var camera = GFX.camera;
//    if(window.destination_eye)
//        vec3.lerp(camera.position, camera.position, window.destination_eye, 0.3);

	streaming_time +=dt;

	//Evaluate each agent on the scene
	for(var c in AgentManager.agents)
	{
		var character_ = AgentManager.agents[c]; 

		if(character_.scene_node.bones.length == 0)
		{
			tmp.agent_anim = character_.animationBlender.main_skeletal_animation;
			character_.scene_node.bones = tmp.agent_anim.skeleton.computeFinalBoneMatrices( character_.scene_node.bones, gl.meshes[ character_.scene_node.mesh ] );
			if(character_.scene_node.bones && character_.scene_node.bones.length)
				character_.scene_node.uniforms.u_bones = character_.scene_node.bones;
		}	
		
		if(character_.path == null)
		{
			if(Object.keys(path_manager._paths).length > 0)
			{
				var path = path_manager.getNearestPath(character_.scene_node.position);
				if(!path) 
					return;
					
				character_.path = path;
				character_.properties.target = character_.path.control_points[0];
				character_.last_controlpoint_index = 0;
			}
		}

		if(state == STOP)
			return;

		//reset look at, so if the behaviour does not return a look at position, set it up to look front
		character_.properties.look_at_pos = null;
		var agent_graph = hbt_graphs[character_.hbtgraph];
		tmp.behaviour = agent_graph.runBehaviour(character_, hbt_context, dt); //agent_graph -> HBTGraph, character puede ser var a = {prop1:2, prop2:43...}
		
		for(var b in tmp.behaviour)
		{
			character_.applyBehaviour( tmp.behaviour[b]);
			if(tmp.behaviour[b].type == 6)
				character_.properties[tmp.behaviour[b].data.name] = tmp.behaviour[b].data.value; 	
		}
		
		character_.animationBlender.animateMerging(character_, dt);	
		agent_evaluated = character_;

		if(character_.properties.target)
			character_.moveTo(character_.properties.target, dt);

		if(streaming_time >= streaming_fps)
			streamCharacter(character_);
	}  

	if(streaming_time >= streaming_fps)
		streaming_time -= streaming_fps;
	if(state == STOP)
		return;
}


var temp_vars = {
	temp_quat:quat.create()
}

function streamCharacter(character_)
{
	character_.num_id = 5;
	if(streamer && streamer.websocket.readyState == WebSocket.OPEN)
	{
		// debugger;
		aux_bones = character_.animationBlender.main_skeletal_animation.skeleton.bones;
		//scale -1 in z
		//remap
		// aux_bones = remapBones(aux_bones);
		bones_quaternions = getQuatFromBoneArray(aux_bones, character_.scene_node.rotation);
		var leg_quat = bones_quaternions[1];

		// bones_quaternions[1] = leg_quat;
		// bones_quaternions[1][0] = 0;
		// bones_quaternions[1][1] = 0.1;
		// bones_quaternions[1][2] = 0.2;
		// bones_quaternions[1][3] = 0.3;

		// debugger;
		// bones_models = getModelsFromBoneArray(aux_bones, character_.scene_node.rotation)
//		streamer.sendCharacterData(character_.num_id, character_.scene_node.position, bones_quaternions);
		streamer.sendCharacterData(character_.num_id, character_.scene_node.getGlobalMatrix(), bones_quaternions);
	}
}

function getQuatFromBoneArray ( array_of_bones, ch_rotation )
{
	aux_bones_quat = [];
	for (var i in array_of_bones)
	{	
		var quater = quat.create();
		var matrix = array_of_bones[i].model;
		var aux_mat = mat4.create();
		mat4.copy(aux_mat, matrix);

        if(streamer.configuration.rotateX180)
        {
        	mat4.rotate(aux_mat, aux_mat, 180*DEG2RAD, [1,0,0]);
        }
 
        if(streamer.configuration.rotateY180)
        {
        	mat4.rotate(aux_mat, aux_mat, 180*DEG2RAD, [0,1,0]);
        }
 
        if(streamer.configuration.rotateZ180)
        {
        	mat4.rotate(aux_mat, aux_mat, 180*DEG2RAD, [0,0,1]);
        }

		if(streamer.configuration.scale_in_z)
		{
			//FA
			var scaled_mat = mat4.create();
			mat4.scale(scaled_mat, aux_mat, vec3.fromValues(1,1,-1));
			quat.fromMat4(quater, scaled_mat);
		}
		if(streamer.configuration.scale_in_x)
		{
			//FA
			var scaled_mat = mat4.create();
			mat4.scale(scaled_mat, aux_mat, vec3.fromValues(-1,1,1));
			quat.fromMat4(quater, scaled_mat);
		}
		else if(!streamer.configuration.scale)
		{
			quat.fromMat4(quater, aux_mat);
		}

		if(streamer.configuration.invertQuat)
		{
			//FOR JAVI STREAMING METHOD
			quat.invert(quater, quater);
		}
		if(streamer.configuration.conjQuat)
		{
			//FOR JAVI STREAMING METHOD
			quat.conjugate(quater, quater);
		}
		if(streamer.configuration.apply_character_rot)
		{
			if(i == 0)
				quat.multiply(quater, quater, ch_rotation);
		}

		aux_bones_quat.push(quater);
	}

	return aux_bones_quat;

}

function getModelsFromBoneArray(array_of_bones, character_rotation)
{	
	aux_bones_models = [];
	for (var i = 0; i< array_of_bones.length; i++)
	{	
		var mat = mat4.create();
		mat4.copy(mat, array_of_bones[i].model) 
		var ch_mat = mat4.create();
		if(i == 0)
		{
			mat4.fromQuat(ch_mat, character_rotation);
			mat4.multiply(mat, ch_mat, mat);
		}
		
		aux_bones_models.push(mat);
	}

	return aux_bones_models;
}

if(!String.prototype.hasOwnProperty("replaceAll")) 
 Object.defineProperty(String.prototype, "replaceAll", {
  value: function(words){
   var str = this;
   for(var i in words)
    str = str.split(i).join(words[i]);
   return str;
  },
  enumerable: false
 });

 if(!String.prototype.hasOwnProperty("capitalizeFirstLetter")) 
 Object.defineProperty(String.prototype, "capitalizeFirstLetter", {
  value: function(){	 
	
   return this.charAt(0).toUpperCase() + this.substr(1);
  },
  enumerable: false
});

function loadInitialAnims (animation_manager)
{
	animation_manager.loadAnimation("assets/skanims/animations_ybot.skanim");
	animation_manager.loadAnimation("assets/skanims/idle.skanim");
	animation_manager.loadAnimation("assets/skanims/talking.skanim");
	animation_manager.loadAnimation("assets/skanims/walking.skanim");
	animation_manager.loadAnimation("assets/skanims/walking_texting.skanim");
	animation_manager.loadAnimation("assets/skanims/running.skanim");
	animation_manager.loadAnimation("assets/skanims/runningmax.skanim");
	animation_manager.loadAnimation("assets/skanims/runningslow.skanim");
	animation_manager.loadAnimation("assets/skanims/gesture.skanim");
	animation_manager.loadAnimation("assets/skanims/walk_with_bag.skanim");
	animation_manager.loadAnimation("assets/skanims/look_around.skanim");
	animation_manager.loadAnimation("assets/skanims/idle_around.skanim");
	animation_manager.loadAnimation("assets/skanims/guitar_playing.skanim");
	animation_manager.loadAnimation("assets/skanims/clapping.skanim");
}



