NODETYPES = [
    1,//root
    2,//conditional
    3,//animator
]

function BehaviourTree(editor)
{
  if(this.constructor !== BehaviourTree)
	 throw("You must use new to create a BehaviourTree");
	this._ctor(editor);
}

BehaviourTree.prototype._ctor = function(editor)
{
    this.node_pool = [];
    this.rootnode = this.addRootNode();
    this.btree_editor = editor;
}

BehaviourTree.prototype.getNodeById = function(id)
{
    for(var i = 0; i < this.node_pool.length; i++)
    {
        if(this.node_pool[i].id == id)
            return this.node_pool[i];
    }
}
BehaviourTree.prototype.run = function( character, scene )
{
    this.character = character;
    this.scene = scene;
    this.rootnode.tick();
}  

BehaviourTree.prototype.addRootNode = function()
{
    let node = new Node();
    node.id = 2;
    node.type = "root";
    node.boxcolor = "#fff";

    this.node_pool.push(node);
    return node;
}

/*********************************** DECORATOR NODES ***********************************/

BehaviourTree.prototype.addConditionalNode = function(id,title, property_to_compare, limit_value )
{
    let node = new Node();
    node.properties = {};
    node.id = id;
    node.boxcolor = "#fff";

    node.title = title;
    node.type = "conditional";
    node.tree = this.id;
    node.children = [];
    node.blackboard = blackboard;
    node.properties.id = id;
    // node.properties.type = NODETYPES["conditional"];
    node.property_to_compare = property_to_compare;
    node.limit_value = limit_value;
    this.value = 0;
    // console.log(node);

    // node.addCondition = (function(condition){ this.conditional_expression = condition }).bind(node);
    node.conditional_expression = function(agent)
    {
        // console.log("AGENT", agent);
        var property = this.property_to_compare.toLowerCase();

        if(agent.blackboard[property] != null)
        {
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

BehaviourTree.prototype.addInTargetNode = function(id, threshold )
{
    let node = new Node();
    node.id = id;
    node.type = "intarget";
    this.value = 0;
    node.threshold = threshold;
    node.children = [];

    node.isInTarget = function(agent)
    {
        // var state = agent.state;
        // debugger;
        if(agent.inTarget(agent.target, this.threshold))
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

BehaviourTree.prototype.addAnimationNode = function(id, anims, speed, motion )
{
    let node = new Node();
    node.id = id;
    node.type = "animation";
    this.value = 0;
    node.anims = anims;
    node.params = {};
    node.params.speed = speed;
    node.params.motion = motion;
    
    node.action = function(agent)
    {
        var behaviour = {};
        // console.log("AGENT", agent);
        // console.log(anims);
        behaviour.animations_to_merge = this.anims;
        behaviour.params = this.params;
        behaviour.type = "mixing";
        behaviour.author = "manuel";
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
