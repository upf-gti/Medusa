Skeleton.animations = {};
Skeleton.uid = 0;

function Skeleton(name, path, root_pos, only_animation)
{
  if(this.constructor !== Skeleton)
	 throw("You must use new to create Skeleton");
	this._ctor();
  if(root_pos)
    this.rootPos = root_pos;

	if(path)
		this.load( path, only_animation );
  if(name)
    this.name = name;

}
//Solo necesitamos saber el archivo
Skeleton.prototype._ctor = function()
{
  this.name = null;
  this.line_color = [0,1,1,1];
  this.line_node = null;
  this.path = null;
  this.anim = null;
  this.uid = Skeleton.uid++;
  this.scene = null;
  this.time = 0;
  this.vertices = [];
  this.root_bone = null;
  this.rootPos = [];
  this.lines_mesh = null;
  this.points_mesh = null;
  this.skeleton_container = null;
  this.animationsToMix = [];
}

Skeleton.prototype.load = function(path, only_animation)
{
  var that = this;
  Collada.load( path, function(scene){
      that.scene = scene;
      that.anim_name = path;
      that.onParsed(path, only_animation);
  } );
}

Skeleton.prototype.onParsed = function(path, only_animation)
{
  clearInterval(timer);
  // console.log(this.scene);

  for ( var i in this.scene.resources )
  {
    var animation = new LS.Animation();
    animation.configure( this.scene.resources[i] );

    var filename = path.substring(path.lastIndexOf('/')+1)
    animation.name = filename.substring(0,filename.lastIndexOf('.'))

    animation.takes["default"].optimizeTracks();
    animation.current_time = 0;
    animations.push(animation);
    //animator.animations.push(animation);
    current_animation = animation;
  }
  if(only_animation)
    return

  if(!this.scene)
    document.body.innerHTML = "Error, check console";
  else if(typeof(this.scene) == "string")
    document.body.innerHTML = "Error: " + this.scene;
  else
    this.drawSkeleton(this.scene);
}

Skeleton.prototype.drawSkeleton = function(skeleton)
{
  this.skeleton_container = new RD.SceneNode();
  if(this.rootPos)
    this.skeleton_container.position = this.rootPos;

  this.skeleton_container.name = "skeleton_" + this.uid + "_" + this.anim_name;
  GFX.scene.root.addChild(this.skeleton_container);

	rootBone = skeleton.root.children[0];

	this.root_bone = new RD.SceneNode();
	this.root_bone.fromMatrix( rootBone.model );
  this.root_bone.id = this.name + "/" + rootBone.name;
	this.root_bone.color = [1,0,0,1];
	// this.root_bone.mesh = "sphere";
	// this.root_bone.shader = "phong";
  this.root_bone.name = "ROOT";
	this.skeleton_container.addChild(this.root_bone);

	this.drawChildBones(rootBone, this.root_bone);
	this.addLines(this.vertices);
	this.addPoints(this.vertices);
}

Skeleton.prototype.drawChildBones = function( root, parentbone )
{
  if(root.children)
	{
		for(var i in root.children)
		{

				var parent_bone = parentbone.getGlobalPosition();
				this.vertices.push( parent_bone );

				var new_root_bone = root.children[i];

				//Graphics
        var bone = new RD.SceneNode();
        bone.fromMatrix( new_root_bone.model );
				bone.id = this.name + "/" + new_root_bone.name;
        bone.color = [1,1,0,1];
        //bone.mesh = "sphere";
				//bone.shader = "phong";
				parentbone.addChild(bone);

				var bonepos = bone.getGlobalPosition();
				this.vertices.push(  vec3.clone( bonepos ) );

				this.drawChildBones(new_root_bone, bone);
		}
	}
}
//Done every keyframe
Skeleton.prototype.updateLinesVertices = function( parentbone )
{
  if(parentbone.children)
	{
		for(var i in parentbone.children)
		{
				var parent_pos = parentbone.getGlobalPosition();
				this.vertices.push( parent_pos );

				var child = parentbone.children[i];
				var child_pos = child.getGlobalPosition();
				this.vertices.push( child_pos );

				this.updateLinesVertices( child );
		}
	}
}

Skeleton.prototype.addLines = function( points )
{
  var vertices_ = [];
  for(var i = 0; i < points.length; ++i)
    vertices_.push(points[i][0], points[i][1], points[i][2]);

  if(!this.lines_mesh){
    var skeleton_line_mesh = "line_" + this.uid;
    this.lines_mesh = GL.Mesh.load({ vertices: vertices_ });

    GFX.renderer.meshes[skeleton_line_mesh] = this.lines_mesh;
    this.line_node = new RD.SceneNode();
    this.line_node.name = "Lines";
    this.line_node.flags.ignore_collisions = true;
    this.line_node.primitive = gl.LINES;
    this.line_node.mesh = skeleton_line_mesh;
    this.line_node.color = this.line_color;
    //linea.flags.depth_test = true;
    //linea.render_priority = RD.PRIORITY_HUD;
    GFX.scene.root.addChild(this.line_node);
  }
  else{
    this.lines_mesh.getBuffer("vertices").data.set( vertices_ );
    this.lines_mesh.getBuffer("vertices").upload( GL.STREAM_DRAW );
    this.line_node.color = this.line_color;
  }
}

Skeleton.prototype.addPoints = function( points )
{
  var vertices_ = [];
  for(var i = 0; i < points.length; ++i)
    vertices_.push(points[i][0], points[i][1], points[i][2]);

  if(!this.points_mesh){
    var skeleton_points_mesh = "point_" + this.uid;
    this.points_mesh = GL.Mesh.load({ vertices: vertices_ });

    GFX.renderer.meshes[skeleton_points_mesh] = this.points_mesh;
    var points = new RD.SceneNode();
    points.name = "Lines";
    points.flags.ignore_collisions = true;
    points.primitive = gl.POINTS;
    points.mesh = skeleton_points_mesh;
    points.color = [1,1,0,1];
    points.shader = "point";

    //linea.flags.depth_test = true;
    //linea.render_priority = RD.PRIORITY_HUD;
    GFX.scene.root.addChild(points);
  }
  else
  {
    this.points_mesh.getBuffer("vertices").data.set( vertices_ );
    this.points_mesh.getBuffer("vertices").upload( GL.STREAM_DRAW );
  }
}
