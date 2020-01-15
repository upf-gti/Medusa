var AreaManager =  {
    areas: [],
    addArea(params) {
        
    },
    removeArea(area)
    {}
}

function PoligonalArea( name )
{
    if(this.constructor !== PoligonalArea)
        throw("You must use new to create an PoligonalArea");
    
    this.id = "Area_"+(Math.floor(Math.random()*100))
    this.points = [];
    this.vertices = [];
    this.triangulation = [];
    this.mesh = null;
    this.node = new RD.SceneNode();
    this.color = [0.5 + Math.random()*0.5, 0.5 + Math.random()*0.5, 0.5 + Math.random()*0.5, 0.3];
    this.name = name || "Default";
    this.properties = {};

}

PoligonalArea.prototype.fromvertices = function (  )
{
    // debugger;
    this.vertices = this.toVerticesArray(this.points);
    var vertices2D = this.toVertices2D(this.vertices);
    this.triangulation = earcut(vertices2D);
    this.mesh = GL.Mesh.load( { vertices: this.vertices, triangles: this.triangulation } );
    GFX.renderer.meshes[this.name] = this.mesh;
    this.node.mesh = this.name;
    this.node.blend_mode = RD.BLEND_ALPHA;
    this.node.color = this.color;
}

PoligonalArea.prototype.toVerticesArray = function ( points )
{
    var vertices = [];
    for(var i in points)
    {
        vertices.push(points[i][0]);
        vertices.push(points[i][1]+0.5);
        vertices.push(points[i][2]);
    }
    return vertices;
}

PoligonalArea.prototype.toVertices2D = function( vertices3D ) 
{
    var vertices2D = [];
    for(var i = 0; i < vertices3D.length; i += 3 )
    {
        vertices2D.push(vertices3D[i]);
        vertices2D.push(vertices3D[i+2]);
    }
    return vertices2D;
}

PoligonalArea.prototype.toVertices3D = function( vertices2D ) 
{
    var vertices3D = [];
    for(var i = 0; i<vertices2D.length; i+=2)
    {
        vertices3D.push(vertices2D[i]);
        vertices3D.push(0);
        vertices3D.push(vertices2D[i+1]);
    }   
    return vertices3D;
}

PoligonalArea.prototype.addVertex = function(point)
{
    this.points.push(point);
    var color = this.color;// [255/255, 170/255, 40/255, 0.75]
	var node = new RD.SceneNode();
	node.id = 200 + Math.floor(Math.random()*100);
	node.color = color;
	node.shader = "phong_shadow";
	node.mesh = "sphere";
	node.blend_mode = RD.BLEND_ALPHA;
	node.position = [point[0],1,point[2]];
	node.scale(5,5,5);
    node.render_priority = RD.PRIORITY_ALPHA;
    GFX.scene.root.addChild(node);
}