function Character(name, skeleton, animator)
{
    if(this.constructor !== Character)
        throw("You must use new to create Character");
    this._ctor();

    if(name)
        this.name = name;
    if(skeleton)
        this.skeleton = skeleton;
    if(animator)
    {
        this.animator = animator;
        LEvent.bind(this, "applyBehaviour", (function(e,p){
            this.animator.applyBehaviour(p);
        }).bind(this)         // LEvent.bind(this, "applyBehaviour", function(){console.log("WAAAH")});
    );

    }



}
//Solo necesitamos saber el archivo
Character.prototype._ctor = function()
{
    this.name = null;
    this.skeleton = null;
    this.animator = null;
    this.btree = null;
    this.blackboard = blackboard;
    //vector de vec3: [[0,0,0], [10,0,0], ...]
    //   this.path = [{pos:[0,0,0],visited:false}, [300,0,-100], [700,0,-200], [800,0,0], [700,0,300], [300,0,400],  [0,0,300]];
    this.path = [{pos:[0,0,0],visited:false}, {pos: [-100,0,1400],visited:false}, 
    {pos:[1400,0,1000],visited:false},{pos:[2000,0,800],visited:false},{pos:[2600,0,1400],visited:false}, 
    {pos:[1800,0,1400],visited:false}, {pos:[1600,0,-800],visited:false}, {pos:[-1200,0,-1000],visited:false}, {pos:[-400,0,0],visited:false}];
    this.state = {age:20, target: this.path[1].pos, in_target:false, position:null, has_umbrella:false, has_smartphone:false, attitude:50};
    this.target = this.path[this.path.length-1].pos;
    this.in_target = false;
    this.current_waypoint = this.path[0];

    this.tmp_vec = vec3.create();

    this.visualizePath();

}

var tmp = {
    vec : vec3.create(),
    axis : vec3.create(),
    axis2 : vec3.create(),
    inv_mat : mat4.create()
}

Character.prototype.visualizePath = function()
{
    var vertices = [];
    var path = new LS.Path();
    path.closed = true;
    path.type = LS.Path.LINE;

    for(var i = 0; i <this.path.length; ++i)
    {
        var waypoint_pos = this.path[i];
        path.addPoint(waypoint_pos.pos);
        vertices.push(waypoint_pos.pos[0], waypoint_pos.pos[1], waypoint_pos.pos[2] );
        var node = new RD.SceneNode();
        node.mesh = "sphere";
        node.position = waypoint_pos.pos;
        node.color = [1,1,1,1];
        node.scaling = 4;
        node.render_priority = 1;
        GFX.scene.root.addChild(node);
    }

    path._max_points = 10000;
    path._mesh = path._mesh || GL.Mesh.load( { vertices: new Float32Array( path._max_points * 3 ) } );
    var vertices_buffer = path._mesh.getVertexBuffer("vertices");
    var vertices_data = vertices_buffer.data;
    if(path.type == LS.Path.LINE)
        total = path.getSegments() + 1;
    else
        total = path.getSegments() * 120; //10 points per segment
    if(total > path._max_points)
        total = path._max_points;
    path.samplePointsTyped( total, vertices_data );
    vertices_buffer.upload( gl.STREAM_TYPE );
    
    GFX.renderer.meshes["path"] = path._mesh;
	path._range = total;

    var waypoint_pos_ = this.path[0];
    vertices.push(waypoint_pos_.pos[0], waypoint_pos_.pos[1], waypoint_pos_.pos[2] );
    // console.log(vertices);
    var path_line_mesh = "line_path";
    //var lines_mesh = GL.Mesh.load({ vertices: vertices });

    //GFX.renderer.meshes[path_line_mesh] = lines_mesh;
    var linea = new RD.SceneNode();
    linea.name = "Path";
    linea.flags.ignore_collisions = true;
    linea.primitive = gl.LINE_STRIP;
    linea.mesh = "path";
    linea.color = [1,1,1,1];
    linea.flags.depth_test = false;
    //linea.render_priority = RD.PRIORITY_HUD;
    GFX.scene.root.addChild(linea);
}

