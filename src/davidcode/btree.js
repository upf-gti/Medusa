NODETYPES = [
    1,//root
    2,//conditional
    3,//animator
]

var STATUS = 
{
    success:0,
    running:1, 
    fail:2
}

function BehaviourTree()
{
  if(this.constructor !== BehaviourTree)
	 throw("You must use new to create a BehaviourTree");
	this._ctor();
}

BehaviourTree.prototype._ctor = function()
{
    this.node_pool = [];
    this.time = 0;
    this.last_time = 0;
    this.fixed_node = null;
}

BehaviourTree.prototype.getNodeById = function(id)
{
    for(var i = 0; i < this.node_pool.length; i++)
    {
        if(this.node_pool[i].id == id)
            return this.node_pool[i];
    }
}

BehaviourTree.prototype.deleteNodeFromPool = function(id)
{
    for(var i = 0; i < this.node_pool.length; i++)
    {
        if(this.node_pool[i].id == id)
        {
            var node = this.getNodeById(id);
            var index = this.node_pool.indexOf(node);
            if (index !== -1) 
                this.node_pool.splice(index, 1);
        }
    }
}

BehaviourTree.prototype.deleteNode = function(node_id, parent_id)
{
    var parent_node = this.getNodeById(parent_id);
    var node = this.getNodeById(node_id);
    if(parent_node)
    {
        var index = parent_node.children.indexOf(node);
        if (index !== -1) 
            parent_node.children.splice(index, 1);
        
    }
    if(node.children)
    {
        for(var j in node.children)
        {
            var child_node = node.children[j];
            child_node.parent = null;
        }
    }
    this.deleteNodeFromPool(node_id);
    
}
BehaviourTree.prototype.run = function( character, scene )
{
    this.character = character;
    this.scene = scene;
    this.rootnode.tick();
}  

BehaviourTree.prototype.updateNodeInfo = function(id, options)
{
    var node = this.getNodeById(id);
    node.properties = options;
}

BehaviourTree.prototype.addRootNode = function(id, options, g_node)
{
    let node = new Node();
    node.id = id;
    node.properties = options;
    node.g_node = g_node;
    node.type = "root";

    node.tick = function(agent, dt){
        for(var n in this.children){
            var child = this.children[n];
            var value = child.tick(agent, dt);
            //Value debería ser success, fail, o running
            if(value == STATUS.success){
                if(agent.is_selected)
                {
                    var g_child = child.g_node;
                    var chlid_input_link_id = g_child.inputs[0].link;
                    this.g_node.triggerSlot(0, null, chlid_input_link_id);

                    if(child.description)
                    {
                        var graph = child.g_node.graph;
                        graph.description_stack.push(child.description); 
                    } 
                }
                return value;
            }
        }
        // console.log("Ninguna rama ha tenido exito");
        return STATUS.fail; //placeholder ta que lo pensemos bien
    }
    this.node_pool.push(node);
    return node;
}

/*********************************** DECORATOR NODES ***********************************/

BehaviourTree.prototype.addConditionalNode = function(id, options, g_node )
{
    let node = new Node();
    node.id = id;
    // node.boxcolor = "#fff";
    node.properties = options;
    node.g_node = g_node;
    node.title = node.properties.title;
    node.type = "conditional";
    node.tree = this.id;
    node.children = [];

    node.conditional_expression = function(agent)
    {
        var property = this.properties.property_to_compare.toLowerCase();
        //means that is boolean
        if(this.properties.value_to_compare)
        {
            //comprobar el tipo de comparativa ( <, >, ==)
            if(this.properties.value_to_compare > this.properties.limit_value )
                return true;
            return false;
        }
        if(agent.blackboard[property] != null)
        {
            //comprobar el tipo de comparativa ( <, >, ==)

            if(agent.blackboard[property] > this.properties.limit_value)
                return true;
            else    
                return false;
        }
        else if(agent.properties[property])
        {
            //comprobar el tipo de comparativa ( <, >, ==)
            if(agent.properties[property] > this.properties.limit_value)
                return true;
            else    
                return false;
        }
    }

    node.tick = function(agent, dt)
    {
        if(this.conditional_expression && !this.conditional_expression(agent))
            return STATUS.fail;
        else if(this.conditional_expression && this.conditional_expression(agent))
        {               
            this.description = this.properties.property_to_compare + ' property passes the threshold';

            if(this.children.length == 0){
                console.log("No Children")
                return STATUS.success;
            }
            for(let n in this.children)
            {
                var child = this.children[n];
                var value = child.tick(agent, dt);
                //Value debería ser success, fail, o running
                if(value == STATUS.success)
                {
                    if(agent.is_selected)
                    {
                        // console.log(agent);
                        var g_child = child.g_node;
                        var chlid_input_link_id = g_child.inputs[0].link;
                        this.g_node.triggerSlot(0, null, chlid_input_link_id);

                        if(child.description)
                        {
                            var graph = child.g_node.graph;
                            graph.description_stack.push(child.description); 
                        } 
                    }
                    return value;
                }
            }
            return STATUS.fail;
        }
    }
    this.node_pool.push(node);
    return node;
}

