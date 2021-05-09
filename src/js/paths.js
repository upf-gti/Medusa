function PathManager ()
{
	if(this.constructor !== PathManager)
		throw("You must use new to create an PathManager");
	this._ctor();
}

PathManager.prototype._ctor = function()
{
	this._paths = {};

}

PathManager.prototype.addPath = function( path )
{
	this._paths[path.id] = path;
}

PathManager.prototype.getNearestPath = function( position )
{
	var min = 99999999;
	var nearest = null;
	for (var i in this._paths)
	{
		var path = this._paths[i]; 
		var first_cp = path.control_points[0];
		if(!first_cp) return;
		var dist = vec3.dist(first_cp.position, position);
    
		if(dist < min)
		{
			min = dist;
			nearest = path;
		}
	}
	// console.log(nearest);
	return nearest;
}

PathManager.prototype.exportPaths = function()
{
	var final_paths = [];
	for(var i in this._paths)
	{
		var	path = this._paths[i];
		var f_path = {};
		f_path.id = path.id;
		f_path.control_points_positions = path.getControlPointsPositions();
		final_paths.push(f_path);
	}
	return final_paths;
}

PathManager.prototype.deleteAllPaths = function()
{
	for(var i = GFX.scene._nodes.length-1; i>0 ;i--)
	{
		var node = GFX.scene._nodes[i] 
		if(node.name == 'path_ball' || node.name == 'path_line' )
			GFX.scene.root.removeChild(node);
			
	}
}

PathManager.prototype.pathsFromJSON = function(data)
{
	for(var i = 0; i < data.length; i++)
	{
		var current_path = data[i];
		var new_path = new Path();
		new_path.id = current_path.id;

		for(var j = 0; j < current_path.control_points_positions.length; j++)
		{
			//just add
			if(j == 0)
			{
				new_path.addControlPoint(current_path.control_points_positions[j]);
			}
			//add and connect to previous
			else if(j > 0)
			{
				new_path.addControlPoint(current_path.control_points_positions[j]);
				new_path.connectControlPoints(current_path.control_points_positions[j-1], current_path.control_points_positions[j]);
			}
		}

		this.addPath(new_path);
	}
}


function Path ()
{
	if(this.constructor !== Path)
		throw("You must use new to create an Path");
	this._ctor();
}

Path.prototype._ctor = function()
{
	this.id = Math.floor(Math.random()*1000);
    this.control_points = [];
	this.guide_line = null;
}


/*
*
*/

Path.prototype.addControlPoint = function( position )
{
	if(!position) return;
	var color = [255/255, 170/255, 40/255, 0.75]
	var node = new RD.SceneNode();
	node.id = 200 + Math.floor(Math.random()*100);
	node.color = color;
	node.shader = "phong_shadow";
	node.mesh = "sphere";
	node.name = "path_ball" + node.id.toString()
	node.blend_mode = RD.BLEND_ALPHA;
	node.position = [position[0],0,position[2]];
	node.scale(20,20,20);
	node.render_priority = RD.PRIORITY_ALPHA;
	node.is_path = true;

	if(this.control_points.length == 0)
		node.visited = true;
	else
		node.visited = false;

	GFX.scene.root.addChild(node);
	this.control_points.push(node); 
}
Path.prototype.getControlPointsPositions = function()
{
	var cp_positions = [];
	for(var i in this.control_points)
	{
		var cp = this.control_points[i];
		cp_positions.push(cp.position);
	}
	return cp_positions;
}
Path.prototype.deleteControlPoint = function()
{

}
/*
* Adds an agent at the first control point when necessary
*/
Path.prototype.addAgentToPath = function()
{
	var agent = new Agent(null, this.control_points[0].position);
	this.agents_ids.push(agent.uid);
	agent.r_path = this;
	agent.properties.target = this.control_points[1];
	agent.last_cp_index = 1;

}

Path.prototype.deleteAgentFromPath = function( uid )
{
	
}

Path.prototype.checkPathSettings = function()
{
	if(this.agents_ids.length == this.density) return {status:this.IN_BOUNDARY};
	else if(this.agents_ids.length < this.density)
		return {status:this.UNDERPOPULATED};
}

