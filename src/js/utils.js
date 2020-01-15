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
	CORE.Scene.sceneFromJSON(project.scenario);
	CORE.AgentManager.agentsFromJSON(project.agents);
	path_manager.pathsFromJSON(project.paths);
	importBehaviours(project.behaviours);

	CORE.GraphManager.top_inspector.refresh();
}

function exportBehaviours()
{
	var behaviours = {};
	for(var i in hbt_context.list_of_graphs)
	{
		var hbt = hbt_context.list_of_graphs[i];
		var hbt_graph_object = CORE.GraphManager.exportBehaviour(hbt.graph);
		behaviours[hbt.name] = hbt_graph_object;
	}
	debugger;
	return behaviours;
}

function importBehaviours(data)
{
	debugger;
	for(var i in data)
	{
		var behaviour = data[i];
		if(i == "By_Default")
		{
			//get and configure
			var hbt_graph = hbt_context.getGraphByName(i);
			hbt_graph.graph.configure(behaviour.behaviour);
		}
		else
			{
			var new_hbt_graph = hbt_context.addHBTGraph(i);
			new_hbt_graph.graph.configure(behaviour.behaviour);
			//create and configure
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
				return value;
			}
			//Get properties from the agent
			else if(entity)
			{
				value = entity.properties[name];
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
		if(!target_)
			return false;
		if(target_.constructor == Float32Array)
			var target = target_;
		else
			var target = target_.constructor == Array ? target_ : target_.position;
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
		if(entity.properties[property])
			return true;
	}

	facade.getInterestPoints = function()
	{
		return CORE.Scene.properties.interest_points;
	}

	facade.canSeeElement = function( entity , lookat, degrees)
	{
		if(entity.canSeeElement(lookat, degrees))
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