Character.prototype.moveTo = function(target, dt)
{
    if(this.animator.motion_speed < 0.1)
        return;
    var motion_to_apply = this.animator.motion_speed * (dt/0.0169);
    this.orientCharacter(this.skeleton.skeleton_container, target);
    var direction = GFX.rotateVector(this.skeleton.skeleton_container.getGlobalMatrix(), [0,0,1]);
    direction = vec3.multiply(direction, direction, [this.animator.speed*motion_to_apply, this.animator.speed*motion_to_apply, this.animator.speed*motion_to_apply]);
    vec3.add(this.skeleton.skeleton_container.position, this.skeleton.skeleton_container.position, direction);
    this.skeleton.skeleton_container.updateMatrices();
}

// Character.prototype.orientCharacter1 = function( skeleton, target )
// {
//     console.log(skeleton.position);
//     var vect = vec3.create();
//     vect = vec3.subtract( vect, skeleton.getGlobalPosition(), target );
//     vect = vec3.normalize( vect, vect );
//     var front = GFX.rotateVector(skeleton._global_matrix, RD.BACK)
//     var dot = vec3.dot( front, vect )
//     Math.clamp(dot, -0.999, 0.999);
    
//     var degree = Math.acos(dot);

//     var axis = vec3.create();
//     axis = vec3.cross(axis, vect, front);
//     var inverse_mat = mat4.create();
//     inverse_mat = mat4.invert(inverse_mat, skeleton._global_matrix);
//     axis = GFX.rotateVector(inverse_mat, axis);
//      //rotate de gl-matrix es el rotateLocal
//     var result_mat = mat4.create();
//     result_mat = mat4.rotate(result_mat, skeleton._global_matrix, 0.02, [0,axis[1],0] );
//     skeleton.fromMatrix(result_mat);
// }

//No funciona, en alguna iteración, el vec3.create, el mat4.create() etc me retornan null y NaN. 
Character.prototype.orientCharacter = function( skeleton, target )
{
    // this.tmp_vec = vec3.create();
    tmp.vec = vec3.subtract( tmp.vec, skeleton.getGlobalPosition(), target );
    tmp.vec = vec3.normalize( tmp.vec, tmp.vec );
    var front = GFX.rotateVector(skeleton._global_matrix, RD.BACK);
    var dot = vec3.dot( front, tmp.vec );
    Math.clamp(dot, -0.999, 0.999);
    
    var degree = Math.acos(dot);
    
    tmp.axis = vec3.cross(tmp.axis, tmp.vec, front);
    vec3.normalize(tmp.axis, tmp.axis);
    // console.log(tmp.axis);
    
    // var mat = mat4.clone( skeleton._global_matrix );    
    // tmp.inv_mat = mat4.invert(tmp.inv_mat, mat);
    // if(tmp.inv_mat == null){
    //     throw("Matrix affected");
    // }
    // tmp.axis2 = GFX.rotateVector(tmp.inv_mat, tmp.axis);

     //rotate de gl-matrix es el rotateLocal
    skeleton.rotate( 0.02, tmp.axis );
    // skeleton.rotate( 0.02, [0,tmp.axis[1],0] )
    // console.log("Despues de asignar fromMatrix", skeleton.getGlobalMatrix());
}

Character.prototype.inTarget = function( target, threshold)
{
    var current_pos = []; 
    current_pos[0] = this.skeleton.skeleton_container.getGlobalPosition()[0];
    current_pos[1] = this.skeleton.skeleton_container.getGlobalPosition()[2];

    var a = vec2.fromValues(current_pos[0],current_pos[1]);
    var b = vec2.fromValues(target[0],target[2]);

    var dist = vec2.distance(a,b);
    // console.log("dist", dist);

    if(dist < threshold)
        return true;
    
    return false;
}

Character.prototype.getNextWaypoint = function()
{
    for(var i in this.path)
    {
        if(this.path[i].visited == false)
        {
            this.current_waypoint = this.path[i];
            // if(i == this.path.length -1)
            //     this.restorePath();
            return this.path[i].pos;
        }

    }
}

Character.prototype.restorePath = function()
{
    // console.log("restoring path");
    for(var i in this.path)
        this.path[i].visited = false;
    // this.current_waypoint = this
}

Character.prototype.changeColor = function()
{
    // debugger;
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