/* Useful functions which do not belong to any class */

function getAnimationByName( name )
{
  for(var i in animations)
    if(animations[i].name == name)
      return animations[i];
}

function getListOfAnimations( )
{
  var result = [];
  for(var i in animations)
    result.push(animations[i].name)
  // console.log(result);
  return result
}

function onStartParsing()
{
	start_time = Date.now();
}

function clearPath(upath)
{
  var path = upath
  for(var i in path)
  {
    var wp = path[i];
    wp.visited = false;
  }
  return path;
}

String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
}

function disselectCharacter()
{
  for(var i in AgentManager.agents)
  {
    var character = AgentManager.agents[i];
    character.is_selected = false;
	character.scene_node.uniforms["u_selected"] = false;
  }
}

function guidGenerator() {
  var S4 = function() {
     return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
  };
  return (S4()+S4());//+"-"+S4());//+"-"+S4() +"-"+S4());
}


function getProjectData()
{
	var scenario = CORE.Scene.exportScenario();
	var agents = CORE.AgentManager.exportAgents();
	var behaviours = exportBehaviours();
	var paths = path_manager.exportPaths();
	console.log(paths);

	var medusa_recovery = {
		"scenario":scenario, 
		"agents": agents,
		"behaviours": behaviours,
		"paths": paths
	}
	return JSON.stringify(medusa_recovery);
}

function setProjectData()
{
	var project = JSON.parse(window.localStorage.getItem("medusa_recovery"));
	// CORE.Scene.sceneFromJSON(project.scenario);
	CORE.Scene.loadScene(project.scenario);
	CORE.AgentManager.agentsFromJSON(project.agents);
	path_manager.pathsFromJSON(project.paths);
	importBehaviours(project.behaviours);
	//Metodo para propagar propiedades de HBTproperty a agents
	CORE.GraphManager.top_inspector.refresh();
}

function exportBehaviours()
{
	var behaviours = {};
	for(var i in hbt_graphs)
	{
		var hbt = hbt_graphs[i];
		var hbt_graph_object = CORE.GraphManager.exportBehaviour(hbt.graph);
		behaviours[hbt.name] = hbt_graph_object;
	}

	return behaviours;
}

function importBehaviours(data)
{
	for(var i in data)
	{
		var behaviour = data[i];
		if(i == "by_default")
		{
			var hbt_graph = hbt_graphs[i];
			hbt_graph.graph.configure(behaviour.behaviour);
		}
		else
			{
			var new_hbt_graph = new HBTGraph(i);
			new_hbt_graph.graph.configure(behaviour.behaviour);
			hbt_graphs[i] = new_hbt_graph;
		}
		updateAgentPropertiesFromGraph(hbt_graph.graph);  
	}
}

function updateAgentPropertiesFromGraph(graph)
{
	for(var i in graph._nodes)
	{
		var node = graph._nodes[i];
		if(node.constructor.name == "HBTproperty")
		{
			addPropertyToAgents(node.combo.value, node.title);
		}
	}
}

