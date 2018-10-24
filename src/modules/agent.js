var AgentManager = {
    name : "AgentManager",
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
        CORE.GUI.menu.add("Agent/+ new Agent", () => new Agent() );
    },

    createGUIParams( agent ){
        
        if(!agent.dialog){
            var dialog = agent.dialog = new LiteGUI.Dialog( { id:"Settings", title:'Agent: '+ ((agent.properties && agent.properties.name)? agent.properties.name : agent.uid), close: true, minimize: false, width: 300, height: 500, scroll: false, resizable: false, draggable: true, parent:"body"});
            agent.dialog.setPosition(10,70);
            CORE.GUI.menu.add("Agent/" + ((agent.properties && agent.properties.name)? agent.properties.name : agent.uid), {callback: function() { 
                dialog.show('fade');             
                agent.dialog.setPosition(10,70);
            } });
            CORE.GUI.menu.remove("Agent/+ new Agent");
            CORE.GUI.menu.add("Agent/+ new Agent", () => new Agent() );
        }
        if(!agent.inspector){
            var inspector = agent.inspector = new LiteGUI.Inspector(),
                properties = agent.properties,
                dialog = agent.dialog,
                uid = agent.uid;
            inspector.on_refresh = function(){

                inspector.clear();
                    for(var p in properties){
                        let widget = null;
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
                                switch(properties[p].length){
                                    case 2:  widget = inspector.addVector2(p, properties[p], { key: p, callback: function(v){ properties[this.options.key] = v; } }); break;
                                    case 3:  widget = inspector.addVector3(p, properties[p], { key: p, callback: function(v){ properties[this.options.key] = v; } }); break;
                                    case 4:  widget = inspector.addVector4(p, properties[p], { key: p, callback: function(v){ properties[this.options.key] = v; } }); break;
                                }break;
                            default:    
                            debugger;   
                             console.warn( "parameter type from parameter "+p+" in agent "+ uid + " was not recognised");
                        }
                        if(!widget) continue;
                        widget.classList.add("draggable-item");
                        widget.addEventListener("dragstart", function(a){ a.dataTransfer.setData("text", a.srcElement.children[0].title); });
                        widget.setAttribute("draggable", true);

                    }
    
                    inspector.addSeparator();
                    inspector.widgets_per_row = 3;
    
                    var _k,_v;
                    inspector.addString(null, "",  { width:"45%", placeHolder:"param name...",  callback: v => _k = v });
                    inspector.addString(null, "",  { width:"45%", placeHolder:"value...",       callback: v => _v = v });
                    inspector.addButton(null, "+", { width:"10%", callback: e => {
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
                    agent.dialog.adjustSize();
            }

            agent.dialog.add(inspector);
            inspector.refresh();

            CORE.Player.renderStats();
        }

    }

    
}

CORE.registerModule( AgentManager );


class Agent{

    constructor( position ){

        this.uid = LS.generateUId('agent');
       

        this.btree = null;
        this.blackboard = blackboard;

        this.path = [{pos:[0,0,0],visited:false}, {pos: [-100,0,1400],visited:false}, {pos:[1400,0,1000],visited:false},{pos:[2000,0,800],visited:false},{pos:[2600,0,1400],visited:false}, {pos:[1800,0,1400],visited:false}, {pos:[1600,0,-800],visited:false}, {pos:[-1200,0,-1000],visited:false}, {pos:[-400,0,0],visited:false}];
        this.current_waypoint = this.path[0];

        var random = vec3.random(vec3.create(), 100);
        position = position || vec3.add(vec3.create(), vec3.create(), vec3.fromValues(random[0], 0, random[2]));
        
        this.properties = {
            age: 35,
            name: "Billy-" + guidGenerator(),
            ubrella: "closed",
            // position: position
            target: this.path[this.path.length-1].pos
            
        }

        this.skeleton = new Skeleton( LS.generateUId('skeleton'), "src/assets/Walking.dae", this.properties.position, false);
        this.animator = new Animator();
        this.animator.animations = animations; //toremove
        animators.push( this.animator );//toremove 

        //Store agents 
        AgentManager.agents[this.uid] = this;

        this.visualizePath();//whe should remove this
    }
    
    render(){
        // for(var c in this.components){
        //     if(!!this.components[c].render)
        //         this.components[c].render();
        // }

        //OR

        // if(skeleton)
        //     this.skeleton.drawSkeleton();
        
    }

    visualizePath()
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
        var total;
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

    moveTo(target, dt)
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

    orientCharacter( skeleton, target )
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

    inTarget( target, threshold)
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

    getNextWaypoint()
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

    restorePath()
    {
        // console.log("restoring path");
        for(var i in this.path)
            this.path[i].visited = false;
        // this.current_waypoint = this
    }

    changeColor()
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

}

//-------------------------------------------------------------------------------------------------------------------------------------