BehaviourTree.prototype.addBoolConditionalNode = function(id, options, g_node)
{
    let node = new Node();
    node.id = id;
    // node.boxcolor = "#fff";
    node.properties = options;
    node.g_node = g_node;
    node.title = node.properties.title;
    node.type = "conditional";
    node.tree = this.id;
    node.children = [];

    node.conditional_expression = function(agent)
    {
        var property = this.properties.property_to_compare.toLowerCase();
        //means that is boolean
        if(this.properties.value_to_compare)
        {
            //si me entra externamente un valor y es igual al estado booleano (me entra falso y quiero que siga ese path si es falso)
            if(this.properties.value_to_compare == this.properties.bool_state)
                return true;
            return false;
        }
        if(agent.blackboard[property] != null)
        {
            if(agent.blackboard[property] == this.properties.bool_state)
                return true;
            else    
                return false;
        }
        else if(agent.properties[property] != null)
        {
            if(agent.properties[property] == this.properties.bool_state)
                return true;
            else    
                return false;
        }
    }

    node.tick = function(agent, dt)
    {
        if(this.conditional_expression && !this.conditional_expression(agent))
            return STATUS.fail;
        else if(this.conditional_expression && this.conditional_expression(agent))
        {   
            this.description = this.properties.property_to_compare + ' property is true';
            if(this.children.length == 0){
                console.log("No Children")
                return STATUS.success;
            }
            for(var n in this.children)
            {
                let child = this.children[n];

                var value = child.tick(agent, dt);
                //Value debería ser success, fail, o running
                if(value == STATUS.success)
                {
                    if(agent.is_selected)
                    {
                        var g_child = child.g_node;
                        var chlid_input_link_id = g_child.inputs[0].link;
                        this.g_node.triggerSlot(0, null, chlid_input_link_id);

                        if(child.description)
                        {
                            var graph = child.g_node.graph;
                            graph.description_stack.push(child.description); 
                        }
                    }
                    return value;
                }
            }
            return STATUS.fail;
        }
    }
    this.node_pool.push(node);
    return node;
}

BehaviourTree.prototype.addInTargetNode = function(id, options, g_node )
{
    let node = new Node();
    node.id = id;
    node.properties = options;
    node.g_node = g_node;
    node.type = "intarget";
    this.value = 0;
    if(options)
    {
        node.threshold = node.properties.threshold;
    }
    node.children = [];

    node.isInTarget = function(agent)
    {
        if(agent.inTarget(agent.properties.target, this.threshold))
        {
            // console.log("Intarget");
            // check if the target is in some special list and  some properties to apply to
            // the agent or to the blackboard
            CORE.Scene.applyTargetProperties(agent.properties.target, agent);
            return true;
        }
        else
            return false;

    }

    node.tick = function(agent, dt)
    {
        if(this.isInTarget && this.isInTarget(agent))
        {
            this.description = 'Agent in target';
            agent.in_target = true;
            for(var n in this.children){
                let child = this.children[n];
                var value = child.tick(agent, dt);

                if(value == STATUS.success)
                {
                    if(agent.is_selected)
                    {
                        var g_child = child.g_node;
                        var chlid_input_link_id = g_child.inputs[0].link;
                        this.g_node.triggerSlot(0, null, chlid_input_link_id);
                        
                        if(child.description)
                        {
                            var graph = child.g_node.graph;
                            graph.description_stack.push(child.description); 
                        }
                    }
                    return value;
                }
            }
        }
        else
            return STATUS.fail;
    }
    this.node_pool.push(node);
    return node;
}