Path.prototype.connectControlPoints = function( control_p1, control_p2 )
{
	var vertices_ = [];
	if(control_p1 && control_p2)
	{
		vertices_.push(control_p1[0], 0, control_p1[2]);
		vertices_.push(control_p2[0], 0, control_p2[2]);
	}

	var line_mesh = GL.Mesh.load({ vertices: vertices_ });
	var mesh_name = "control_point_line" + control_p2

    GFX.renderer.meshes[mesh_name] = line_mesh;
    var line_node = new RD.SceneNode();
    line_node.name = "path_line";
    line_node.flags.ignore_collisions = true;
    line_node.primitive = gl.LINES;
    line_node.mesh = mesh_name;
    line_node.color = [255/255, 170/255, 40/255, 0.5];
    //linea.flags.depth_test = true;
    //linea.render_priority = RD.PRIORITY_HUD;
    GFX.scene.root.addChild(line_node);

}


//*****************************************************************************************************************
//*****************************************************************************************************************
//*****************************************************************************************************************



function RespawningPathManager ()
{
	if(this.constructor !== RespawningPathManager)
		throw("You must use new to create an RespawningPathManager");
	this._ctor();
}

RespawningPathManager.prototype._ctor = function()
{
	this.respawning_paths = {};

}

RespawningPathManager.prototype.addPath = function( path )
{
	this.respawning_paths[path.id] = path;
}


function RespawningPath ()
{
	if(this.constructor !== RespawningPath)
		throw("You must use new to create an RespawningPath");
	this._ctor();
}

RespawningPath.prototype._ctor = function()
{
	this.IN_BOUNDARY = 0;
	this.OVERPOPULATED = 1;
	this.UNDERPOPULATED = 2;

	this.STATUS = this.IN_BOUNDARY;
	this.id = Math.floor(Math.random()*1000);
    this.control_points = [];
	this.density = 1;
	this.agents_ids = [];
	this.last_check_time = 0;
	this.interval = 0;
}
/*

*/
RespawningPath.prototype.addControlPoint = function( position )
{
	var color = [255/255, 170/255, 40/255, 0.75]
	var node = new RD.SceneNode();
	node.id = 200 + Math.floor(Math.random()*100);
	node.color = color;
	node.shader = "phong_shadow";
	node.mesh = "sphere";
	node.blend_mode = RD.BLEND_ALPHA;
	node.position = [position[0],0,position[2]];
	node.scale(20,20,20);
	node.render_priority = RD.PRIORITY_ALPHA;

	if(this.control_points.length == 0)
		node.visited = true;
	else
		node.visited = false;

	GFX.scene.root.addChild(node);
	CORE.GUI.showPopulateRespawnDialog();
	this.control_points.push(node); 
}

RespawningPath.prototype.deleteControlPoint = function()
{

}
/*
* Adds an agent at the first control point when necessary
*/
RespawningPath.prototype.addAgentToPath = function()
{
	var agent = new Agent(null, this.control_points[0].position);
	this.agents_ids.push(agent.uid);
	agent.r_path = this;
	agent.properties.target = this.control_points[1];
	agent.last_cp_index = 1;

}

RespawningPath.prototype.deleteAgentFromPath = function( uid )
{
	
}

RespawningPath.prototype.checkPathSettings = function()
{
	if(this.agents_ids.length == this.density) return {status:this.IN_BOUNDARY};
	else if(this.agents_ids.length < this.density)
		return {status:this.UNDERPOPULATED};
}

RespawningPath.prototype.connectControlPoints = function( control_p1, control_p2 )
{
	var vertices_ = [];
	if(control_p1 && control_p2)
	{
		vertices_.push(control_p1[0], 0, control_p1[2]);
		vertices_.push(control_p2[0], 0, control_p2[2]);
	}

	var line_mesh = GL.Mesh.load({ vertices: vertices_ });
	var mesh_name = "control_point_line" + control_p2

    GFX.renderer.meshes[mesh_name] = line_mesh;
    var line_node = new RD.SceneNode();
    line_node.name = "path_line";
    line_node.flags.ignore_collisions = true;
    line_node.primitive = gl.LINES;
    line_node.mesh = mesh_name;
    line_node.color = [255/255, 170/255, 40/255, 0.5];
    //linea.flags.depth_test = true;
    //linea.render_priority = RD.PRIORITY_HUD;
    GFX.scene.root.addChild(line_node);

}



RespawningPath.prototype.updatePath = function(dt)
{
	this.interval += dt;
	if(this.interval < 1/(this.density*0.1)) return; //1/(this.density*0.1)
	
	this.interval = 0;
//	var evaluation = this.checkPathSettings();
//	if(evaluation.status ==  this.UNDERPOPULATED )
//	{
		this.addAgentToPath();
//	}
//
//	else if(evaluation.status ==  this.OVERPOPULATED )
//	{
//		this.deleteAgentFromPath();
//	}
//	else
//		return;
}