function overrideFacade( facade )
{
	facade.getEntityPosition = function( entity )
	{
		if(entity)
		{
			return 	entity.scene_node.getGlobalPosition();
		}
	}

	facade.getEntityOrientation = function( entity )
	{
		if(entity)
			return entity.scene_node._rotation;
	}
	
	facade.setEntityProperty = function (entity, name, value) 
	{
		entity.properties[name] = value;
	}

	facade.getEntityPropertyValue = function( name , entity)
	{	
		var value = null;
		// this.title is the name of the property to search
		if(name == "position")
		{
			value = this.getEntityPosition( entity );
			return value;
		
		}
		else
		{
			//Get properties from the app
			if(CORE.Scene.bprops.includes(name))
			{
				value = CORE.Scene.zones["zone1"][name];
				if(typeof value === "undefined")
					value = null;
				return value;
			}
			//Get properties from the agent
			else if(entity)
			{
				value = entity.properties[name];
				if(typeof value === "undefined")
					value = null;
				return value;
			}
		}
	}

	facade.getListOfAgents = function(info)
	{
		if(CORE.AgentManager.agents)
			return CORE.AgentManager.agents;
		else
			return null;
	}

	facade.entityInTarget = function( entity, target_, threshold)
	{
		if(!target_ || isEmpty(target_))
			return false;
		if(target_.constructor == Float32Array)
			var target = target_;
		else
			var target = target_.constructor == Array ? target_ : target_.position;
		
		if(!target) target = entity.scene_node.position;
		var current_pos = []; 
		current_pos[0] = entity.scene_node.getGlobalPosition()[0];
		current_pos[1] = entity.scene_node.getGlobalPosition()[2];

		var a = vec2.fromValues(current_pos[0],current_pos[1]);
		var b = vec2.fromValues(target[0],target[2]);
		
		var dist = vec2.distance(a,b);
		// console.log("dist", dist);

		if(dist < threshold)
		{
			for(var i  in entity.path)
				if(entity.path[i] && entity.path[i].id == target.id)
					entity .path[i].visited = true;
			
			return true;
		} 
		return false;
	}

	facade.checkNextTarget = function( entity )
	{
		if(entity.checkNextTarget())
		{
			entity.in_target = false;
			return true;  
		}
		return false;
	}

	facade.entityHasProperty = function( entity, property )
	{
		return entity.properties[property] !== undefined;
	}

	facade.getInterestPoints = function()
	{
		return CORE.Scene.properties.interest_points;
	}

	facade.canSeeElement = function( entity , lookat, degrees, max_dist)
	{
		if(entity.canSeeElement(lookat, degrees, max_dist))
			return true;
		return false;
	}

	facade.applyTargetProperties = function( target_properties, entity )
	{
		CORE.Scene.applyTargetProperties(entity.properties.target, entity);
	}

	facade.setEntityProperty = function (entity, property, value)
	{
		entity.properties[property] = value;
	}

	facade.getAnimation = function( filename )
	{
		return animation_manager.animations[filename.toLowerCase()];
	}

}

function testAreas() 
{
	var point1 = [-100, 0, 100];
	var point2 = [100, 0, 100];
	var point3 = [150, 0, -100];
	var point4 = [0, 0, -200];
	var point5 = [-150, 0, -100];
	var point6 = [-100, 0, 100];

	var points = [point1, point2, point3, point4, point5, point6];

	var area = new PoligonalArea("test");
	area.fromvertices(points);

	console.log(area);
	area.node.color = area.color;
	area.node.flags.two_sided = true;
	GFX.scene.root.addChild(area.node);	
}


function getFilesFromEvent( e, options )
{
    var files = [];
    var that = this;

    //first the files
    for(var i=0; i < e.dataTransfer.files.length; i++)
    {
        var file = e.dataTransfer.files[i];
        if(!file.size)
            continue; //folders are files with 0 size
        files.push( file );
    }

    //then the items (they may be folders)
    for(var i=0; i < e.dataTransfer.items.length; i++)
    {
        var item = e.dataTransfer.items[i];
        var func = item.webkitGetAsEntry || item.mozGetAsEntry || item.getAsEntry; //experimental
        if(!func)
            break;
        var entry = func.call( item );
        if(!entry || !entry.isDirectory)
            continue; //not a folder
        traverseFileTree(entry);
    }

    function traverseFileTree( item, path ) {
        path = path || "";
        if (item.isFile) {
            // Get file
            item.file(function(file) {
                //files.push( file );
                that.processFileList([file],options,true);
            });
        } else if (item.isDirectory) {
            // Get folder contents
            var dirReader = item.createReader();
            dirReader.readEntries(function(entries) {
                for (var i=0; i<entries.length; i++) {
                    traverseFileTree(entries[i], path + item.name + "/");
                }
            });
        }
    }

    return files;
}
function processDrop (e)
{
	e.preventDefault();
	e.stopPropagation();
	var final_files = [];
	var that = this;
	var files = e.dataTransfer.files;
	for(let i = 0; i<files.length; i++ )
	{
		var reader = new FileReader();
		let file = files[i];
		var filename = file.name.split(".")[0].toLowerCase() 
		var ext = file.name.split(".")[1].toLowerCase();

		switch (ext) {
			
			case 'hdre':
				reader.readAsArrayBuffer(file);
				break;
			case 'json':
			case 'skanim':
				reader.readAsText(file);
				break;
			default:
				break;
		}
		
		reader.onload = function(e) 
		{
			switch (ext) {
			
				case 'hdre':
					HDR.parseHDRE(e.target.result, filename, import_end);
					// update environment map textures
					for(var i in GFX.scene.root.children)
						node.setTextures(filename);
					break;
				case 'json':
					var data = JSON.parse(e.target.result);
					console.log(data);
					if(files.length == 1)
					{
						CORE.GUI.openImportDialog(data, file);
					}
					else
					{
						final_files.push({"file":file, "data":data});
					}
				break;
				case 'skanim':
					CORE.GUI.openImportAnimationDialog(e.target.result, file);
					break;
				default:
					break;
			}
			if(final_files.length == files.length)
			{
				CORE.GUI.openImportDialog( final_files );
			}
		}
	}
	return;
	
}
function import_end()
{
	console.log("HDRE imported");
}


