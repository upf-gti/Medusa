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
            agent.dialog.setPosition(10,125);
            CORE.GUI.menu.add("Agent/" + ((agent.properties && agent.properties.name)? agent.properties.name : agent.uid), {callback: function() { 
                dialog.show('fade');             
                agent.dialog.setPosition(10,125);
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
                properties = agent.properties,
                inspector.clear();
                for(let p in properties){
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
                        var str = a.srcElement.children[1].children[0].children[0].classList.value;
                        var limit = 50;
                        if(str.includes("checkbox"))
                            limit = null;
                        var obj = {}
                        if(this.children[1].children[0].children[0].classList.contains('checkbox'))
                        {
                            obj = {name:a.srcElement.children[0].title, property_to_compare:a.srcElement.children[0].title, bool_state:true};
                            a.dataTransfer.setData("type", "bool");
                        } 
                        else
                            obj = {name:a.srcElement.children[0].title, property_to_compare:a.srcElement.children[0].title, limit_value:limit};
                        obj = JSON.stringify(obj);
                        a.dataTransfer.setData("obj", obj); 
                    });
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
            agent.dialog.adjustSize();
            agent.dialog.setPosition(10,125);
            agent.dialog.add(inspector);
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
        console.log(agents_to_save);
        return agents_to_save;
    }

    
}

CORE.registerModule( AgentManager );


class Agent{
    /* A parameter is passed if we want to load an agent */
    constructor( o ){

        if(o)
        {
            this.configure(o, this)
            return;
        }

        this.uid = LS.generateUId('agent');  

        this.btree = null;
        this.blackboard = blackboard;

        this.path = [{id:1,pos:[1300,0,0],visited:false},{id:2,pos: [0,0,1000],visited:false} ,{id:3,pos: [-1300,0,0],visited:false}];
        this.current_waypoint = this.path[0];

        // var random = vec3.random(vec3.create(), 100);
        //   position = position || vec3.add(vec3.create(), vec3.create(), vec3.fromValues(random[0], 0, random[2]));
        this.skeletal_animations = {};
        this.properties = {
            name: "Billy-" + guidGenerator(),
            age: 35,
            hurry: 25,
            money:20,
            hungry:false,
            umbrella: false,
            target: this.path[0], 
            look_at_pos: [1000,0,500]
        }

        this.skeleton = new Skeleton( LS.generateUId('skeleton'), "src/assets/Walking.dae", [0,0,0], false);
        this.animator = new Animator();
        var animation = animation_manager.animations["Walking"];
        var skeletal_animation = new SkeletalAnimation("Walking", animation);
        this.skeletal_animations["Walking"] = skeletal_animation; 
        this.animator.base_animation = skeletal_animation;
        this.animator.animations = animations; //toremove
        // this.head_node = this.getHeadNode(this.skeleton.name);
        // console.log(this.head_node);
        animators.push( this.animator );//toremove 

        //Store agents 
        AgentManager.agents[this.uid] = this;

        this.visualizePath();//whe should remove this

        LEvent.bind(this, "applyBehaviour", (function(e,p){
            this.animator.applyBehaviour(p);
        }).bind(this)); 

        LEvent.bind(this, "moveTo", (function(e,p){
            this.moveTo(p,global_dt);
        }).bind(this));
    }
    
    configure( o, agent )
    {
        agent.uid = o.uid;
        agent.btree = null;
        agent.blackboard = blackboard;
        agent.path = clearPath(o.path);
        agent.current_waypoint = agent.path[0];
        agent.properties = o.properties;
        agent.properties.target = agent.path[0];
        this.skeletal_animations = {};

        this.skeleton = new Skeleton( LS.generateUId('skeleton'), "src/assets/Walking.dae", [0,0,0], false);
        this.animator = new Animator();
        var animation = animation_manager.animations["Walking"];
        var skeletal_animation = new SkeletalAnimation("Walking", animation);
        this.skeletal_animations["Walking"] = skeletal_animation; 
        this.animator.base_animation = skeletal_animation;
        this.animator.animations = animations; //toremove
        animators.push( this.animator );//toremove 

        AgentManager.agents[agent.uid] = agent;

        agent.visualizePath();//whe should remove this

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
        var path = new LS.Path();
        path.closed = true;
        path.type = LS.Path.LINE;

        for(var i = 0; i <this.path.length; ++i)
        {
            var waypoint_pos = this.path[i];
            vertices.push(waypoint_pos.pos[0], waypoint_pos.pos[1], waypoint_pos.pos[2] );
            var node = new RD.SceneNode();
            node.mesh = "sphere";
            node.position = waypoint_pos.pos;
            node.color = [1,1,1,1];
            node.scaling = 4;
            node.render_priority = 1;
            GFX.scene.root.addChild(node);
        }

        var path_mesh = "path_mesh"
        var lines_mesh = GL.Mesh.load({ vertices: vertices });

        GFX.renderer.meshes[path_mesh] = lines_mesh;
        var linea = new RD.SceneNode();
        linea.name = "Path";
        linea.flags.ignore_collisions = true;
        linea.primitive = gl.LINE_STRIP;
        linea.mesh = path_mesh;
        linea.color = [1,1,1,1];
        linea.flags.depth_test = false;
        GFX.scene.root.addChild(linea);
    }

    moveTo(target, dt)
    {
        if(this.animator.motion_speed < 0.1)
            return;
        var motion_to_apply = this.animator.motion_speed * (dt/0.0169);
        this.orientCharacter(this.skeleton.skeleton_container, target.pos, dt);
        var direction = GFX.rotateVector(this.skeleton.skeleton_container.getGlobalMatrix(), [0,0,1]);
        direction = vec3.multiply(direction, direction, [this.animator.speed*motion_to_apply, this.animator.speed*motion_to_apply, this.animator.speed*motion_to_apply]);
        vec3.add(this.skeleton.skeleton_container.position, this.skeleton.skeleton_container.position, direction);
        this.skeleton.skeleton_container.updateMatrices();
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
            console.log("Rotating head");
            this.orientHead(this.head_node, target);
            // this.head_node.updateMatrices();
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
        quat.slerp(tmpQuat, tmpQuat, head.rotation, 0.15);
        head._rotation = tmpQuat;
        head.updateMatrices();
    }

    getHeadNode(name)
    {
        return GFX.scene._nodes_by_id[name + "/mixamorig_Head"]
    }
    inTarget( target, threshold)
    {
        var current_pos = []; 
        current_pos[0] = this.skeleton.skeleton_container.getGlobalPosition()[0];
        current_pos[1] = this.skeleton.skeleton_container.getGlobalPosition()[2];

        var a = vec2.fromValues(current_pos[0],current_pos[1]);
        var b = vec2.fromValues(target.pos[0],target.pos[2]);

        var dist = vec2.distance(a,b);
        // console.log("dist", dist);

        if(dist < threshold)
        {
            for(var i  in this.path)
                if(this.path[i].id == target.id)
                    this.path[i].visited = true;
            
            return true;
        } 
        return false;
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

    restorePath()
    {
        for(var i in this.path)
            this.path[i].visited = false;
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

    checkNextTarget()
    {
        for(var i in this.path)
        {
            if(!this.path[i].visited)
                return this.path[i];
        }
        return false;
    }

}

//-------------------------------------------------------------------------------------------------------------------------------------


