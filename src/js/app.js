var PLAYING = 1;
var STOP    = 2;
var state   = STOP;

var start_time  = 0;
var time        = 0;
var timer       = null;
var streaming_time = 0;
var streaming_fps = 1/30;

var updateTime = true;

var agent_selected = null;
var agent_selected_name = null;
var current_graph_node = null;
var agent_evaluated = null;

//stats
var stats = null;
var num_agents = 0;
var global_dt;

/*TOOL MODES */
var NAV_MODE = 0;
var IP_CREATION_MODE = 1;
var AGENT_CREATION_MODE = 2;
var POPULATE_CREATION_MODE = 3;
var PATH_CREATION_MODE = 4;
var RESPAWN_PATH_CREATION_MODE = 5;
var AREA_CREATION_MODE = 6;

var current_respawn_path = null;
var current_path = null;
var current_area = null;

var scene_mode = NAV_MODE;

var tmp = {
	vec : vec3.create(),
	axis : vec3.create(),
	axis2 : vec3.create(),
	inv_mat : mat4.create(), 
	agent_anim : null, 
	behaviour : null
}


/*SETTINGS*/
var RENDER_PATHS = true;
var RENDER_SCENARIO = false;
var RENDER_FPS = true;

var streamer = null;
var aux_bones = [];
var aux_bones_quat = [];
var aux_bones_models = [];
var bones_quaternions = [];
var bones_models = [];

