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
            if (index !== -1) {
                this.node_pool.splice(index, 1);
            }
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
        if (index !== -1) {
            parent_node.children.splice(index, 1);
        }
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
    // node.properties = {};
    node.id = id;
    // node.boxcolor = "#fff";

    node.title = options.title;
    node.property_to_compare = options.property_to_compare;
    node.limit_value = options.limit_value;
    node.type = "conditional";
    node.tree = this.id;
    node.children = [];
    // node.blackboard = blackboard;
    // node.properties.id = id;
    // this.value = 0;
    // console.log(node);

    // node.addCondition = (function(condition){ this.conditional_expression = condition }).bind(node);
    node.conditional_expression = function(agent)
    {
        // console.log("AGENT", agent);
        var property = this.property_to_compare.toLowerCase();

        if(agent.blackboard[property] != null)
        {
            // console.log("Agent", agent);
            // console.log("Param", agent.blackboard[property]);

            if(agent.blackboard[property] > this.limit_value)
                return true;
            else    
                return false;
        }
        else if(agent.properties[property])
        {
            if(agent.properties[property] > this.limit_value)
                return true;
            else    
                return false;
        }
    }

    node.tick = function(agent)
    {
        if(this.conditional_expression && !this.conditional_expression(agent))
            return false;
        else if(this.conditional_expression && this.conditional_expression(agent))
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
    node.id = id;
    node.type = "intarget";
    this.value = 0;
    if(options)
    {
        console.log(options);
        node.threshold = options.threshold;
    }
    node.children = [];

    node.isInTarget = function(agent)
    {
        // var state = agent.state;
        // debugger;
        if(agent.inTarget(agent.properties.target, this.threshold))
        {
            agent.in_target = true;
            // console.log("In target!");
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
            return true;
        }
        else
            return false;

    }

    node.tick = function(agent)
    {
        if(this.isInTarget && this.isInTarget(agent))
        {
            // console.log("Agent in target");
            return true;
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
    node.type = "sequencer";
    this.value = 0;
    node.threshold = threshold;

    node.tick = function(agent)
    {
        for(var n in this.children)
        {
            let child = this.children[n];
            var value = child.tick();
            if(n == this.children.length && value)
                return value;
            //Value debería ser success, fail, o running
            if(!value)
            {
                console.log("Sequence failed");
                return value;
            }
        }
    }
    this.node_pool.push(node);
    return node;
}

/*********************************** LEAF NODES ***********************************/

BehaviourTree.prototype.addAnimationNode = function(id, options )
{
    let node = new Node();
    node.id = id;
    node.type = "animation";
    node.anims = options.anims;
    node.params = {};
    node.params.speed = options.speed;
    node.params.motion = options.motion;
    
    node.action = function(agent)
    {
        var behaviour = {};
        // console.log("AGENT", agent);
        // console.log(anims);
        behaviour.animations_to_merge = this.anims;
        behaviour.params = this.params;
        behaviour.type = "mixing";
        behaviour.author = "manuel";
        // console.log("Action", behaviour.animations_to_merge);
        LEvent.trigger( agent, "applyBehaviour", behaviour);

        return true;
    }

    node.tick = function(agent)
    {


        if(this.action)
            return this.action(agent);
    }
    this.node_pool.push(node);
    return node;
}