RD.SceneNode.prototype.setTextureProperties = async function()
{
	/*
	Encode properties in two vec4
	vec4 properties_array0
	vec4 properties_array1
	*/
    this.isEmissive = this.textures['emissive'] ? 1 : 0; 
    this.hasAlpha = this.textures['opacity'] ? 1 : 0;
    this.hasAO = this.textures['ao'] ? 1 : 0; 
    this.hasBump = this.textures['height'] ? 1 : 0; 
    
	this.hasAlbedo = this.textures['albedo'] ? 1 : 0; 
	this.hasRoughness = this.textures['roughness'] ? 1 : 0; 
	this.hasMetalness = this.textures['metalness'] ? 1 : 0; 
	this.hasNormal = this.textures['normal'] ? 1 : 0; 

	this._uniforms["u_properties_array0"] = vec4.fromValues(
			this.hasAlbedo,
			this.hasRoughness,
			this.hasMetalness,
			this.hasNormal
	);

	this._uniforms["u_properties_array1"] = vec4.fromValues(
			this.isEmissive,
			this.hasAlpha,
			this.hasAO,
			this.hasBump
	);
}

RD.SceneNode.prototype.setTextures = async function(filename)
{
	// update environment map textures
	var mipCount = 5;
	
	this.textures['brdf'] = "_brdf_integrator";
	this.textures['SpecularEnvSampler'] =  filename;

	for(var j = 1; j <= mipCount; j++)
		this.textures['Mip_EnvSampler' + j] = "@mip" + j + "__" +  filename;
}

/********************************************** Filmakademie REMAPPING **********************************************************/

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


 /* Patrol Overwrite */
Patrol.prototype.tick = function( agent )
{
	if(this.facade == null)
		this.facade = this.graph.context.facade;

	var animation = this.facade.getAnimation(this.properties.filename);
	
	if(!this.facade.getEntityPropertyValue("target", agent) || !animation)
	{
		this.behaviour.STATUS = STATUS.fail;
		this.graph.evaluation_behaviours.push(this.behaviour);
		return this.behaviour;
	}

	animation.weight = 1;
	var behaviour = {
		animation_to_merge: animation,
		motion: this.properties.motion_speed
	};

	if(!agent.properties.target.is_path)
		agent.checkNextTarget();

	if(this.isInTarget && this.isInTarget( agent ))
	{
		if(this.findNextTarget && this.findNextTarget(agent))
		{
			agent.evaluation_trace.push(this.id);
			this.description = 'Agent in target';
			this.behaviour.type = B_TYPE.nextTarget;
			this.behaviour.STATUS = STATUS.success;
			this.behaviour.setData(behaviour);
			this.behaviour.priority = this.properties.priority; 
			this.graph.evaluation_behaviours.push(this.behaviour);
			return this.behaviour;
		}
	}
	else
	{
		agent.evaluation_trace.push(this.id);
		this.description = 'Agent patroling';
		this.behaviour.type = B_TYPE.nextTarget;
		this.behaviour.STATUS = STATUS.success;
		this.behaviour.priority = this.properties.priority; 
		this.behaviour.setData(behaviour);
		this.graph.evaluation_behaviours.push(this.behaviour);
		return this.behaviour;
	
	}
}

quat.getAngle = function( a,b ){
	let dotproduct = vec4.dot(quat.normalize(a,a), quat.normalize(b,b));
	return Math.acos(2 * dotproduct * dotproduct - 1);
}


function hbtgraph_exists(name)
{
	if(hbt_graphs[name] != undefined) return true
	return false;
}
function propagateProperty(agent, property_name, property_type)
{
	if(agent.properties[property_name] == undefined || agent.properties[property_name] == null)
		if(property_type == "boolean")
			agent.properties[property_name] = false;
		else if(property_type == "number")
			agent.properties[property_name] = 0;
}