BehaviourTree.prototype.addSequencerNode = function( id, options, g_node )
{
    let node = new Node();
    node.id = id;
    node.properties = options;
    node.g_node = g_node;
    node.type = "sequencer";
    node.boxcolor = "#fff";

    node.tick = function(agent, dt)
    {
        if(this.executing_child_index != null)
        {
            let child = this.children[this.executing_child_index];
            var value = child.tick(agent, dt);
            if(value == STATUS.running)
            {
               if(agent.is_selected)
               {
                   var g_child = child.g_node;
                   var chlid_input_link_id = g_child.inputs[0].link;
                   this.g_node.triggerSlot(0, null, chlid_input_link_id);

                   if(child.description)
                   {
                       var graph = child.g_node.graph;
                       graph.description_stack.push(child.description); 
                   }
               }
                return STATUS.success;
            }
            if(value == STATUS.success )
            {
                this.executing_child_index += 1;
                if(agent.is_selected)
                {
                    console.log(agent);
                    var g_child = child.g_node;
                    var chlid_input_link_id = g_child.inputs[0].link;
                    this.g_node.triggerSlot(0, null, chlid_input_link_id);

                    if(child.description)
                    {
                        var graph = child.g_node.graph;
                        graph.description_stack.push(child.description); 
                    }
                }
            }
            if(this.executing_child_index == this.children.length && value == STATUS.success)
            {
                this.executing_child_index = null;
                return STATUS.success;
            }
            //Value debería ser success, fail, o running
            if(value == STATUS.fail)
                return value;
        }
        else
        {

            for(var n in this.children)
            {
                let child = this.children[n];
                var value = child.tick(agent, dt);
                if(value == STATUS.running)
                {
                    this.executing_child_index = parseInt(n);
                    if(agent.is_selected)
                    {
                        var g_child = child.g_node;
                        var chlid_input_link_id = g_child.inputs[0].link;
                        this.g_node.triggerSlot(0, null, chlid_input_link_id);
                        
                        if(child.description)
                        {
                            var graph = child.g_node.graph;
                            graph.description_stack.push(child.description); 
                        }
                    }
                    return STATUS.success;
                }
                if(value == STATUS.success)
                {
                    if(agent.is_selected)
                    {
                        var g_child = child.g_node;
                        var chlid_input_link_id = g_child.inputs[0].link;
                        this.g_node.triggerSlot(0, null, chlid_input_link_id);

                        if(child.description)
                        {
                            var graph = child.g_node.graph;
                            graph.description_stack.push(child.description); 
                        }
                    }
                }
                if(n == this.children.length-1 && value == STATUS.success && this.executing_child_index == null)
                    return STATUS.success;
                //Value debería ser success, fail, o running
                if(value == STATUS.fail)
                    return value;
            }
        }
    }
    this.node_pool.push(node);
    return node;
}

BehaviourTree.prototype.addSelectorNode = function(id, options, g_node)
{
    let node = new Node();
    node.id = id;
    node.properties = options;
    node.g_node = g_node;
    node.type = "root";

    node.tick = function(agent, dt){
        for(var n in this.children){
            var child = this.children[n];
            var value = child.tick(agent, dt);
            //Value debería ser success, fail, o running
            if(value == STATUS.success){
                if(agent.is_selected)
                {
                    var g_child = child.g_node;
                    var chlid_input_link_id = g_child.inputs[0].link;
                    this.g_node.triggerSlot(0, null, chlid_input_link_id);

                    if(child.description)
                    {
                        var graph = child.g_node.graph;
                        graph.description_stack.push(child.description); 
                    }
                }
                return value;
            }
        }
        // console.log("Ninguna rama ha tenido exito");
        return STATUS.fail; //placeholder ta que lo pensemos bien
    }
    this.node_pool.push(node);
    return node;
}

BehaviourTree.prototype.addFindNextTargetNode = function(id, options, g_node)
{
    let node = new Node();
    node.id = id;
    node.properties = options;
    node.g_node = g_node;
    node.type = "next_target";
    
    node.findNextTarget = function(agent)
    {
        //find nearest agent
        if(agent.checkNextTarget())
        {
            agent.properties.target = agent.checkNextTarget();
            agent.in_target = false;
            return true;  
        }
        return false;
    }

    node.tick = function(agent, dt)
    {
        if(this.findNextTarget && !this.findNextTarget(agent))
            return STATUS.fail;
        else
        {   
            this.description = ' Next waypoint of the path found';

            // var g_child = child.g_node;
            // var chlid_input_link_id = g_child.inputs[0].link;
            // this.g_node.triggerSlot(0, null, chlid_input_link_id);
            return STATUS.success;
        }
    }
    this.node_pool.push(node);
    return node;
}