//inside project, put agents, paths, scene properties, interest points, graph
var project = {};
var contexts= {};

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
	animation_manager.loadAnimation("assets/idle.skanim");
	animation_manager.loadAnimation("assets/walking.skanim");
	animation_manager.loadAnimation("assets/walking_texting.skanim");
	animation_manager.loadAnimation("assets/running.skanim");
	animation_manager.loadAnimation("assets/runningmax.skanim");
	animation_manager.loadAnimation("assets/runningslow.skanim");
	animation_manager.loadAnimation("assets/gesture.skanim");
	// animation_manager.loadAnimation("assets/umbrella.skanim");

	//Load Jim.mesh

	
	hbt_context = new HBTContext();
	overrideFacade(hbt_context.facade);
	hbt_editor = new HBTEditor();
	CORE.GraphManager.top_inspector.refresh();
	path_manager = new PathManager();



	hbt_editor.init(hbt_context.getGraphByName("By_Default"));

	if(window.localStorage.getItem("medusa_recovery"))
	{
		setProjectData();
	}
	CORE.Player.renderStats();
	CORE.Scene.visualizeInterestPoints();

	// testAreas();
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

		tmp.behaviour = hbt_context.evaluate(character_, dt);
		if(tmp.behaviour.type == 6)
		{
			character_.properties[tmp.behaviour.data.name] = tmp.behaviour.data.value; 
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
	character_.num_id = 6;
	if(streamer && streamer.websocket.readyState == WebSocket.OPEN)
	{
		debugger;
		aux_bones = character_.animationBlender.main_skeletal_animation.skeleton.bones;
		//remap
		aux_bones = remapBones(aux_bones);
		bones_quaternions = getQuatFromBoneArray(aux_bones, character_.scene_node.rotation);
		var leg_quat = bones_quaternions[1];
		
		// for(var i in bones_quaternions)
		// {
		// 	bones_quaternions[i] = quat.fromValues(0,0,0,1);
		// }

		bones_quaternions[1] = leg_quat;
		bones_quaternions[1][1] = 1 - bones_quaternions[1][1];

		console.log(bones_quaternions[1]);
		debugger;
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
		quat.fromMat4(quater, array_of_bones[i].model);
		//NOPE quat.invert(quater, quater);
//		if(i == 0)
//			quat.multiply(quater, quater, ch_rotation);
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

 function remapBones( original_bones )
 {
	 var remapped_bones = [];
    //     This is the Hips bone.
	//Hips = 0,
	remapped_bones.push(original_bones[0]);
	//
	//     This is the Left Upper Leg bone.
	//LeftUpperLeg = 1,
	remapped_bones.push(original_bones[62]);
	//
	//     This is the Right Upper Leg bone.
	//RightUpperLeg = 2,
	remapped_bones.push(original_bones[57]);
	//
	//     This is the Left Knee bone.
	//LeftLowerLeg = 3,
	remapped_bones.push(original_bones[63]);
	//
	//     This is the Right Knee bone.
	//RightLowerLeg = 4,
	remapped_bones.push(original_bones[58]);
	//
	//     This is the Left Ankle bone.
	// /LeftFoot = 5,
	remapped_bones.push(original_bones[64]);
	//
	///     This is the Right Ankle bone.
	//RightFoot = 6,
	remapped_bones.push(original_bones[59]);
	//
	//     This is the first Spine bone.
	//Spine = 7,
	remapped_bones.push(original_bones[1]);
	//
	//     This is the Chest bone.
	//Chest = 8,
	remapped_bones.push(original_bones[2]);
	//
	//     This is the Neck bone.
	//Neck = 9,
	remapped_bones.push(original_bones[4]);
	//
	//     This is the Head bone.
	//Head = 10,
	remapped_bones.push(original_bones[5]);
	//
	//     This is the Left Shoulder bone.
	//LeftShoulder = 11,
	remapped_bones.push(original_bones[9]);
	//
	//     This is the Right Shoulder bone.
	//RightShoulder = 12,
	remapped_bones.push(original_bones[33]);
	//
	//     This is the Left Upper Arm bone.
	//LeftUpperArm = 13,
	remapped_bones.push(original_bones[10]);
	//
	//     This is the Right Upper Arm bone.
	//RightUpperArm = 14,
	remapped_bones.push(original_bones[34]);
	//
	//     This is the Left Elbow bone.
	//LeftLowerArm = 15,
	remapped_bones.push(original_bones[11]);
	//
	//     This is the Right Elbow bone.
	//RightLowerArm = 16,
	remapped_bones.push(original_bones[35]);
	//
	//     This is the Left Wrist bone.
	//LeftHand = 17,
	remapped_bones.push(original_bones[12]);
	//
	//     This is the Right Wrist bone.
	//RightHand = 18,
	remapped_bones.push(original_bones[36]);
	//
	//     This is the Left Toes bone.
	//LeftToes = 19,
	remapped_bones.push(original_bones[65]);
	//
	//     This is the Right Toes bone.
	//RightToes = 20,
	remapped_bones.push(original_bones[60]);
	//
	//     This is the Left Eye bone.
	//LeftEye = 21,
	remapped_bones.push(original_bones[7]);
	//
	//     This is the Right Eye bone.
	//RightEye = 22,
	remapped_bones.push(original_bones[8]);
	//
	//     This is the Jaw bone.
	//Jaw = 23,
	remapped_bones.push(original_bones[0]);
	//
	//     This is the left thumb 1st phalange.
	//LeftThumbProximal = 24,
	remapped_bones.push(original_bones[0]);
	//
	//     This is the left thumb 2nd phalange.
	//LeftThumbIntermediate = 25,
	remapped_bones.push(original_bones[0]);
	//
	//     This is the left thumb 3rd phalange.
	//LeftThumbDistal = 26,
	remapped_bones.push(original_bones[0]);
	//
	//     This is the left index 1st phalange.
	//LeftIndexProximal = 27,
	remapped_bones.push(original_bones[0]);
	//
	//     This is the left index 2nd phalange.
	//LeftIndexIntermediate = 28,
	remapped_bones.push(original_bones[0]);
	//
	//     This is the left index 3rd phalange.
	//LeftIndexDistal = 29,
	remapped_bones.push(original_bones[0]);
	//
	//     This is the left middle 1st phalange.
	//LeftMiddleProximal = 30,
	remapped_bones.push(original_bones[0]);
	//
	//     This is the left middle 2nd phalange.
	//LeftMiddleIntermediate = 31,
	remapped_bones.push(original_bones[0]);
	//
	//     This is the left middle 3rd phalange.
	//LeftMiddleDistal = 32,
	remapped_bones.push(original_bones[0]);
	//
	//     This is the left ring 1st phalange.
	//LeftRingProximal = 33,
	remapped_bones.push(original_bones[0]);
	//
	//     This is the left ring 2nd phalange.
	//LeftRingIntermediate = 34,
	remapped_bones.push(original_bones[0]);
	//
	//     This is the left ring 3rd phalange.
	//LeftRingDistal = 35,
	remapped_bones.push(original_bones[0]);
	//
	//     This is the left little 1st phalange.
	//LeftLittleProximal = 36,
	remapped_bones.push(original_bones[0]);
	//
	//     This is the left little 2nd phalange.
	//LeftLittleIntermediate = 37,
	remapped_bones.push(original_bones[0]);
	//
	//     This is the left little 3rd phalange.
	//LeftLittleDistal = 38,
	remapped_bones.push(original_bones[0]);
	//
	//     This is the right thumb 1st phalange.
	//RightThumbProximal = 39,
	remapped_bones.push(original_bones[0]);
	//
	//     This is the right thumb 2nd phalange.
	//RightThumbIntermediate = 40,
	remapped_bones.push(original_bones[0]);
	//
	//     This is the right thumb 3rd phalange.
	//RightThumbDistal = 41,
	remapped_bones.push(original_bones[0]);
	//
	//     This is the right index 1st phalange.
	//RightIndexProximal = 42,
	remapped_bones.push(original_bones[0]);
	//
	//     This is the right index 2nd phalange.
	//RightIndexIntermediate = 43,
	remapped_bones.push(original_bones[0]);
	//
	//     This is the right index 3rd phalange.
	//RightIndexDistal = 44,
	remapped_bones.push(original_bones[0]);
	//
	//     This is the right middle 1st phalange.
	//RightMiddleProximal = 45,
	remapped_bones.push(original_bones[0]);
	//
	//     This is the right middle 2nd phalange.
	//RightMiddleIntermediate = 46,
	remapped_bones.push(original_bones[0]);
	//
	//     This is the right middle 3rd phalange.
	//RightMiddleDistal = 47,
	remapped_bones.push(original_bones[0]);
	//
	//     This is the right ring 1st phalange.
	//RightRingProximal = 48,
	remapped_bones.push(original_bones[0]);
	//
	//     This is the right ring 2nd phalange.
	//RightRingIntermediate = 49,
	remapped_bones.push(original_bones[0]);
	//
	//     This is the right ring 3rd phalange.
	//RightRingDistal = 50,
	remapped_bones.push(original_bones[0]);
	//
	//     This is the right little 1st phalange.
	//RightLittleProximal = 51,
	remapped_bones.push(original_bones[0]);
	//
	//     This is the right little 2nd phalange.
	//RightLittleIntermediate = 52,
	remapped_bones.push(original_bones[0]);
	//
	//     This is the right little 3rd phalange.
	// RightLittleDistal = 53,
	remapped_bones.push(original_bones[0]);
	//
	//     This is the Upper Chest bone.
	// UpperChest = 54,
	remapped_bones.push(original_bones[0]);
	//
	//     This is the Last bone index delimiter.
	// LastBone = 55

	return remapped_bones;
 }
