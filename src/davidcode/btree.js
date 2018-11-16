NODETYPES = [
    1,//root
    2,//conditional
    3,//animator
]

function BehaviourTree()
{
  if(this.constructor !== BehaviourTree)
	 throw("You must use new to create a BehaviourTree");
	this._ctor();
}

BehaviourTree.prototype._ctor = function()
{
    this.node_pool = [];
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
    for(var i = 0; i< this.node_pool.length; i++)
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

BehaviourTree.prototype.addRootNode = function(id)
{
    let node = new Node();
    node.id = id;
    node.type = "root";
    node.boxcolor = "#fff";

    this.node_pool.push(node);
    return node;
}

/*********************************** DECORATOR NODES ***********************************/

BehaviourTree.prototype.addConditionalNode = function(id, options )
{
    let node = new Node();
    node.id = id;
    // node.boxcolor = "#fff";
    node.properties = options;
    node.title = node.properties.title;
    node.type = "conditional";
    node.tree = this.id;
    node.children = [];

    node.conditional_expression = function(agent)
    {
        var property = this.properties.property_to_compare.toLowerCase();
        //means that is boolean
        if(this.properties.limit_value == null)
        {
            if(agent.blackboard[property] != null)
            {
                if(agent.blackboard[property])
                    return true;
                else    
                    return false;
            }
            else if(agent.properties[property])
            {
                if(agent.properties[property])
                    return true;
                else    
                    return false;
            }
        }
        if(agent.blackboard[property] != null)
        {
            if(agent.blackboard[property] > this.properties.limit_value)
                return true;
            else    
                return false;
        }
        else if(agent.properties[property])
        {
            if(agent.properties[property] > this.properties.limit_value)
                return true;
            else    
                return false;
        }
    }

    node.tick = function(agent, options)
    {
        if(this.conditional_expression && !this.conditional_expression(agent))
            return false;
        else if(this.conditional_expression && this.conditional_expression(agent))
        {   
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

BehaviourTree.prototype.addBooleanConditionalNode = function(id, property_to_compare )
{
    let node = new Node();
    node.id = id;
    node.type = "bool_conditional";
    node.boxcolor = "#fff";
    node.tree = this.id;
    node.children = [];
    node.blackboard = blackboard;
    node.property_to_compare = property_to_compare;
    this.value = 0;
    // console.log(node);

    // node.addCondition = (function(condition){ this.conditional_expression = condition }).bind(node);
    node.conditional_expression = function(agent)
    {
        if(this.blackboard[this.property_to_compare] != null)
        {
            if(this.blackboard[this.property_to_compare])
                return true;
            else    
                return false;
        }
        else if(agent.properties[this.property_to_compare])
        {
            if(agent.properties[this.property_to_compare])
                return true;
            else    
                return false;
        }
    }

    node.tick = function(agent)
    {
        if(this.conditional_expression && !this.conditional_expression(agent))
            return false;
        if(this.conditional_expression && this.conditional_expression(agent))
            for(var n in this.children)
            {
                let child = this.children[n];
                var value2 = child.tick(agent);
                //Value debería ser success, fail, o running
                if(value2)
                    return value2;
            }
    }
    this.node_pool.push(node);
    return node;
}

BehaviourTree.prototype.addInTargetNode = function(id, options )
{
    let node = new Node();
    node.properties = options;
    node.id = id;
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
            return true;
        }
        else
            return false;

    }

    node.tick = function(agent)
    {
        if(this.isInTarget && this.isInTarget(agent))
        {
            agent.in_target = true;
            for(var n in this.children){
                let child = this.children[n];
                var value = child.tick(agent);
                //Value debería ser success, fail, o running
                //De momento true o false
                if(value)
                {
                    return value;
                }
            }
        }
        else
            return false;
    }
    this.node_pool.push(node);
    return node;
}

BehaviourTree.prototype.addSequencerNode = function( id )
{
    let node = new Node();
    node.id = id;
    node.type = "sequencer";
    node.boxcolor = "#fff";

    node.tick = function(agent, options)
    {
        for(var n in this.children)
        {
            let child = this.children[n];
            var value = child.tick(agent, options);
            if(n == this.children.length-1 && value)
                return value;
            //Value debería ser success, fail, o running
            if(!value)
            {
                // console.log("Sequence failed");
                return value;
            }
        }
    }
    this.node_pool.push(node);
    return node;
}

BehaviourTree.prototype.addFindNextTargetNode = function(id, options)
{
    let node = new Node();
    node.id = id;
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

    node.tick = function(agent, options)
    {
        if(this.findNextTarget && !this.findNextTarget(agent))
            return false;
        else
        {   
            // var nextTargetFound = this.findNextTarget(agent);
            // if(this.children.length == 0){
            //     console.log("No Children")
            //     return true;
            // }
            return true;
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
                return true;
            }
            for(var n in this.children)
            {
                let child = this.children[n];
                var value = child.tick(agent, n_agent);
                //Value debería ser success, fail, o running
                if(value)
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
BehaviourTree.prototype.addMoveToNode = function(id, options )
{
    let node = new Node();
    node.properties = options;
    node.id = id;
    node.type = "animation";
    // var target = node.properties.target;

    node.tick = function(agent)
    {
        // debugger;
        if(node.properties.target){
            agent.properties.target = node.properties.target;
            // console.log(agent);
            return true;
        }
        return false;
    }
    this.node_pool.push(node);
    return node;
}

BehaviourTree.prototype.addAnimationNode = function( id, options )
{
    let node = new Node();
    node.properties = options;
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

        return true;
    }

    node.tick = function(agent, options)
    {
        if(this.action)
            return this.action(agent);
    }
    this.node_pool.push(node);
    return node;
}