BehaviourTree.prototype.addEQSNearestAgentNode = function(id, options)
{
    let node = new Node();
    node.properties = options;
    node.id = id;
    node.type = "animation";
    node.target = node.properties.target;
    
    node.query = function(agent)
    {
        //find nearest agent
        return nearest_agent;
    }

    node.tick = function(agent, options)
    {
        if(this.query && !this.query(agent))
            return false;
        else
        {   
            var n_agent = this.query(agent);
            if(this.children.length == 0){
                console.log("No Children")
                return STATUS.success;
            }
            for(var n in this.children)
            {
                let child = this.children[n];
                var value = child.tick(agent, n_agent);
                //Value debería ser success, fail, o running
                if(value == STATUS.success)
                    return value;
            }
        }
    }
    this.node_pool.push(node);
    return node;
}
BehaviourTree.prototype.addEQSNearestInterestPointNode = function(id, options)
{
    let node = new Node();
    node.properties = options;
    
    node.id = id;
    node.type = "animation";
    node.target = node.properties.target
    node.properties.list = CORE.Scene.properties.interest_points;
    node.list = node.properties.list;
    
    node.query = function(agent)
    {
        //find nearest IP
        return this.list[0];
    }

    node.tick = function(agent, options)
    {
        if(this.query && !this.query(agent))
            return false;
        else
        {   
            var n_agent_pos = this.query(agent);
            if(this.children.length == 0){
                console.log("No Children")
                return true;
            }
            for(var n in this.children)
            {
                let child = this.children[n];
                var value = child.tick(agent, n_agent_pos);
                //Value debería ser success, fail, o running
                if(value)
                    return value;
            }
        }
    }
    this.node_pool.push(node);
    return node;
}
BehaviourTree.prototype.addEQSDistanceToNode = function(id, options)
{
    let node = new Node();
    node.properties = options;
    node.id = id;
    node.type = "distanceTo";
    node.target = node.properties.pos;
    
    node.distance_to = function(agent, pos)
    {
        //conmpute distance from agent.pos to target
        return 50;
    }

    node.tick = function(agent, options)
    {
        if(this.distance_to && !this.query(agent))
            return false;
        else
        {   
            var dist = this.distance_to(agent, this.target);
            //pasar esta dist por el output para que llegue al nodo conectado
            
            if(this.children.length == 0){
                console.log("No Children")
                return true;
            }
            for(var n in this.children)
            {
                let child = this.children[n];
                var value = child.tick(agent);
                //Value debería ser success, fail, o running
                if(value)
                    return value;
            }
        }
    }
    this.node_pool.push(node);
    return node;
}

/*********************************** LEAF NODES ***********************************/
BehaviourTree.prototype.addMoveToNode = function(id, options, g_node )
{
    let node = new Node();
    node.properties = options;
    node.g_node = g_node;
    node.id = id;
    node.type = "animation";
    // var target = node.properties.target;

    node.tick = function(agent, dt)
    {
        // debugger;
        if(this.properties.target){
            agent.properties.target = this.properties.target;
            this.description = 'Target updated: New destination set to the input';

            // console.log(agent);
            return STATUS.success;
        }
        return STATUS.fail;
    }
    this.node_pool.push(node);
    return node;
}

BehaviourTree.prototype.addWaitNode = function(id, options, g_node )
{
    let node = new Node();
    node.properties = options;
    node.properties.current_time = 0;
    node.g_node = g_node;
    node.id = id;
    node.type = "wait";
    // var target = node.properties.target;

    node.tick = function(agent, dt)
    {
        // debugger;
        this.description = 'Waiting ' + this.properties.total_time + ' seconds ';
        if(this.properties.current_time > this.properties.total_time){
            this.properties.current_time = 0;
            // console.log(agent);
            return STATUS.success;
        }
        else
        {
            this.properties.current_time += dt;
            return STATUS.running;
        }
    }
    this.node_pool.push(node);
    return node;
}

BehaviourTree.prototype.addAnimationNode = function( id, options, g_node )
{
    let node = new Node();
    node.properties = options;
    node.g_node = g_node;
    node.id = id;
    node.type = "animation";
    node.anims = node.properties.anims;
    node.params = {};
    node.params.speed = node.properties.speed;
    node.params.motion = node.properties.motion;
    node.type = node.properties.type;
    
    node.action = function(agent)
    {
        var behaviour = {};
        // console.log("AGENT", agent);
        // console.log(anims);
        behaviour.animations_to_merge = this.anims;
        behaviour.params = this.params;
        behaviour.type = this.type;
        behaviour.type2 = "mixing";
        behaviour.author = "manuel";
        // console.log("Action", behaviour.animations_to_merge);
        LEvent.trigger( agent, "applyBehaviour", behaviour);

        return STATUS.success;
    }

    node.tick = function(agent, dt)
    {
        if(this.action)
        {
            this.description = 'Playing ' + this.anims[0].anim;
            return this.action(agent);
        }
    }
    this.node_pool.push(node);
    return node;
}

BehaviourTree.prototype.addLooKAtNode = function( id, options, g_node)
{
    let node = new Node();
    node.properties = options;
    node.g_node = g_node;
    node.id = id;
    node.type = "animation";
    // var target = node.properties.target;

    node.tick = function(agent, dt)
    {
        // debugger;
        if(this.properties.look_at_pos){
            agent.properties.look_at_pos = this.properties.look_at_pos;
            this.description = 'Look At updated: New look at position set to the input';

            return STATUS.success;
        }
        return STATUS.fail;
    }
    this.node_pool.push(node);
    return node;
}
